# agy-codex-review

[English](./README.md) | 简体中文

一个用于 **[Antigravity CLI (`agy`)](https://antigravity.google)** 的插件，通过本地 MCP 服务调用 OpenAI 官方 Codex，执行代码审查或编码任务（基于 `codex-plugin-cc` v1.0.6）。

## 功能特性

- **只读代码审查**：调用 OpenAI 官方 Codex reviewer 审查当前 Git 工作区改动或分支 diff，不会修改代码。
- **对抗式审查**：支持 `/codex:adversarial-review` 并附带自定义关注点（focus text），深挖边界条件、逻辑漏洞与潜在风险。
- **前后台运行模式**：支持 `--wait`（前台等待）和 `--background`（后台异步）；未指定时会自动检测改动规模并推荐合适模式。
- **任务管理**：支持查看任务状态（`/codex:status`）、读取完整审查结果（`/codex:result`）以及取消运行中的任务（`/codex:cancel`）。
- **会话隔离**：内置 `SessionStart` hook，自动绑定当前 `agy` 会话 ID，隔离不同对话的审查任务。

## 环境要求

- [Antigravity CLI (`agy`)](https://antigravity.google)
- **Node.js**（`node` 需在 `PATH` 中可用）
- **OpenAI Codex CLI** 已安装并完成登录认证
- 当前目录为 **Git** 仓库

## 安装方法

### 1. 安装插件

直接将仓库克隆到 Antigravity 的全局插件目录：

```bash
git clone https://github.com/HanryYu/agy-codex-review.git ~/.gemini/config/plugins/codex
```

或者先克隆到本地，再通过 `agy` 命令安装：

```bash
git clone https://github.com/HanryYu/agy-codex-review.git /tmp/agy-codex-review
agy plugin install /tmp/agy-codex-review
```

### 2. 可选：启用快捷命令

在 `agy` 中用 `/review` 代替 `/codex:review`，用 `/codex` 快速把任务交给 Codex。`/codex` 默认允许编辑工作区：

```bash
mkdir -p ~/.gemini/antigravity-cli/skills/review
cp ~/.gemini/config/plugins/codex/extras/agy-cli/skills/review/SKILL.md ~/.gemini/antigravity-cli/skills/review/SKILL.md
mkdir -p ~/.gemini/antigravity-cli/skills/codex
cp ~/.gemini/config/plugins/codex/extras/agy-cli/skills/codex/SKILL.md ~/.gemini/antigravity-cli/skills/codex/SKILL.md
```

### 3. 验证安装

在任意 Git 仓库中启动 `agy` 并执行：

```text
/codex:setup
```

该命令仅用于诊断 Codex CLI 与认证状态，不会自动安装或修改配置。

## 使用方法

所有功能均通过 `agy` 的斜杠命令显式触发：

| 命令 | 说明 |
| :--- | :--- |
| `/codex:review [options]` | 执行原生只读代码审查 |
| `/codex:adversarial-review [options] [focus]` | 执行对抗式审查（可附加审查重点） |
| `/codex:rescue [选项] <任务>` | 把任务直接交给 Codex。默认只读，`--write` 允许修改工作区。 |
| `/codex [选项] <任务>` | 可选快捷命令，默认允许修改工作区。加 `--read-only` 切换到只读。 |
| `/codex:status [job-id]` | 查看当前仓库的任务列表或单个任务状态 |
| `/codex:result [job-id]` | 查看已完成任务的完整结果 |
| `/codex:cancel [job-id]` | 取消正在运行的 Codex 任务 |
| `/codex:setup` | 检查 Codex 环境与登录状态 |

### 常用参数

- `--wait`：在前台等待审查完成后直接返回结果。
- `--background`：在后台启动审查任务，稍后用 `/codex:status` 和 `/codex:result` 查看。
- `--base <ref>`：指定对比的基准分支或提交（如 `main`、`origin/main`）。
- `--scope <auto|working-tree|branch>`：指定审查范围（默认 `auto`）。
- `-m, --model <model>`：为本次审查临时指定模型。

> 未指定 `--wait` 或 `--background` 时，插件会先统计改动文件数和行数：改动较小（1–2 个文件且 ≤ 100 行）时推荐前台等待，较大时推荐后台运行。

`/codex` 和 `/codex:rescue` 默认在前台等待。选项放在任务文本之前。后台任务可用 `/codex:status <job-id>` 查进度，用 `/codex:result <job-id>` 取结果。

### 模型设置

插件本身不硬编码模型，默认直接沿用本机 Codex CLI 的配置（`~/.codex/config.toml`）。

- **修改默认模型**：在 `~/.codex/config.toml` 中调整 `model`（以及可选的 `model_reasoning_effort`）。
- **任务**：在 `/codex` 或 `/codex:rescue` 的任务文本前加 `--model <模型>`、`--effort <强度>`，两项可独立指定。强度取值为 `none`、`minimal`、`low`、`medium`、`high`、`xhigh`，具体支持哪些档位取决于模型。
- **审查**：用 `/codex:review` 或 `/codex:adversarial-review` 时，可以加 `--model <模型>` 或 `-m <模型>`。

### 使用示例

```text
# 审查当前改动（自动评估改动量并询问前/后台运行）
/codex:review

# 后台审查当前分支相对于 main 的改动
/codex:review --background --base main

# 临时指定模型进行审查
/codex:review --model <model-name>

# 针对权限校验与边界条件进行对抗式审查
/codex:adversarial-review --wait focus on auth checks and error handling

# 让 Codex 排查，但不修改文件
/codex --read-only 分析测试失败的原因

# 允许 Codex 修改工作区，在后台运行并返回任务 ID
/codex --model gpt-6.2-sol --effort high --background 修复失败的测试

# 查看任务进度并获取完整审查报告
/codex:status
/codex:result <job-id>

# 取消进行中的任务
/codex:cancel <job-id>
```

## 许可与致谢

- 本项目基于 **Apache License 2.0** 开源，详见 [LICENSE](./LICENSE) 与 [NOTICE](./NOTICE)。
- 在 `vendor/codex-plugin-cc-v1.0.6/` 中原样包含了上游项目 [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)（`v1.0.6`）。
