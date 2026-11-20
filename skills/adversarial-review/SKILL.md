---
name: adversarial-review
description: Run the official read-only Codex adversarial review with optional focus text. Use only when explicitly invoked.
disable-model-invocation: true
---

Call `mcp_codex_local_adversarial_review` with the complete argument tail after `/codex:adversarial-review` as `arguments`, unchanged, including flags, quotes, and focus text. Use the absolute current workspace `cwd` and the exact `conversation_id` from the Codex SessionStart hook, if present.

If `--wait` or `--background` was supplied, the tool runs that mode without asking. Otherwise call with `mode: "inspect"`. If it returns `choose-mode`, use `ask_question` once with `Wait for results` and `Run in background`; put the tool's recommendation first and append `(Recommended)` to that label. Then call with the same arguments and the chosen `mode: "wait"` or `"background"`. If the user cancels, stop. If the tool says there is nothing to review, report that and stop.

Return the official tool output verbatim, including the background-start message or any errors. Do not wait on a background job, review the code yourself, or edit files.
