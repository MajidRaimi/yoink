---
title: Use any provider in pi
seoTitle: "Use OpenRouter or any provider in the pi coding agent · Yoink"
description: "Connect any OpenAI- or Anthropic-compatible provider to pi. yoink writes ~/.pi/agent/models.json with model limits from models.dev and sets the default."
nav: pi
order: 1
harness: pi
related:
  - docs/providers/openrouter.md
  - docs/harnesses.md
  - docs/providers.md
---

# Use any provider in pi

Also at [yoink.codes/harnesses/pi/](https://yoink.codes/harnesses/pi/).

pi reads custom providers from `~/.pi/agent/models.json`, and it can hold many of them side by side. yoink adds one entry per provider there, fills each model's context window and output limit from models.dev, and can point `settings.json` at your default. Run `yoink connect <name> --to pi` after adding the provider.

## What yoink writes

yoink owns one key under `providers` in `models.json`: the profile id you chose when you added the provider. Here is the entry for an OpenRouter provider saved as `openrouter`, with the key redacted. The numbers shown are the defaults yoink falls back to when [models.dev](https://models.dev) does not know a model; a model it does know gets its real limits instead.

```json
{
  "providers": {
    "openrouter": {
      "name": "OpenRouter",
      "baseUrl": "https://openrouter.ai/api/v1",
      "api": "openai-completions",
      "apiKey": "<your key>",
      "models": [
        {
          "id": "z-ai/glm-4.7",
          "name": "<name from the provider's model list>",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000
        }
      ]
    }
  }
}
```

The `api` field follows the protocol yoink picked: `openai-completions` for OpenAI Chat, `openai-responses` for OpenAI Responses, and `anthropic-messages` for Anthropic Messages. For an Anthropic endpoint, `baseUrl` is written without a trailing `/v1`. pi's own guide to the [models.json format](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md) documents the rest of the schema.

Anything you add to the entry by hand, such as an extra field on a model, survives the next re-sync. yoink only rewrites the fields listed above, and leaves every other provider in the file alone.

## Which providers work

pi accepts all three protocols, so every preset reaches it, and so does any custom URL that answers at least one probe. pi prefers OpenAI Chat first, then OpenAI Responses, then Anthropic Messages. That order has one effect worth knowing: even the `openai` preset, which also offers a Responses endpoint, lands in pi as `openai-completions`, because Chat comes first in pi's list.

```bash
yoink add
yoink connect openrouter --to pi
yoink connect openrouter --to pi,omp,opencode --default z-ai/glm-4.7
```

If you set up a provider in `models.json` by hand before installing yoink, `yoink import` can adopt it, as long as `apiKey` holds a literal key. Entries that use `$VAR`, `${VAR}`, or a `!command` for the key are skipped, because yoink cannot keep a key in sync that it never sees.

## Set the default model

`--default` writes two keys into `~/.pi/agent/settings.json`: `defaultProvider` with the profile id, and `defaultModel` as `<provider>/<model>`. With the example above that is `openrouter/z-ai/glm-4.7`. Leave `--default` out and your current pi default stays as it is.

```bash
yoink connect openrouter --to pi --default z-ai/glm-4.7
yoink models openrouter
```

`yoink models openrouter` changes which models the provider exposes and re-syncs every harness it is connected to, pi included.

## Backups and disconnect

The first time yoink changes an existing `models.json` or `settings.json`, it copies the original to `models.json.yoink.bak` or `settings.json.yoink.bak` and never overwrites that copy. Every write after that is atomic and owner-only. `yoink disconnect openrouter --from pi` removes the `openrouter` entry and clears `defaultProvider` and `defaultModel` only when they point at that provider.

## Notices and gotchas

- **Custom agent directory.** When `PI_CODING_AGENT_DIR` is set, yoink writes `models.json` and `settings.json` there instead of `~/.pi/agent`.
- **Detection.** yoink treats pi as installed when the `pi` binary is on your `PATH` or the agent directory exists, so you can connect a provider before you first run pi.
- **Restart.** A running pi session keeps the config it loaded. Restart it after connecting, changing models, or rotating a key.

## FAQ

### Can pi use an OpenRouter key and an OpenAI key at the same time?

Yes. pi holds many providers side by side, and yoink writes each one under its own profile id in `providers`. Pick between them inside pi, or make one the default with `--default`.

### Why does the openai preset show up in pi as openai-completions?

pi's preference order puts OpenAI Chat before OpenAI Responses, and yoink takes the first protocol in that order that the provider offers. The `openai` preset offers both, so pi gets the Chat endpoint.
