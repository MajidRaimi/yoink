---
title: Use any provider in Kilo Code
seoTitle: "Use any OpenAI-compatible provider in Kilo Code · Yoink CLI"
description: "Kilo Code is an opencode fork, so yoink writes the same provider entry into ~/.config/kilo/kilo.json or kilo.jsonc, in place, and sets the default model."
nav: Kilo Code
order: 7
harness: kilo
related:
  - docs/harnesses/opencode.md
  - docs/providers/openrouter.md
  - docs/guides/one-api-key-every-coding-agent.md
---

# Use any provider in Kilo Code

Also at [yoink.codes/harnesses/kilo/](https://yoink.codes/harnesses/kilo/).

Because Kilo Code forked opencode, it reads providers in the opencode format, from `~/.config/kilo/kilo.json` or `kilo.jsonc`. yoink reuses its opencode writer for Kilo, so the entry is identical and only the file and detection differ. Add a key with `yoink add`, then `yoink connect <name> --to kilo`.

## What yoink writes

The provider goes under `provider.<id>`, and the default under the top-level `model` key. For an OpenRouter key saved as `openrouter` and connected with `--default z-ai/glm-4.7` (key redacted):

```json
{
  "provider": {
    "openrouter": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OpenRouter",
      "options": {
        "baseURL": "https://openrouter.ai/api/v1",
        "apiKey": "<your key>"
      },
      "models": {
        "z-ai/glm-4.7": {
          "name": "GLM-4.7",
          "tool_call": true,
          "reasoning": true,
          "limit": { "context": 204800, "output": 131072 }
        }
      }
    }
  },
  "model": "openrouter/z-ai/glm-4.7"
}
```

The `npm` package follows the protocol: `@ai-sdk/openai-compatible` for OpenAI Chat, `@ai-sdk/anthropic` for Anthropic Messages, `@ai-sdk/openai` for OpenAI Responses. The [opencode page](./opencode.md#what-yoink-writes) has the full table and explains which model keys yoink owns.

### Filling in the limits Kilo cannot detect

Kilo's own [OpenAI-compatible provider guide](https://kilo.ai/docs/ai-providers/openai-compatible) sets a custom provider up in the Settings UI, and sends you to the config file for token limits and tool calling. yoink writes those for you: `limit.context` and `limit.output` come from [models.dev](../providers.md#model-selection-and-modelsdev) when it knows the model, with fallbacks of 128,000 and 32,000 tokens when it does not, and every model gets `tool_call: true`.

## How Kilo differs from opencode in yoink

| Detail | Kilo Code | opencode |
| --- | --- | --- |
| Config file | `~/.config/kilo/kilo.json`, or `kilo.jsonc` when that is the file you have | `~/.config/opencode/opencode.json` or `.jsonc` |
| New file | created as an empty object, `{}` | created with opencode's `$schema` line |
| Counts as installed when | the `kilo` binary is on `PATH`, or `~/.config/kilo` exists | the binary, the config directory, or the OpenCode desktop app |
| Override | `XDG_CONFIG_HOME` | `XDG_CONFIG_HOME` |

Both files are edited in place, so comments in `kilo.jsonc` and your formatting survive a connect, a re-sync or a disconnect. When both `kilo.json` and `kilo.jsonc` exist, yoink edits `kilo.json`.

## Which providers work

Kilo Code takes all three protocols, preferring OpenAI Chat, then Anthropic Messages, then OpenAI Responses. Every preset can reach it, `ollama` included, and so can any custom URL that answers one probe.

```bash
yoink connect openrouter --to kilo --default z-ai/glm-4.7
yoink connect openrouter --to kilo,opencode
yoink connect ollama --to kilo
```

Connecting the same provider to Kilo and opencode in one command is a good fit: both get the same entry, and `yoink models <name>` or a rotated key updates both.

## Set the default model

`--default <model>` writes `"model": "<provider>/<model>"`. Leave it out to keep Kilo's current default. When you disconnect, yoink clears `model` and `small_model` only if they point at that provider.

## Backups and disconnect

The first change to an existing `kilo.json` copies it to `kilo.json.yoink.bak`, once (see [Backups](../harnesses.md#backups)). `yoink disconnect openrouter --from kilo` removes `provider.openrouter` and prunes the `provider` object if it ends up empty.

## Gotchas

- **Literal key.** yoink writes the key as a literal `options.apiKey`. Kilo entries that use `{env:VAR}` or `{file:...}` are skipped by `yoink import`, because yoink cannot sync a key it does not hold.
- **Restart** Kilo Code after a change so it reloads its config.

## FAQ

### Is a Kilo Code provider from yoink different from an opencode one?

No. yoink builds both with the same code, so the `npm`, `options` and `models` fields match exactly. Only the file path, the seed for a new file and how yoink detects the install differ.

### Which file does yoink edit if I have both kilo.json and kilo.jsonc?

`kilo.json`. yoink uses `kilo.jsonc` only when it is the one that exists.
