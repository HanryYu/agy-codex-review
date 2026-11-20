---
name: status
description: Show active and recent Codex jobs for this repository, or the status of one job. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_status` once with the arguments after `/codex:status` unchanged (or `""`), the absolute current workspace `cwd`, and the `conversation_id` from the Codex SessionStart hook if available. Do not inspect or track jobs yourself.

With a job ID, return the full output unmodified. Without a job ID, present the rows as one compact Markdown table preserving job ID, kind, status, phase, elapsed or duration, summary, and follow-up commands. If no jobs or an error is returned, show the original message. Do not add progress blocks or commentary.
