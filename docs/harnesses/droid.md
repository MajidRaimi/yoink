---
title: Use any provider in Droid
seoTitle: "Add custom models to Factory Droid · Yoink CLI"
description: "yoink appends your provider's models to customModels in ~/.factory/settings.json, tagged with [provider] in the name. Pick the model inside Droid."
nav: Droid
order: 8
harness: droid
related:
  - docs/harnesses.md
  - docs/providers.md
  - docs/providers/openrouter.md
---

# Use any provider in Droid

Also at [yoink.codes/harnesses/droid/](https://yoink.codes/harnesses/droid/).

Factory's Droid takes bring-your-own models from the `customModels` array in `~/.factory/settings.json`. yoink appends one entry per selected model, marks each one with ` [<provider>]` at the end of its display name, and never picks a default for you. Run `yoink connect <name> --to droid`, then choose the model inside Droid.

## settings.json, not config.json

Some guides still point at `~/.factory/config.json`. Factory's own [Custom Models (BYOK)](https://docs.factory.com/cli/byok/overview) page calls that file legacy: it still works, uses snake_case fields such as `custom_models`, and is merged with `settings.json`, where `settings.json` wins. yoink only ever reads and writes `settings.json`, so a model you defined by hand in `config.json` stays where it is and yoink will not import it.

## What yoink writes

Each selected model becomes one object in `customModels`. This is what yoink wrote in a test home for a provider saved as `fuse` with one endpoint per protocol and the model `kimi-k2`, key redacted:

```json
{
  "customModels": [
    {
      "model": "kimi-k2",
      "displayName": "Kimi-K2 [fuse]",
      "baseUrl": "https://fuse.example.com",
      "apiKey": "<your key>",
      "provider": "anthropic",
      "maxOutputTokens": 64000,
      "noImageSupport": true
    }
  ]
}
```

| Field | Where the value comes from |
| --- | --- |
| `model` | the model id you selected in yoink |
| `displayName` | the model name, then a space and the profile id in brackets |
| `baseUrl` | the endpoint yoink picked; an Anthropic endpoint loses any trailing `/v1` |
| `provider` | `anthropic`, `openai` or `generic-chat-completion-api`, by protocol |
| `maxOutputTokens` | the output limit from models.dev, or 32,000 when models.dev has no entry |
| `noImageSupport` | `true` unless the model accepts image input |

The key is written as a literal `apiKey`. Fields that Factory documents and yoink does not manage, such as `extraArgs`, `extraHeaders` or `apiKeyHelper`, survive every re-sync, because yoink rewrites only the six fields in the table plus `apiKey`.

## The bracket tag is the ownership marker

yoink finds its own entries by the ` [<provider>]` suffix and nothing else. Two consequences follow:

- If you rename `displayName` and drop the tag, yoink treats the entry as yours. The next connect appends a fresh copy, and `yoink disconnect` leaves your renamed one behind.
- If you deselect a model with `yoink models <name>`, its tagged entry is removed on the next sync, while kept models are updated in place at their current position in the array.

## Which protocol Droid gets

Droid lists Anthropic Messages first, then OpenAI Responses, then OpenAI Chat. That order decides what a dual-endpoint provider looks like here:

- `openrouter`, `kimi-code`, `moonshot`, `deepseek` and `zai` all offer Anthropic Messages, so their entries say `"provider": "anthropic"`.
- `openai` has no Anthropic endpoint, so it lands as `"provider": "openai"` on the Responses endpoint.
- `ollama` only speaks Chat Completions, so it becomes `generic-chat-completion-api` at `http://localhost:11434/v1`.

A custom URL works when at least one of the three probes answers.

```bash
yoink connect openrouter --to droid
yoink connect openai --to droid
yoink models openrouter
```

## Picking the model

Droid is the one harness where yoink sets no default. Passing `--default` alongside `--to droid` is accepted and ignored for Droid, while other harnesses in the same `--to` list still get it. Open Droid's model picker and choose the entry with your provider tag.

## Backups and disconnect

The first write copies the old `settings.json` to `settings.json.yoink.bak`, once. `yoink disconnect openrouter --from droid` deletes every entry tagged ` [openrouter]`; when those were the only custom models, the whole `customModels` key goes with them. See [Backups](../harnesses.md#backups) for the shared rules.

## FAQ

### Why do all my OpenRouter models show provider anthropic in Droid?

Droid prefers Anthropic Messages, and the OpenRouter preset has an Anthropic endpoint at `https://openrouter.ai/api`, so yoink uses it. Every model you selected still goes through OpenRouter; only the request format differs.

### Can I import models I already added to Droid by hand?

Yes, if they live in `settings.json` and carry a literal `apiKey`. `yoink import` groups entries that share a base URL, key and provider type into one provider, and reads a bracket suffix in `displayName` as the provider name.
