---
title: Use any provider in opencode
seoTitle: "Add a custom provider to opencode (opencode.json) · Yoink CLI"
description: "Connect OpenRouter, DeepSeek, Ollama or any compatible API to opencode. yoink edits opencode.json or .jsonc in place, keeping your comments and formatting."
nav: opencode
order: 3
harness: opencode
related:
  - docs/providers/openrouter.md
  - docs/guides/one-api-key-every-coding-agent.md
  - docs/guides/custom-openai-compatible-provider.md
---

# Use any provider in opencode

Also at [yoink.codes/harnesses/opencode/](https://yoink.codes/harnesses/opencode/).

To give opencode a custom provider, yoink adds a block under `provider` in `~/.config/opencode/opencode.json`, choosing the AI SDK package that matches the endpoint. It edits the file in place, so JSONC comments and your own formatting survive every re-sync. Save the key with `yoink add`, then run `yoink connect <name> --to opencode`.

## What yoink writes

opencode loads each custom provider through an AI SDK package named in `npm`. yoink picks it from the protocol it connects with:

| Protocol yoink picks | `npm` package | `options.baseURL` |
| --- | --- | --- |
| OpenAI Chat | `@ai-sdk/openai-compatible` | the provider URL as saved, usually ending in `/v1` |
| Anthropic Messages | `@ai-sdk/anthropic` | the provider URL with `/v1` appended |
| OpenAI Responses | `@ai-sdk/openai` | the provider URL as saved |

Here is the block for an OpenRouter key saved as `openrouter`, with the key redacted:

```json
{
  "$schema": "https://opencode.ai/config.json",
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

Every model gets `tool_call: true`, plus `reasoning` and `limit` from [models.dev](../providers.md#model-selection-and-modelsdev). A model that accepts images also gets `modalities` with its input types. The [custom provider section of opencode's docs](https://opencode.ai/docs/providers/) describes the same `npm`, `options.baseURL` and `models` shape for hand-written entries.

### Comments and formatting survive

yoink never reparses and reprints your whole config. It changes only the `provider.<id>` block and, when asked, the `model` key, as text edits in place. If your file is `opencode.jsonc` with comments, the comments are still there after a connect, a model change, or a disconnect. If `opencode.json` does not exist yet, yoink creates it with opencode's `$schema` line.

Inside a model entry, yoink owns `name`, `tool_call`, `reasoning`, `limit` and `modalities`. Any other key you add to a model by hand, such as a custom option, is kept on re-sync.

## Which providers work

opencode accepts all three protocols, so every preset reaches it, including `ollama` for local models. Its order is OpenAI Chat, then Anthropic Messages, then OpenAI Responses. Two results follow from that order:

- The `openai` preset offers Responses and Chat, and lands in opencode as `@ai-sdk/openai-compatible` because Chat comes first.
- A gateway that speaks only Responses and Anthropic Messages lands as `@ai-sdk/anthropic`, not `@ai-sdk/openai`.

```bash
yoink connect openrouter --to opencode
yoink connect deepseek --to opencode --default <model>
yoink connect ollama --to opencode
```

## Set the default model

`--default <model>` sets the top-level `"model"` key to `<provider>/<model>`, which is the format opencode expects. Leave it out and your current default stays. On disconnect, yoink clears `model` and `small_model` only when they start with that provider's id.

## Backups and disconnect

The first change to an existing `opencode.json` saves `opencode.json.yoink.bak` once (see [Backups](../harnesses.md#backups)). `yoink disconnect openrouter --from opencode` removes `provider.openrouter`, and drops the `provider` object entirely if it is left empty.

## Detection and gotchas

- **Desktop app.** yoink treats opencode as installed when the `opencode` binary is on your `PATH`, when `~/.config/opencode` exists, or when it finds the OpenCode desktop app (`/Applications/OpenCode.app` on macOS, `/opt/OpenCode` or the `.desktop` file on Linux, `%LOCALAPPDATA%\Programs\OpenCode\OpenCode.exe` on Windows).
- **XDG_CONFIG_HOME.** When it is set, the config is read from `$XDG_CONFIG_HOME/opencode` instead of `~/.config/opencode`.
- **Import.** `yoink import` skips entries whose `apiKey` is `{env:VAR}`, `{file:...}`, `$VAR` or `!command`, since yoink cannot sync a key it never sees.
- **Restart** opencode after a change so it reloads the file.

## FAQ

### Will yoink strip the comments from my opencode.jsonc?

No. yoink edits only the provider block and the `model` key in place, and leaves the rest of the text, comments included, as it was.

### Why does my OpenAI key show up as @ai-sdk/openai-compatible?

opencode's preference order puts OpenAI Chat first, and yoink takes the first protocol the provider offers. The `openai` preset has a Chat endpoint, so opencode gets the OpenAI-compatible package instead of `@ai-sdk/openai`.
