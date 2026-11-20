---
name: review
description: Shortcut for /codex:review. Review Git changes with OpenAI's native reviewer. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_review`. Pass the raw argument tail after `/review` unchanged as `arguments` (or `""`), the absolute workspace `cwd`, and the exact `conversation_id` from the Codex SessionStart hook if available. Do not rewrite flags or focus text.

If given `--wait` or `--background`, call the tool without asking how to run. Otherwise call with `mode: "inspect"`. If it returns `nothing-to-review`, report that and stop. If it returns `choose-mode`, use `ask_question` exactly once with `Wait for results` and `Run in background`. Put the recommended option first and append ` (Recommended)` to it. Then call the tool with the same arguments and chosen `mode: "wait"` or `"background"`. If the user cancels, stop.

Use the MCP permission prompt if shown; do not use Bash. Return the official companion text verbatim, beginning with its first line; omit agy's outer `Created At` and `Completed At` tool metadata. Do not poll a background job in the same turn, perform your own review, or edit files.
