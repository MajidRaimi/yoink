---
title: yoink vs Claude Code Router
seoTitle: "yoink vs Claude Code Router: gateway or native config · Yoink"
description: "Claude Code Router is a local gateway that routes agents' requests to the providers you pick. yoink writes provider keys into each agent's config instead."
nav: yoink vs Claude Code Router
order: 5
competitor:
  name: Claude Code Router
  url: https://github.com/musistudio/claude-code-router
  version: v3.1.3
  checked: "2026-10-10"
related:
  - docs/providers.md
  - docs/compare/cc-switch.md
---

# yoink vs Claude Code Router

Also at [yoink.codes/compare/claude-code-router/](https://yoink.codes/compare/claude-code-router/).

Claude Code Router (CCR) describes itself as "a local model gateway and control plane for coding agents": agents talk to one local endpoint, and CCR routes each request to a provider, retries and falls back, and logs it. yoink runs no gateway. It writes a provider's own URL and key into each harness config, such as `ANTHROPIC_BASE_URL` for Claude Code.

## Where the request goes

The difference is what sits between your coding agent and the model.

- **Claude Code Router.** You add providers in CCR, start its server (the gateway listens on `http://127.0.0.1:3456` by default), then apply an agent profile so the agent talks to that address. Every request passes through CCR, which picks the provider, model and credential, and can rewrite the request on the way.
- **yoink.** You add a provider once, and yoink writes it into the harness's config file. For Claude Code that is seven env keys in `~/.claude/settings.json`; for opencode it is a `provider` entry in `opencode.json`. After that the agent calls the provider directly, and yoink is not running.

```bash
yoink connect openrouter --to claude-code --default z-ai/glm-4.7
```

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_AUTH_TOKEN": "<your key>",
    "ANTHROPIC_MODEL": "z-ai/glm-4.7"
  }
}
```

The real file also sets the Opus, Sonnet and Haiku tiers and `CLAUDE_CODE_SUBAGENT_MODEL` to the same model. The full list is in [Security](../security.md#seven-managed-keys-in-claude-code).

## What a gateway can do that yoink cannot

A process in the request path can act on every request. CCR's README lists conditions on headers and bodies, request rewrites, retries, ordered fallback models, credential pools with key rotation, and per-request logs with tokens, latency and estimated cost. It also adds vision, web search and MCP tools to models through its Fusion and ToolHub features, and issues its own client keys with request and token limits.

yoink has no equivalent for any of these. It does not choose a model per request or per task, retry, fail over, or count tokens. A harness gets one provider entry per connection, and you pick the model inside the harness.

## What yoink does that CCR does not document

- **Subscription logins.** yoink saves and switches several Claude Code accounts, plus ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins, each inside its own tool. CCR's README mentions local login import for providers, not switching between saved subscription logins.
- **Harnesses outside CCR's list.** yoink writes omp, Qwen Code, Droid, Crush, Continue, Goose and Zed configs.
- **Guards on the key.** yoink refuses to write a key into a git-tracked config unless you pass `--allow-tracked`, and scripts pass keys on stdin.

## Side by side

| Feature | Claude Code Router | yoink |
| --- | --- | --- |
| Local gateway in the request path | [Yes](https://github.com/musistudio/claude-code-router#how-it-works) | No |
| Routing rules, retries and fallback models | [Yes](https://github.com/musistudio/claude-code-router#core-capabilities) | No |
| Request logs, token counts and cost estimates | [Yes](https://github.com/musistudio/claude-code-router#core-capabilities) | No |
| Provider presets and custom endpoints with probing | [Yes](https://github.com/musistudio/claude-code-router#core-capabilities) | [Yes](../providers.md#custom-providers-and-endpoint-probing) |
| Claude Code, Codex, OpenCode, Pi, Kilo Code | [Yes](https://github.com/musistudio/claude-code-router#why-use-claude-code-router) | [Yes](../harnesses.md#supported-harnesses) |
| Claude Design, Grok CLI, Kimi CLI, ZCode, WorkBuddy | [Yes](https://github.com/musistudio/claude-code-router#why-use-claude-code-router) | No |
| omp, Qwen Code, Droid, Crush, Continue, Goose, Zed | Not documented | [Yes](../harnesses.md#supported-harnesses) |
| Switches saved subscription logins | Not documented | [Yes](../subscriptions.md) |
| Desktop app | [Yes](https://github.com/musistudio/claude-code-router#desktop-app-recommended), Windows, Linux, macOS | [Yes](../desktop.md), macOS |
| CLI install | [`npm install -g @musistudio/claude-code-router`](https://github.com/musistudio/claude-code-router#cli), Node.js 22 or newer | [`npm install -g yoink-cli`](../getting-started.md#install), or a binary with no runtime |
| License | MIT | MIT |

A yoink limit worth knowing: with no gateway, a provider only reaches a harness through a protocol both already speak. codex needs an OpenAI Responses endpoint, so the `openrouter` preset cannot reach it; Claude Code needs Anthropic Messages, so the `ollama` preset cannot reach it. A gateway that converts formats does not have that limit.

## Choose Claude Code Router if

- You want rules that send different requests to different models or providers.
- You want retries, fallbacks and pooled credentials when a provider fails or rate-limits.
- You want to see every request with its tokens, latency and cost.
- You use Grok CLI, Kimi CLI, ZCode, WorkBuddy or Claude Design.

## Choose yoink if

- You want each agent to call its provider directly, with no local server to keep running.
- You use omp, Qwen Code, Droid, Crush, Continue, Goose or Zed.
- You switch between several Claude Code, Codex, Kimi Code, Gemini or Copilot logins.

If you try both, let one tool own each agent's provider settings, since both change them.
