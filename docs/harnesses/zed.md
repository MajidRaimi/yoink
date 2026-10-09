---
title: Use any provider in Zed
seoTitle: "Add an OpenAI-compatible provider to Zed · Yoink CLI"
description: "yoink adds your provider to language_models in Zed's settings.json, keeping comments, and sets agent.default_model. Zed reads the key from env."
nav: Zed
order: 11
harness: zed
related:
  - docs/harnesses.md
  - docs/providers/openrouter.md
  - docs/providers.md
---

# Use any provider in Zed

Also at [yoink.codes/harnesses/zed/](https://yoink.codes/harnesses/zed/).

Zed's agent panel reads extra models from `language_models` in its `settings.json`, but it refuses to read an API key from that file. So yoink writes the provider block, edits the JSONC in place to keep your comments, sets `agent.default_model`, and leaves the key to an environment variable. Run `yoink connect <name> --to zed`.

## What yoink writes

The block goes under `openai_compatible` or `anthropic_compatible`, keyed by the profile id. Here is the OpenRouter preset with `--default z-ai/glm-4.7`:

```json
{
  "language_models": {
    "openai_compatible": {
      "openrouter": {
        "api_url": "https://openrouter.ai/api/v1",
        "available_models": [
          {
            "name": "z-ai/glm-4.7",
            "display_name": "GLM-4.7",
            "max_tokens": 204800,
            "max_output_tokens": 131072,
            "capabilities": {
              "tools": true,
              "parallel_tool_calls": false,
              "prompt_cache_key": false,
              "images": false,
              "chat_completions": true
            }
          }
        ]
      }
    }
  },
  "agent": {
    "default_model": { "provider": "openrouter", "model": "z-ai/glm-4.7" }
  }
}
```

`max_tokens` is the context window and `max_output_tokens` the output limit, both from the model data yoink keeps for the provider. In `capabilities`, yoink always sets `images` and `chat_completions`. It seeds `tools: true`, `parallel_tool_calls: false` and `prompt_cache_key: false` only the first time, so if you flip one of those three by hand, your value stays.

## Three shapes, one per protocol

Zed accepts all three protocols, in the order Chat, Responses, Anthropic. Zed's [API access docs](https://zed.dev/docs/ai/use-api-access) describe both sections yoink uses.

| Protocol yoink picked | Section | Difference |
| --- | --- | --- |
| OpenAI Chat | `openai_compatible` | `chat_completions: true` |
| OpenAI Responses | `openai_compatible` | `chat_completions: false`, the switch Zed documents for Responses-only models |
| Anthropic Messages | `anthropic_compatible` | `api_url` without `/v1`, no `capabilities` block |

Because Chat comes first, every preset except a Responses-only gateway lands as Chat, `openai` included. A custom gateway that answers only `/responses` gets the `chat_completions: false` shape. If a provider's endpoints change and it moves from one section to the other, yoink deletes the old block so the provider never appears twice.

## Setting the key

yoink prints the variable name after connecting. It is the profile id in upper case, with every run of characters other than letters and digits turned into `_`, plus `_API_KEY`:

```bash
yoink connect openrouter --to zed --default z-ai/glm-4.7
export OPENROUTER_API_KEY="<your key>"
```

A provider saved as `fuse` reads `FUSE_API_KEY`. Zed has to inherit the variable, so launch it from a shell that exports it, or paste the key into the provider in Zed's agent settings instead. This step is why Zed is marked experimental: yoink cannot put the key where Zed reads it.

## Paths and detection

- Linux and macOS: `~/.config/zed/settings.json`, or under `$XDG_CONFIG_HOME/zed`.
- Windows: `%APPDATA%\Zed\settings.json`.

yoink counts Zed as installed when `zed` or `zeditor` is on your `PATH`, `/Applications/Zed.app` or `/Applications/Zed Preview.app` exists, or the config folder does.

## Disconnect and backups

`yoink disconnect openrouter --from zed` removes the `openrouter` block from whichever section holds it, clears `agent.default_model` only when it names `openrouter`, and drops any section left empty. The first write keeps the original as `settings.json.yoink.bak`.

## FAQ

### Why is there nothing to import from Zed?

Zed never stores keys in `settings.json`, so a provider you configured there has no key yoink could adopt. `yoink import` skips Zed for that reason; add the provider with `yoink add` and connect it instead.

### Will yoink reformat my settings.json?

No. yoink edits only the paths it owns inside the JSONC text, so your comments and the order of your other settings stay as they were.
