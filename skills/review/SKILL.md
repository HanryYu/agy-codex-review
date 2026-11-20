---
name: review
description: Run OpenAI's native Codex review; review current Git changes or a branch against its base. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_review`. Send the raw argument tail after `/review` or `/codex:review` unchanged as `arguments` (or `""`), the current workspace's absolute `cwd`, and the exact `conversation_id` from the Codex SessionStart hook if available.

The companion supports `[--wait|--background] [--base <ref>] [--scope auto|working-tree|branch]`. Do not translate `--commit`, `--uncommitted`, or focus text into supported options. Let the official reviewer report unsupported arguments.

- If explicitly given `--wait` or `--background`, call the tool without asking how to run.
- Otherwise call it with `mode: "inspect"`. If it returns `nothing-to-review`, report that and stop. If it returns `choose-mode`, use `ask_question` exactly once with `Wait for results` and `Run in background`. Put the tool's recommendation first and append ` (Recommended)` to that label. If the user chooses, call the tool again with the same raw arguments and `mode: "wait"` or `"background"`. If the user cancels, stop.

Use the MCP permission prompt if shown, not Bash or sandbox bypass. Return the official companion's text verbatim, beginning with its first line; omit agy's outer `Created At` and `Completed At` tool metadata. Do not add headings, summaries, or commentary. If launched in background, do not poll or wait in this turn. Do not review the code yourself, start a substitute model, or apply fixes.
