---
title: Use the Moonshot AI API in your coding agents
seoTitle: "Use the Moonshot AI (Kimi) API in coding agents · Yoink CLI"
description: "Connect a Moonshot AI platform key to Claude Code via api.moonshot.ai/anthropic, and to opencode, pi, Qwen Code or Crush via api.moonshot.ai/v1."
nav: Moonshot AI
order: 3
preset: moonshot
related:
  - docs/providers/kimi-code.md
  - docs/providers.md
  - docs/harnesses.md
---

# Use the Moonshot AI API in your coding agents

Also at [yoink.codes/providers/moonshot/](https://yoink.codes/providers/moonshot/).

A key from the Moonshot AI platform reaches opencode, pi, Qwen Code, Crush, Droid, Claude Code and six more agents through the `moonshot` preset. Add it once with `yoink add`, pick **Moonshot AI**, then tick agents. yoink writes `https://api.moonshot.ai/v1` for OpenAI-style agents and `https://api.moonshot.ai/anthropic` for Anthropic-style ones.

## moonshot or kimi-code?

Both presets serve Kimi models, but they are two separate accounts on two hosts:

| Detail | `moonshot` | `kimi-code` |
| --- | --- | --- |
| Key page | `https://platform.moonshot.ai/console/api-keys` | `https://www.kimi.com/code` |
| Chat Completions | `https://api.moonshot.ai/v1` | `https://api.kimi.com/coding/v1` |
| Anthropic Messages | `https://api.moonshot.ai/anthropic` | `https://api.kimi.com/coding` |

Each preset sends your key to its own host, so choose by the console that issued the key. If you hold both, add both: they are separate providers in yoink and can sit side by side in every agent except Claude Code, which takes one at a time. The [Kimi Code page](./kimi-code.md) covers the other preset.

## Add it

The interactive flow names the profile after the preset label, so it suggests `moonshot-ai`. That id becomes the provider key in every config and the stem of any environment variable an agent reads. The scripted example below uses the shorter `moonshot`.

```bash
yoink add

echo "$MOONSHOT_API_KEY" | yoink add --external --name moonshot --preset moonshot \
  --models <model> --connect opencode,qwen,droid,zed --default <model> --token-stdin
```

The picker reads the live list at `https://api.moonshot.ai/v1/models`. Model limits come from [models.dev](../providers.md#model-selection-and-modelsdev), where yoink prefers an entry filed under the provider key `moonshot` or served from `api.moonshot.ai` when the same model id appears under several providers.

## What lands in Droid and Zed

Droid prefers Anthropic Messages, so its entries point at the `/anthropic` URL. Each model becomes one `customModels` item in `~/.factory/settings.json`, tagged with the profile id in brackets so yoink can find it again:

```json
{
  "model": "<model>",
  "displayName": "<model> [moonshot]",
  "baseUrl": "https://api.moonshot.ai/anthropic",
  "apiKey": "<your key>",
  "provider": "anthropic"
}
```

Zed (experimental) takes Chat Completions instead. yoink adds `language_models.openai_compatible.moonshot` with `"api_url": "https://api.moonshot.ai/v1"` and the model list, and sets `agent.default_model`. Zed never reads a key from `settings.json`, so after connecting yoink prints:

```text
Zed does not store API keys in settings.json. Set MOONSHOT_API_KEY in your environment or paste the key in Zed's agent settings.
```

With the interactive id `moonshot-ai`, the variable is `MOONSHOT_AI_API_KEY` instead.

## Use it in Claude Code

Claude Code gets `ANTHROPIC_BASE_URL=https://api.moonshot.ai/anthropic` and the chosen model in every tier, and Moonshot AI becomes the active yoink profile. Use `yoink connect moonshot --to claude-code --default <model>`; the details of the seven keys and the per-project option are in [Providers](../providers.md#claude-code-is-exclusive).

## Rotate the key

Run `yoink edit moonshot`, choose **API key**, and paste the new one. Droid, opencode, Qwen Code and every other connected agent get it in the same save. Zed is the exception, and so is Goose when it keeps secrets in the OS keyring: there the key lives in your environment or the keyring, so update it there too.

## FAQ

### Can Moonshot AI and Kimi Code be connected to the same agent?

Yes, for every agent that holds several providers, such as opencode, pi or Crush. Each preset is its own provider entry with its own id. Claude Code is the exception: it runs one backend at a time.

### Why does yoink suggest moonshot-ai as the profile id?

The suggestion is the preset label, Moonshot AI, turned into an id. You can type any id made of letters, digits, dots, dashes and underscores, and harness configs will use whatever you choose.
