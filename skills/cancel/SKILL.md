---
name: cancel
description: Cancel an active Codex job in this repository. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_cancel` once with the arguments after `/codex:cancel` unchanged (or `""`), the absolute current workspace `cwd`, and the `conversation_id` from the Codex SessionStart hook if available. Return the official companion output verbatim. Do not interrupt any non-Codex task or start a new review.
