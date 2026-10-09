---
title: Use OpenRouter in your coding agents
seoTitle: "Use OpenRouter in opencode, pi, Qwen Code and more · Yoink"
description: "Add your OpenRouter key once and yoink writes it into Claude Code, opencode, pi, Qwen Code, Crush and 7 more. Codex is not supported: no Responses endpoint."
nav: OpenRouter
order: 4
preset: openrouter
related:
  - docs/harnesses/pi.md
  - docs/providers.md
  - docs/harnesses.md
---

# Use OpenRouter in your coding agents

Also at [yoink.codes/providers/openrouter/](https://yoink.codes/providers/openrouter/).

To use OpenRouter in opencode, pi, Qwen Code, Crush, Claude Code and seven more agents, add your key once with `yoink add`, pick the `openrouter` preset and its models, then tick the agents. yoink writes each config with the endpoint that agent prefers. Codex is the exception: it needs a Responses endpoint the preset lacks ([why](../harnesses/codex.md#which-providers-work)).

## Two endpoints, one key

The `openrouter` preset knows two base URLs for the same key: `https://openrouter.ai/api/v1` for OpenAI Chat Completions and `https://openrouter.ai/api` for Anthropic Messages. Each agent gets the first protocol in its own preference order that the preset offers, so the table above is also a map of which URL lands in which config file. Droid, for example, prefers Anthropic Messages, while pi, opencode and Crush take the Chat endpoint.

A preset is never probed. Instead, whenever yoink lists OpenRouter's models (in the interactive add, or with `yoink probe --preset openrouter`), it also checks the key against `https://openrouter.ai/api/v1/key`. If OpenRouter answers 401 or 403, yoink stops with "OpenRouter rejected the API key" before writing anything. Of the seven presets, OpenRouter is the only one with that check. The scripted `yoink add --external --preset openrouter` takes your `--models` as given and never contacts OpenRouter; it only looks the ids up on models.dev.

## Add it

Interactively, run `yoink add`, choose **Provider (API key)**, then **OpenRouter**, paste the key (the input is hidden), pick models and tick harnesses. From a script, pass the key on stdin so it stays out of your shell history:

```bash
yoink add

echo "$OPENROUTER_API_KEY" | yoink add --external --name openrouter --preset openrouter \
  --models z-ai/glm-4.7 --connect pi,opencode,crush --default z-ai/glm-4.7 --token-stdin

yoink connect openrouter --to qwen,kilo,continue
```

`--connect` and `yoink connect --to` take the [harness ids](../harnesses.md#supported-harnesses). If one of the configs is tracked by git, the scripted forms refuse to write the key into it unless you add `--allow-tracked`.

## Pick models

The model picker is built from OpenRouter's live list at `https://openrouter.ai/api/v1/models`, so it shows whatever OpenRouter serves today. Lists longer than 12 entries get a search box. OpenRouter model ids carry the vendor as a prefix, such as `z-ai/glm-4.7`, and yoink writes them exactly like that into every agent. For each model, yoink looks up the context window, output limit, reasoning and image support on [models.dev](https://models.dev).

```bash
yoink models openrouter
yoink models openrouter --set z-ai/glm-4.7,z-ai/glm-4.6
```

Either form re-syncs every agent the provider is connected to.

## Use it in Claude Code

Claude Code reaches OpenRouter through the Anthropic Messages endpoint. Because Claude Code holds one backend at a time, connecting OpenRouter makes it the active yoink profile and writes the seven managed keys into `~/.claude/settings.json`, with `ANTHROPIC_BASE_URL` set to `https://openrouter.ai/api` and your default model in every tier. Switching back to a Claude account, for example with `yoink work`, strips those keys again.

```bash
yoink connect openrouter --to claude-code --default z-ai/glm-4.7
yoink work
```

The older single-model form still works (the macOS app's single-model add uses it). It saves `https://openrouter.ai/api` as one Anthropic Messages endpoint with one model, ready for Claude Code:

```bash
echo "$KEY" | yoink add --external --name glm --provider OpenRouter \
  --base-url https://openrouter.ai/api --model z-ai/glm-4.7 --token-stdin
```

## Rotate the key

Paste a new key with `yoink edit openrouter` (the **API key** field), or pipe it in. Saving the change re-writes the key into every connected agent in one step, and yoink scrubs the old key out of the backups it touched along the way.

```bash
echo "$NEW_OPENROUTER_KEY" | yoink edit openrouter --token-stdin
```

## FAQ

### Does yoink check my OpenRouter key before saving it?

In the interactive add, yes: while it lists models, yoink sends the key to `https://openrouter.ai/api/v1/key`, and a 401 or 403 answer stops the add before anything is written. The scripted form skips the check, so run `yoink probe --preset openrouter --token-stdin` first if you want it.

### Which OpenRouter URL ends up in which agent?

Claude Code, Droid and Claude Desktop get `https://openrouter.ai/api`, the Anthropic Messages address. Claude Code and Claude Desktop accept nothing else, and Droid lists Anthropic Messages first. Every other agent yoink connects, such as opencode, pi, Crush, Qwen Code and Goose, gets `https://openrouter.ai/api/v1` for Chat Completions.
