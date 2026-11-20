---
name: result
description: Show the full stored result for a completed Codex job. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_result` once with the arguments after `/codex:result` unchanged (or `""`), the absolute current workspace `cwd`, and the `conversation_id` from the Codex SessionStart hook if available. Return its full output verbatim, including paths, line numbers, errors, findings, and follow-up commands. Do not apply fixes or substitute a local review.
