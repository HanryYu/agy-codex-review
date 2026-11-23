---
name: rescue
description: Send an implementation or investigation task directly to Codex. Use only when explicitly invoked.
disable-model-invocation: true
---

`/codex:rescue [--write] [--background] <task>`

Use `mcp_codex_local_rescue` by default. Use `mcp_codex_local_rescue_write` only if the user supplies the leading `--write` flag; that tool lets Codex edit the workspace. If the request needs edits but lacks `--write`, ask the user to rerun with it instead of granting write access yourself.

Pass the task text unchanged as `prompt`, without the leading flags. Use the active workspace's absolute path as `cwd` and the exact `conversation_id` from the Codex SessionStart hook if available. Set `background: true` only for a leading `--background`. If no task is provided, ask what Codex should do.

Use agy's MCP permission prompt if shown. Do not run Bash, do the task yourself, or substitute another model. Return the companion's output. If a task is queued, show its job ID and `/codex:status <job-id>` without waiting for completion; `/codex:result <job-id>` returns the stored result.
