import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { parseArgs, splitRawArgumentString } from '../vendor/codex-plugin-cc-v1.0.6/plugins/codex/scripts/lib/args.mjs';
import { resolveReviewTarget } from '../vendor/codex-plugin-cc-v1.0.6/plugins/codex/scripts/lib/git.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const companion = path.join(root, 'vendor/codex-plugin-cc-v1.0.6/plugins/codex/scripts/codex-companion.mjs');
const commands = {
  review: ['review', 'Run the official native, read-only Codex review.'],
  adversarial_review: ['adversarial-review', 'Run the official read-only Codex adversarial review.'],
  status: ['status', 'Read the official Codex job status for this conversation or a specified job.'],
  result: ['result', 'Return the stored official Codex job result.'],
  cancel: ['cancel', 'Cancel the requested active official Codex job.'],
  setup: ['setup', 'Report Codex runtime and authentication readiness only.'],
};
const isReview = command => command === 'review' || command === 'adversarial-review';
const tools = Object.entries(commands).map(([name, [command, description]]) => ({
  name, description: `${description} Only call at the user's request.`,
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      cwd: { type: 'string', description: 'Absolute path of the current workspace.' },
      arguments: { type: 'string', description: 'The raw slash command argument tail, verbatim; empty if omitted.' },
      conversation_id: { type: 'string', description: 'Exact agy conversation ID from the Codex SessionStart hook.' },
      ...(isReview(command) ? { mode: { enum: ['inspect', 'wait', 'background'], description: 'Inspect only if neither mode flag was supplied and the user has not chosen yet.' } } : {}),
    },
    required: ['cwd', 'arguments'],
  },
  annotations: { readOnlyHint: name !== 'cancel', openWorldHint: isReview(command) },
}));

const data = process.env.PLUGIN_DATA || path.join(os.homedir(), '.gemini', 'antigravity-cli', 'codex-review-data');
fs.mkdirSync(data, { recursive: true, mode: 0o700 });
const hostEnv = {
  ...process.env,
  PATH: [path.join(os.homedir(), '.local/bin'), path.dirname(process.execPath), process.env.PATH, '/usr/bin', '/bin'].filter(Boolean).join(path.delimiter),
  CLAUDE_PLUGIN_DATA: data,
};
for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'CODEX_COMPANION_SESSION_ID']) delete hostEnv[key];

function text(value, error = false) {
  return { content: [{ type: 'text', text: value }], isError: error };
}

function git(cwd, ...args) {
  const run = spawnSync('git', args, {
    cwd, encoding: 'utf8', env: { ...hostEnv, LC_ALL: 'C', GIT_OPTIONAL_LOCKS: '0' },
    maxBuffer: 1024 * 1024, timeout: 5000,
  });
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(run.stderr.trim() || 'Git could not inspect the review scope.');
  return run.stdout.trim();
}

function inspect(cwd, options) {
  const current = options.cwd ? path.resolve(cwd, options.cwd) : cwd;
  const target = resolveReviewTarget(current, { base: options.base, scope: options.scope });
  const workingTree = target.mode === 'working-tree';
  const status = workingTree ? git(current, 'status', '--short', '--untracked-files=all') : '';
  const base = workingTree ? null : git(current, 'rev-parse', '--verify', '--end-of-options', `${target.baseRef}^{commit}`);
  const stats = workingTree ? [git(current, 'diff', '--shortstat', '--cached'), git(current, 'diff', '--shortstat')]
    : [git(current, 'diff', '--shortstat', `${base}...HEAD`, '--')];
  const files = workingTree ? status.split('\n').filter(Boolean).length : Number(stats[0].match(/(\d+) files? changed/)?.[1]);
  const lines = stats.reduce((total, stat) => total + [...stat.matchAll(/(\d+) (?:insertions?|deletions?)/g)].reduce((n, m) => n + Number(m[1]), 0), 0);
  const empty = workingTree ? !status : !stats[0];
  return text(JSON.stringify({ action: empty ? 'nothing-to-review' : 'choose-mode', scope: target.label,
    files: Number.isFinite(files) ? files : null, recommended: files >= 1 && files <= 2 && lines <= 100 ? 'wait' : 'background' }));
}

