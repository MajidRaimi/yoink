---
title: Use OpenRouter, Kimi, DeepSeek or z.ai in Claude Code
seoTitle: "Use OpenRouter, Kimi, DeepSeek or z.ai in Claude Code · Yoink"
description: "Point Claude Code at OpenRouter, Kimi, Moonshot, DeepSeek or z.ai and switch back to your subscription in one command. yoink writes and strips 7 env keys."
nav: Claude Code with other providers
order: 6
related:
  - docs/providers/openrouter.md
  - docs/guides/per-project-claude-code-provider.md
  - docs/guides/switch-claude-code-accounts.md
---

# Use OpenRouter, Kimi, DeepSeek or z.ai in Claude Code

Also at [yoink.codes/guides/claude-code-with-openrouter-kimi-deepseek-zai/](https://yoink.codes/guides/claude-code-with-openrouter-kimi-deepseek-zai/).

To run Claude Code on OpenRouter, Kimi Code, Moonshot, DeepSeek or z.ai, add the provider's API key with `yoink add`, then run `yoink connect <name> --to claude-code --default <model>`. yoink writes seven `ANTHROPIC_*` env keys into `~/.claude/settings.json`. Switching to a saved Claude account, such as `yoink work`, strips them and hands Claude Code back to your subscription.

## The short answer

```bash
yoink add
yoink connect openrouter --to claude-code --default z-ai/glm-4.7
yoink current
yoink work
```

`yoink add` walks you through the preset, the hidden key prompt and the model picker. `yoink connect` with `--to claude-code` makes the provider the active Claude Code profile. `yoink current` prints the active profile for each tool, including Claude Code, and `yoink work` (or `yoink use work`) switches back to the Claude account you saved as `work`. Restart Claude Code after each switch so it reads the new settings.

## What Claude Code needs

Claude Code talks to one backend over the Anthropic Messages API. Pointing it at another provider means setting `ANTHROPIC_BASE_URL` to an endpoint that speaks that protocol, plus a token and model names. In yoink's terms, Claude Code accepts only providers with an `anthropic-messages` endpoint, and it holds one at a time: connecting a provider to it switches the active profile, like `yoink use <provider>`. One difference: `yoink use` and the interactive checklist ask before changing a running Claude Code, while a scripted `yoink connect <provider> --to claude-code` switches without that check, so quit Claude Code first. pi, opencode and codex can keep many providers side by side; Claude Code cannot.

## Endpoints per provider

Five of the seven presets ship an Anthropic Messages endpoint, so all five work in Claude Code:

| Preset id | Provider | Anthropic Messages endpoint |
| --- | --- | --- |
| `openrouter` | OpenRouter | `https://openrouter.ai/api` |
| `kimi-code` | Kimi Code | `https://api.kimi.com/coding` |
| `moonshot` | Moonshot AI | `https://api.moonshot.ai/anthropic` |
| `deepseek` | DeepSeek | `https://api.deepseek.com/anthropic` |
| `zai` | Z.ai | `https://api.z.ai/api/anthropic` |

`yoink presets` prints the full list with every protocol each preset speaks. The [preset table](../providers.md#presets) has the OpenAI Chat URLs the other harnesses use.

## Connect a provider

Interactively, run `yoink add`, choose **Provider (API key)**, pick the preset, paste the key and select models. When the harness list appears, tick Claude Code. yoink asks whether to apply it **Globally** or to **This project only**, then asks for the model. From a script, pass the key on stdin so it never lands in your shell history:

```bash
echo "$DEEPSEEK_API_KEY" | yoink add --external --name deepseek --preset deepseek \
  --models <model> --token-stdin
yoink connect deepseek --to claude-code --default <model>
```

Without `--default`, Claude Code keeps the last model you used with that provider there, or takes the provider's first selected model. A `--default` that is not one of the provider's selected models is refused, and the error lists the ones you can use.

## The seven keys yoink writes

yoink merges these into the `env` block of `~/.claude/settings.json` (or the file under `CLAUDE_CONFIG_DIR` when that is set) and leaves every other key alone:

| Key | Value |
| --- | --- |
| `ANTHROPIC_BASE_URL` | The provider's Anthropic Messages endpoint |
| `ANTHROPIC_AUTH_TOKEN` | Your API key |
| `ANTHROPIC_MODEL` | The default model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | The same model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | The same model |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | The same model |
| `CLAUDE_CODE_SUBAGENT_MODEL` | The same model |

One model fills every tier, so every request Claude Code makes, subagents and background calls included, goes to a model you selected for that provider. If git tracks `~/.claude/settings.json`, for example through a dotfiles repo, the interactive flow asks before writing the key there, and the scripted `yoink connect` refuses unless you add `--allow-tracked`.

## Switch back to your Claude subscription

```bash
yoink use work
yoink use deepseek
```

Switching to a saved Claude account restores that login and deletes the same seven keys, so the subscription takes over again. Switching to a provider profile writes them back. If Claude Code is running, `yoink use` asks before switching, because a live session keeps its old settings until it restarts. Pass `--force` to skip the question. Disconnecting the provider from Claude Code (`yoink disconnect deepseek --from claude-code`) also strips the keys, and marks the Claude profile that matches your live login as active.

## Why Ollama and OpenAI do not appear for Claude Code

The `ollama` preset only has an OpenAI Chat endpoint (`http://localhost:11434/v1`), and the `openai` preset has OpenAI Responses and Chat. Neither speaks Anthropic Messages, so the harness picker shows Claude Code as "no compatible endpoint" for them, and a scripted connect stops with `"<name>" has no Anthropic-compatible endpoint, which Claude Code requires.` A custom URL is different: yoink probes `/v1/messages`, and Claude Code becomes available only if that probe answers. See [Connect a custom provider](./custom-openai-compatible-provider.md).

## One project only

If only one repository should use DeepSeek while the rest of your machine stays on your subscription, choose **This project only** in the interactive picker. That writes the same seven keys into `./.claude/settings.local.json` instead. The [per-project guide](./per-project-claude-code-provider.md) covers the details.

## Other ways to do this

Last checked 2026-10-10.

- **Set the variables by hand.** OpenRouter's own [Claude Code guide](https://openrouter.ai/docs/guides/guides/claude-code-integration) has you export `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` and an empty `ANTHROPIC_API_KEY` in your shell profile, or put them in `.claude/settings.local.json`. That works with no tool at all; switching back means editing the file again. yoink does not write `ANTHROPIC_API_KEY`, so if your shell exports one, follow OpenRouter's advice about it.
- **A routing proxy.** [claude-code-router](https://github.com/musistudio/claude-code-router) runs a local gateway (by default at `http://127.0.0.1:3456`) that sits in the request path and routes Claude Code traffic by rules. yoink is not a proxy: it writes `settings.json` and steps aside, so Claude Code talks to the provider directly.
- **An env switcher.** [claude-code-switch](https://github.com/foreveryh/claude-code-switch) (`ccm`) exports the same kind of `ANTHROPIC_*` variables into your current shell, or writes them to the user or project settings file. It covers Claude Code only, where yoink also writes the key into the other harnesses you use.

## FAQ

### Can I use Kimi K2 in Claude Code through yoink?

Yes. Both the `kimi-code` and `moonshot` presets have an Anthropic Messages endpoint. Add the one your key belongs to, pick a model such as `kimi-k2` if the live list offers it, and connect it with `yoink connect <name> --to claude-code`. Switching Kimi Code's own subscription login is a different feature, covered in [Subscriptions](../subscriptions.md#kimi-code).

### Does editing the provider update Claude Code right away?

Yes, when that provider is the active Claude Code profile. A new key piped to `yoink edit <name> --token-stdin`, or a new model from `yoink edit <name> --model <model>`, re-writes the env block immediately. Restart Claude Code so it reads the change.

### Can codex use the same OpenRouter key?

No. codex only accepts OpenAI Responses endpoints, which the `openrouter` preset does not have. Claude Code, opencode, pi and the other harnesses can share the key. See [One API key in every coding agent](./one-api-key-every-coding-agent.md).
