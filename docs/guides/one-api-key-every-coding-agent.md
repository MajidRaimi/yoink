---
title: One API key in every coding agent
seoTitle: "Use one API key in every coding agent you run · Yoink CLI"
description: "Add an API key once and yoink writes it into the native config of up to 13 coding agents: pi, opencode, codex, Claude Code, Qwen Code, Crush and more."
nav: One key, every agent
order: 7
related:
  - docs/harnesses.md
  - docs/providers.md
  - docs/compare/index.md
---

# One API key in every coding agent

Also at [yoink.codes/guides/one-api-key-every-coding-agent/](https://yoink.codes/guides/one-api-key-every-coding-agent/).

To use one API key in several coding agents, add it to yoink once with `yoink add`, then run `yoink connect <name> --to pi,opencode,codex` for the agents you use. yoink writes the key, base URL and models into each agent's own config file, and `yoink edit` re-syncs all of them when the key or the model list changes.

## The short answer

```bash
echo "$OPENAI_API_KEY" | yoink add --external --name openai-api --preset openai \
  --models gpt-5.2,gpt-5.2-codex --connect pi,codex --default gpt-5.2-codex --token-stdin
yoink connect openai-api --to qwen,kilo,crush,continue
yoink status openai-api
```

The first command saves the provider and connects it to pi and codex in one go. The second adds four more agents. The profile id is `openai-api` rather than `openai` because Codex reserves `openai` for its built-in provider and ignores a config table with that id; the [codex page](../harnesses/codex.md#pick-a-profile-id-codex-does-not-reserve) explains the clash. `yoink status openai-api` prints one line per harness: connected (with its default model), available, incompatible, or not installed, plus the config path. In an interactive terminal, `yoink add` and a bare `yoink connect openai-api` show the same choices as a checklist.

## Why each agent wants its own config

Every coding agent reads providers from its own file, in its own shape. pi wants `~/.pi/agent/models.json` with a `models` array and context limits per model. opencode and Kilo Code want an `@ai-sdk` package name and an `options.baseURL` in JSON or JSONC. codex wants a `[model_providers.<id>]` TOML table with `wire_api = "responses"`. omp and Continue use YAML, Qwen Code keeps the key in an `env` block, and Claude Code takes seven `ANTHROPIC_*` env keys. Pasting one key into 13 formats by hand works once; keeping them in step after a key rotation is the part that breaks. The [harness table](../harnesses.md#supported-harnesses) lists every path and format yoink writes, and each harness has its own page with the exact entry yoink adds:

- [pi](../harnesses/pi.md)
- [omp](../harnesses/omp.md)
- [opencode](../harnesses/opencode.md)
- [codex](../harnesses/codex.md)
- [Claude Code](../harnesses/claude-code.md)
- [Qwen Code](../harnesses/qwen.md)
- [Kilo Code](../harnesses/kilo.md)
- [Droid](../harnesses/droid.md)
- [Crush](../harnesses/crush.md)
- [Goose](../harnesses/goose.md)
- [Zed](../harnesses/zed.md)
- [Continue](../harnesses/continue.md)
- [Claude Desktop](../harnesses/claude-desktop.md)

## Which provider reaches which agent

A key is only as portable as the protocols its provider speaks. Each harness takes the first protocol in its own preference order that the provider offers:

| Harness | Preference order | Presets that reach it |
| --- | --- | --- |
| pi, omp, Qwen Code, Zed | `openai-chat`, `openai-responses`, `anthropic-messages` | all 7 |
| opencode, Kilo Code | `openai-chat`, `anthropic-messages`, `openai-responses` | all 7 |
| Droid | `anthropic-messages`, `openai-responses`, `openai-chat` | all 7 |
| Crush, Goose, Continue | `openai-chat`, `anthropic-messages` | all 7 |
| codex | `openai-responses` only | `openai` |
| Claude Code, Claude Desktop | `anthropic-messages` only | `kimi-code`, `moonshot`, `openrouter`, `deepseek`, `zai` |

Counted per preset, `openai` reaches 11 harnesses, the five dual-endpoint presets reach 12 (all but codex), and `ollama` reaches 10 (not codex, Claude Code or Claude Desktop). No preset reaches all 13. A custom endpoint can, but only if its probe finds both a `/responses` route and a `/v1/messages` route. The order matters in practice: Droid gets the Anthropic URL of a dual-endpoint preset, while pi and Crush get its Chat URL.

## Rotate a key or change models once

```bash
echo "$NEW_OPENAI_API_KEY" | yoink edit openai-api --token-stdin
yoink models openai-api --set gpt-5.2,gpt-5.2-codex
yoink rename openai-api work-openai
```

Each of these saves the change and re-writes the provider into every harness it is connected to. A harness default model survives as long as that model is still selected. A rename removes the old entry from each harness before writing the new one, so you never end up with both. After a key rotation, yoink also scrubs the retired key out of any `<file>.yoink.bak` backup it touched during that re-sync, so the old key does not linger on disk next to the new one.

Each harness also keeps its own default. `yoink connect openai-api --to codex --default gpt-5.2-codex` and `yoink connect openai-api --to pi --default gpt-5.2` can coexist; yoink records the default per harness and keeps it through every re-sync.

## Native config, not a proxy

yoink runs only when you call it. It writes files and exits, so nothing sits between an agent and the provider: requests go straight from the agent to the provider's own URL, and an agent keeps working if yoink is uninstalled. That is the main difference from an AI gateway or a routing proxy, which give every agent one local endpoint and forward the traffic. A gateway can do things yoink cannot, such as routing rules or fallback between providers. yoink's trade is no extra process and no extra hop. The [switcher comparison](../compare/index.md) covers the account-switching side of this space.

## Disconnect cleanly

```bash
yoink disconnect openai-api --from crush
yoink remove openai-api
```

`yoink disconnect` deletes yoink's entry from the named harnesses and clears any default that pointed at it. `yoink remove` disconnects the provider from every harness first and deletes the profile only when every one of those updates succeeds. If one fails, for example because a config no longer parses, yoink keeps the profile, names the failing harness and tells you to run `yoink remove` again once it is fixed. Nothing is left half-removed.

## FAQ

### Do I have to restart my agents after a change?

Yes, for any agent that is already running. yoink writes the config file, and most agents read it at start. A new session picks up the new key or model.

### What happens if one harness fails during a connect?

The other harnesses still get the provider. yoink prints a line per harness, marks the one that failed with its reason, and exits non-zero so a script notices. A common case is a config file tracked by git, which yoink refuses to write a key into unless you pass `--allow-tracked`.

### Can I bring in keys I already pasted into my agents?

Yes. `yoink import` reads the configs you set up by hand and turns each literal key into a provider yoink manages. See [Import the providers you already configured](./import-existing-provider-configs.md).
