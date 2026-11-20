---
name: setup
description: Report whether Codex is installed and authenticated. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_setup` with the argument tail unchanged, the absolute workspace `cwd`, and the `conversation_id` from the Codex SessionStart hook if available. Return its output verbatim. In agy this is diagnostic only: do not install software, change authentication, or enable the Claude-only stop gate.
