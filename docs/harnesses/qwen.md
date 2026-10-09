---
title: Use any provider in Qwen Code
seoTitle: "Use an OpenAI-compatible provider in Qwen Code · Yoink CLI"
description: "Connect a provider to Qwen Code. yoink adds modelProviders entries to ~/.qwen/settings.json and stores the key once as YOINK_<PROVIDER>_API_KEY in env."
nav: Qwen Code
order: 6
harness: qwen
related:
  - docs/providers/openrouter.md
  - docs/guides/one-api-key-every-coding-agent.md
  - docs/harnesses.md
---

# Use any provider in Qwen Code

Also at [yoink.codes/harnesses/qwen/](https://yoink.codes/harnesses/qwen/).

Qwen Code lists models, not providers: each entry under `modelProviders` in `~/.qwen/settings.json` is one model with its own base URL and an `envKey` naming the variable that holds the key. yoink writes one entry per selected model and puts the key once in the `env` block. Connect with `yoink connect <name> --to qwen`.

## What yoink writes

For an OpenRouter key saved as `openrouter`, with `--default z-ai/glm-4.7`, the file looks like this (key redacted):

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "z-ai/glm-4.7",
        "name": "GLM-4.7",
        "baseUrl": "https://openrouter.ai/api/v1",
        "envKey": "YOINK_OPENROUTER_API_KEY",
        "wireApi": "chat-completions",
        "generationConfig": { "contextWindowSize": 204800 }
      }
    ]
  },
  "env": {
    "YOINK_OPENROUTER_API_KEY": "<your key>"
  },
  "model": { "name": "z-ai/glm-4.7" },
  "security": { "auth": { "selectedType": "openai" } }
}
```

[Qwen Code's model providers guide](https://qwenlm.github.io/qwen-code-docs/en/users/configuration/model-providers/) documents the same fields. The parts yoink decides:

| Field | Value yoink writes |
| --- | --- |
| group under `modelProviders` | `openai` for OpenAI Chat or Responses, `anthropic` for Anthropic Messages |
| `wireApi` | `chat-completions` or `responses`; left out for Anthropic entries |
| `baseUrl` | the endpoint URL; for Anthropic, without `/v1` |
| `envKey` | `YOINK_<PROVIDER>_API_KEY`, the profile id in upper snake case |
| `generationConfig.contextWindowSize` | the context window from [models.dev](../providers.md#model-selection-and-modelsdev) |

### Why the key goes in env

Qwen Code reads each model's key from the variable that its `envKey` names, not from the entry itself. yoink writes the literal key once into the `env` block of `settings.json` and points every model of that provider at it. A key rotation therefore changes one line, however many models you exposed. The `YOINK_` prefix is also how yoink recognises its own entries, so a model you added by hand with your own `envKey` is left alone. The exception is a hand-written entry with the same model id in the same group whose `envKey` resolves to this provider's exact key: yoink adopts it and rewrites its `envKey` to `YOINK_<PROVIDER>_API_KEY`.

Other keys you add to a yoink entry, such as extra `generationConfig` options, are kept when yoink re-syncs.

## Which providers work

Qwen Code accepts OpenAI Chat, OpenAI Responses and Anthropic Messages, in that order, so every preset reaches it, `ollama` included. A provider that offers both Chat and Anthropic, like `openrouter` or `deepseek`, lands in the `openai` group with `wireApi: "chat-completions"`.

```bash
yoink connect openrouter --to qwen --default z-ai/glm-4.7
yoink connect deepseek --to qwen
```

### Two providers, same model id

Entries in one group are matched by `id`. If two providers expose the same model id through the same group, the second connect stops instead of overwriting the first:

```text
✖ Qwen Code: Qwen Code already has a modelProviders.openai entry "gpt-5.2" that yoink does not manage. Rename or remove it before connecting gateway.
```

The same happens when you already have a hand-written entry with that id. Remove the model from one provider with `yoink models <name>`, or delete the other entry, then connect again. The one exception: a hand-written entry with the same id whose `envKey` already holds this provider's exact key is adopted, not refused.

## Set the default model

Qwen Code needs two keys to pick a model: `model.name` and `security.auth.selectedType`. `--default` sets both, with `selectedType` matching the group the model was written to. Without `--default`, both stay as they are.

## Backups and disconnect

The first change to an existing `settings.json` saves `settings.json.yoink.bak` once, as on most harnesses (see [Backups](../harnesses.md#backups)). `yoink disconnect openrouter --from qwen` removes every entry whose `envKey` is `YOINK_OPENROUTER_API_KEY`, removes that variable from `env`, and clears `model.name` and `selectedType` only when the default was one of those models. Empty objects left behind are pruned.

## Gotchas

- **QWEN_HOME.** When it is set, yoink writes `$QWEN_HOME/settings.json` instead of `~/.qwen/settings.json`.
- **Detection.** Qwen Code counts as installed when the `qwen` binary is on your `PATH` or the config directory exists.
- **Import.** `yoink import` groups hand-written entries by their `envKey` (or by host when there is none) and adopts them when the `env` block holds a literal key for that variable.
- **Restart** Qwen Code after a change so it reloads `settings.json`.

## FAQ

### Why does yoink put my API key in the env block instead of each model?

Qwen Code looks up a model's key through its `envKey`. Writing the key once under `YOINK_<PROVIDER>_API_KEY` lets every model of that provider share it, and lets yoink find its own entries later.

### Can I keep my own Qwen Code models next to the yoink ones?

Yes. yoink edits entries whose `envKey` uses its `YOINK_` prefix and leaves the rest alone, with one exception: a hand-written entry with the same model id whose `envKey` resolves to this provider's exact key is adopted and rewritten. Other entries stay, as long as they do not use the same model id in the same group as a yoink provider.