function stop(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}

async function execute(request, signal) {
  const action = request.name;
  if (!Object.hasOwn(commands, action)) throw new Error('Unknown Codex review tool.');
  const [command] = commands[action];
  const { cwd, arguments: raw, mode, conversation_id: id } = request.arguments ?? {};
  if (typeof cwd !== 'string' || !path.isAbsolute(cwd) || typeof raw !== 'string' || raw.includes('\0')) {
    throw new Error('Pass the absolute workspace path and the exact slash-command arguments.');
  }
  if (id !== undefined && (typeof id !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))) {
    throw new Error('Use the conversation UUID provided by agy, or omit it if unavailable.');
  }
  if (command === 'setup' && raw.trim()) throw new Error('Only diagnostic setup is available in agy; no installer or Claude stop gate is registered.');

  let background = false;
  if (isReview(command)) {
    const { options, positionals } = parseArgs(splitRawArgumentString(raw), {
      valueOptions: ['base', 'scope', 'model', 'cwd'], booleanOptions: ['json', 'background', 'wait'],
      aliasMap: { C: 'cwd', m: 'model' },
    });
    if (options.wait) background = false;
    else if (options.background) background = true;
    else if (command === 'review' && positionals.length) background = false; // Return the official unsupported-arguments error.
    else if (!mode || mode === 'inspect') return inspect(cwd, options);
    else background = mode === 'background';
  }

  // Preserve the one raw argument exactly as the official Claude command does.
  // The companion registers and manages its own jobs, including detached ones.
  const env = { ...hostEnv, ...(id ? { CODEX_COMPANION_SESSION_ID: id } : {}) };
  const child = spawn(process.execPath, [companion, command, raw], {
    cwd, detached: true, env,
    stdio: background ? 'ignore' : ['ignore', 'pipe', 'pipe'],
  });
  if (background) {
    await once(child, 'spawn');
    child.unref();
    return text(command === 'review'
      ? 'Codex review started in the background. Check `/codex:status` for progress.'
      : 'Codex adversarial review started in the background. Check `/codex:status` for progress.');
  }

  let stdout = '', stderr = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  const abort = () => stop(child);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  try {
    const [code, killedBy] = await once(child, 'close');
    return code === 0 ? text(stdout) : text(stdout + (stderr || `Codex companion exited with ${killedBy ?? code}.`), true);
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

const pending = new Map();
const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
const send = (id, body) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...body })}\n`);
input.on('line', line => {
  let request;
  try { request = JSON.parse(line); } catch { return; }
  const { method, id, params = {} } = request;
  if (method === 'notifications/cancelled') pending.get(params.requestId)?.abort();
  if (id == null) return;
  if (method === 'initialize') return send(id, { result: {
    protocolVersion: params.protocolVersion ?? '2024-11-05', capabilities: { tools: {} },
    serverInfo: { name: 'codex-review-agy-adapter', version: '1.2.0' },
  } });
  if (method === 'ping') return send(id, { result: {} });
  if (method === 'tools/list') return send(id, { result: { tools } });
  if (method !== 'tools/call') return send(id, { error: { code: -32601, message: 'Method not found' } });
  const control = new AbortController();
  pending.set(id, control);
  execute(params, control.signal).then(result => {
    if (!control.signal.aborted) send(id, { result });
  }, error => {
    if (!control.signal.aborted) send(id, { result: text(error.message, true) });
  }).finally(() => pending.delete(id));
});
input.on('close', () => { for (const control of pending.values()) control.abort(); });
process.on('SIGTERM', () => input.close());
