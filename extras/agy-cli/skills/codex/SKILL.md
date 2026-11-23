---
name: codex
description: Send a task directly to Codex with workspace edits enabled by default. Use only when explicitly invoked.
disable-model-invocation: true
---

`/codex [--model <model>] [--effort <level>] [--read-only] [--background] <task>`

Use `mcp_codex_local_rescue_write` by default so Codex can edit the workspace. Use `mcp_codex_local_rescue` instead if the user supplies the leading `--read-only` flag. A leading `--write` is optional and redundant; if both are present, use read-only mode.

Pass leading `--model <model>` as `model` and leading `--effort <level>` as `effort`. Omit either field if its flag was not supplied; do not infer a value. If either flag is missing its value, ask before calling the tool.

Pass the task text unchanged as `prompt`, without the leading flags. Use the active workspace's absolute path as `cwd` and the exact `conversation_id` from the Codex SessionStart hook if available. Set `background: true` only for a leading `--background`. If no task is provided, ask what Codex should do.

Use agy's MCP permission prompt if shown. Do not run Bash, do the task yourself, or substitute another model. Return the companion's output. If a task is queued, show its job ID and `/codex:status <job-id>` without waiting for completion; `/codex:result <job-id>` returns the stored result.
