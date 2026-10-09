---
title: yoink vs CC Switch
seoTitle: "yoink vs CC Switch for coding agent providers · Yoink"
description: "CC Switch is a GUI-first desktop app with a routing proxy and many presets. yoink is a terminal-first CLI that writes native configs for 13 coding agents."
nav: yoink vs CC Switch
order: 3
competitor:
  name: CC Switch
  url: https://github.com/farion1231/cc-switch
  version: v4.0.6
  checked: "2026-10-10"
related:
  - docs/providers.md
  - docs/harnesses.md
---

# yoink vs CC Switch

Also at [yoink.codes/compare/cc-switch/](https://yoink.codes/compare/cc-switch/).

CC Switch calls itself "the All-in-One Manager" for ten coding tools: a desktop app that switches API providers in one click, with an optional local routing proxy, MCP, skills and prompts panels, and usage tracking. yoink is a terminal-first CLI that writes providers natively into 13 coding harnesses and saves several subscription logins per tool.

## Two ways to point an agent at a provider

Both tools start from the same place: every coding agent keeps its provider in its own JSON, TOML or YAML file, and editing those by hand gets old. They differ in what ends up in that file.

- **CC Switch, Direct mode.** It replaces the connection fields (endpoint, key, model) in the tool's config and leaves your plugins, hooks and comments alone, backing up each file to `~/.cc-switch/backups/live-first-write/` before the first rewrite.
- **CC Switch, Routing mode.** The tool's config points at a local address (`http://127.0.0.1:15721` by default) with the placeholder key `PROXY_MANAGED`, and CC Switch forwards each request to the real provider. That is how it converts between Anthropic Messages, OpenAI Chat, OpenAI Responses and Gemini, fails over to the next provider in a queue, and lets Claude Code use an OpenAI-format provider. When you quit CC Switch, it writes the direct config back.
- **yoink.** It writes the provider's own URL and key into each harness config, then exits. Nothing runs between the agent and the provider. The trade is that a pairing only works when the provider already speaks the harness's protocol, so yoink refuses the ones that do not:

```bash
yoink connect openrouter --to codex
```

```text
✖ codex: openrouter has no endpoint codex can use (needs one of: openai-responses).
```

Neither approach is free of cost. A proxy can convert formats and fail over, and it has to be running. A native config keeps working with yoink closed or uninstalled, and it cannot translate a protocol the provider lacks. [Harnesses](../harnesses.md#supported-harnesses) lists each harness's protocols.

## Which coding agents each one covers

| Agent | CC Switch providers | yoink providers |
| --- | --- | --- |
| Claude Code | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool), one at a time | [Yes](../providers.md#claude-code-is-exclusive), one at a time |
| Claude Desktop | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool) | [Yes](../harnesses.md#the-newer-harnesses), experimental |
| Codex | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool) | [Yes](../harnesses.md#codex-is-responses-only), Responses endpoints only |
| OpenCode | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool) | [Yes](../harnesses.md#supported-harnesses) |
| Pi | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool) | [Yes](../harnesses.md#supported-harnesses) |
| Gemini CLI | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool) | No (yoink switches [Gemini logins](../subscriptions.md#gemini) instead) |
| Grok Build, OpenClaw, Hermes, MiniMax Code | [Yes](https://github.com/farion1231/cc-switch#supported-features-by-tool) | No |
| omp, Qwen Code, Kilo Code, Droid, Crush, Continue | Not documented | [Yes](../harnesses.md#supported-harnesses) |
| Goose, Zed | Not documented | [Yes](../harnesses.md#the-newer-harnesses), experimental |

CC Switch splits its tools into "Switch" (one active provider) and "Coexist" (several providers written at once). yoink has the same split: Claude Code holds one provider at a time, and the other harnesses hold as many as you connect.

## Feature by feature

| Feature | CC Switch | yoink |
| --- | --- | --- |
| Desktop GUI on Windows and Linux | [Yes](https://github.com/farion1231/cc-switch#system-requirements) | No |
| macOS app | [Yes](https://github.com/farion1231/cc-switch#macos-users) | [Yes](../desktop.md), Claude accounts and providers only |
| Command line | [No](https://github.com/farion1231/cc-switch#faq), the [community-maintained CC Switch CLI](https://github.com/SaladDay/cc-switch-cli) covers it | [Yes](../usage.md) |
| Provider presets | [Yes](https://github.com/farion1231/cc-switch#provider-management), 90+ on the date above | [Yes](../providers.md#presets), seven, plus any URL it probes |
| Local routing, format conversion, failover | [Yes](https://github.com/farion1231/cc-switch#local-routing--failover) | No |
| MCP, skills and prompts management | [Yes](https://github.com/farion1231/cc-switch#mcp-prompts--skills) | No |
| Usage, quotas and balances | [Yes](https://github.com/farion1231/cc-switch#usage--cost-tracking) | No |
| Imports existing configs | [Yes](https://github.com/farion1231/cc-switch#mcp-prompts-skills-projects--sessions), on first launch | [Yes](../harnesses.md#yoink-import), `yoink import` |
| Several Claude Code subscription logins | Not documented | [Yes](../how-it-works.md#a-switch-step-by-step) |
| Several ChatGPT logins for Codex | [Yes](https://github.com/farion1231/cc-switch#faq), per OpenAI Official card | [Yes](../subscriptions.md#chatgpt-codex) |
| Kimi Code, Gemini and Copilot logins switched inside each tool | Not documented | [Yes](../subscriptions.md#supported-tools) |
| Copilot or xAI subscriptions used as a provider in another tool | [Yes](https://github.com/farion1231/cc-switch#provider-management), beta, through routing | No |
| Refuses to write a key into a git-tracked config | Not documented | [Yes](../security.md#git-tracked-configs) |
| Keys on stdin and JSON output for scripts | Not documented | [Yes](../security.md#keys-stay-off-the-command-line) |
| License | MIT | MIT |

The yoink "No" on subscriptions as providers reflects how it works: yoink never copies a subscription token from one tool into another.

## Choose CC Switch if

- You want a GUI on Windows, Linux or macOS, with tray switching.
- You want Claude Code on an OpenAI- or Gemini-format provider, or Codex on an Anthropic one, through format conversion.
- You want failover between providers, or one model list that mixes several providers.
- You want MCP servers, skills and prompts managed in one place, or usage and quota at a glance.
- You use Gemini CLI, Grok Build, OpenClaw, Hermes or MiniMax Code.

## Choose yoink if

- You work in a terminal or over SSH, and want to script setup with `yoink add --external`, keys on `--token-stdin` and `--json` output.
- You use omp, Qwen Code, Kilo Code, Droid, Crush, Continue, Goose or Zed.
- You keep several Claude Code accounts, or several Kimi Code, Gemini or Copilot logins, and switch between them.
- You want nothing running between your agent and the provider.

```bash
echo "$OPENROUTER_API_KEY" | yoink add --external --name openrouter --preset openrouter \
  --models z-ai/glm-4.7 --connect opencode,crush --default z-ai/glm-4.7 --token-stdin
```

## Can you use both?

Yes, if each agent has one owner. Both tools rewrite provider fields in the same files for Claude Code, Codex, OpenCode and Pi, and each keeps its own record of what is active, so two owners for one file drift apart. A split that works: CC Switch for Gemini CLI, Grok Build and routing, yoink for Crush, Droid, Continue, Qwen Code and your subscription logins.

## FAQ

### Does yoink run a local proxy like CC Switch's Routing mode?

No. yoink writes each harness's own config file and exits, so it cannot convert between API formats or fail over. A provider reaches a harness only through an endpoint the harness already speaks, which is why yoink checks a custom URL's `/v1/messages`, `/chat/completions` and `/responses` routes when you add it.

### Is there a terminal version of CC Switch?

CC Switch itself ships only as a desktop app. Its README points to the community-maintained CC Switch CLI for servers and SSH sessions, which shares the `~/.cc-switch` data directory and covers fewer tools than the app.
