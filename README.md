# agy-codex-review

English | [简体中文](./README.zh-CN.md)

An [Antigravity CLI (`agy`)](https://antigravity.google) plugin that integrates OpenAI's official read-only Codex code reviewer (`codex-plugin-cc` v1.0.6) via a local MCP server.

## Features

- **Read-Only Code Review**: Runs OpenAI's native Codex reviewer against your current Git working tree or branch diff without modifying files.
- **Adversarial Review**: Supports `/codex:adversarial-review` with optional focus text to probe edge cases, logic bugs, and security risks.
- **Foreground & Background Modes**: Supports `--wait` and `--background`. When neither flag is passed, it inspects the diff size first and recommends the appropriate mode.
- **Job Management**: Track active and recent jobs (`/codex:status`), read full stored reports (`/codex:result`), and cancel running jobs (`/codex:cancel`).
- **Session Isolation**: Includes a `SessionStart` hook that passes the active `agy` conversation ID to scope jobs per session.

## Prerequisites

- [Antigravity CLI (`agy`)](https://antigravity.google)
- **Node.js** (`node` available in `PATH`)
- **OpenAI Codex CLI** installed and authenticated
- A **Git** repository

## Installation

### 1. Install the Plugin

Clone the repository directly into Antigravity's global plugins directory:

```bash
git clone https://github.com/HanryYu/agy-codex-review.git ~/.gemini/config/plugins/codex
```

Or install from a local clone via `agy`:

```bash
git clone https://github.com/HanryYu/agy-codex-review.git /tmp/agy-codex-review
agy plugin install /tmp/agy-codex-review
```

### 2. Optional: Enable `/review` Shortcut

To use `/review` as a shorthand for `/codex:review` in `agy`:

```bash
mkdir -p ~/.gemini/antigravity-cli/skills/review
cp ~/.gemini/config/plugins/codex/extras/agy-cli/skills/review/SKILL.md ~/.gemini/antigravity-cli/skills/review/SKILL.md
```

### 3. Verify Setup

Start `agy` in any Git repository and run:

```text
/codex:setup
```

This checks whether the Codex CLI and authentication are ready (diagnostic only).

## Usage

All commands are explicitly invoked as slash commands in `agy`:

| Command | Description |
| :--- | :--- |
| `/codex:review [options]` | Run a native read-only Codex review |
| `/codex:adversarial-review [options] [focus]` | Run an adversarial review with optional focus text |
| `/codex:status [job-id]` | Show active/recent jobs for this repo, or details for one job |
| `/codex:result [job-id]` | Show the full stored result of a completed job |
| `/codex:cancel [job-id]` | Cancel a running review job |
| `/codex:setup` | Check Codex runtime and authentication readiness |

### Common Options

- `--wait`: Run in the foreground and return the review directly.
- `--background`: Start in the background; check progress later with `/codex:status` and `/codex:result`.
- `--base <ref>`: Compare against a specific base branch or commit (e.g. `main`, `origin/main`).
- `--scope <auto|working-tree|branch>`: Select the review scope (default: `auto`).
- `-m, --model <model>`: Override the model for this review run.

> If neither `--wait` nor `--background` is provided, the plugin inspects the diff first and recommends waiting for small changes (1–2 files and ≤ 100 lines) or running in the background for larger diffs.

### Model Configuration

The plugin does not hardcode a model. By default, it inherits the model and reasoning settings from your local Codex CLI configuration (`~/.codex/config.toml`).

- **Change default model**: Edit `model` (and optionally `model_reasoning_effort`) in `~/.codex/config.toml`.
- **Override per run**: Pass `--model <model>` or `-m <model>` to `/codex:review` or `/codex:adversarial-review`.

### Examples

```text
# Review current changes (prompts for foreground or background)
/codex:review

# Review current branch against main in the background
/codex:review --background --base main

# Review with a specific model
/codex:review --model <model-name>

# Adversarial review with custom focus
/codex:adversarial-review --wait focus on auth checks and error handling

# Check job status and retrieve the full report
/codex:status
/codex:result <job-id>

# Cancel an active job
/codex:cancel <job-id>
```

## License & Attribution

- Licensed under the **Apache License 2.0**. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
- Bundles unmodified upstream [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) (`v1.0.6`) under `vendor/codex-plugin-cc-v1.0.6/`.
