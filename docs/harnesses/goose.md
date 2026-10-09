---
title: Use any provider in Goose
seoTitle: "Add a custom provider to Goose (experimental) · Yoink CLI"
description: "yoink writes custom_providers/custom_<id>.json for Goose and sets GOOSE_PROVIDER and GOOSE_MODEL. Where the key goes depends on GOOSE_DISABLE_KEYRING."
nav: Goose
order: 10
harness: goose
related:
  - docs/harnesses.md
  - docs/security.md
  - docs/providers.md
---

# Use any provider in Goose

Also at [yoink.codes/harnesses/goose/](https://yoink.codes/harnesses/goose/).

Goose loads each custom provider from its own JSON file, and the key itself lives in your OS keyring or in `secrets.yaml`, never in that file. yoink writes `custom_providers/custom_<provider>.json`, sets `GOOSE_PROVIDER` and `GOOSE_MODEL`, and stores the key only when the keyring is off. Start with `yoink connect <name> --to goose --default <model>`.

## What yoink writes

The provider file follows the declarative format in Goose's [custom provider docs](https://github.com/block/goose/blob/main/documentation/docs/getting-started/providers.md). For the OpenRouter preset it looks like this:

```json
{
  "name": "custom_openrouter",
  "engine": "openai",
  "display_name": "OpenRouter",
  "description": "OpenRouter via yoink",
  "api_key_env": "CUSTOM_OPENROUTER_API_KEY",
  "base_url": "https://openrouter.ai/api/v1/chat/completions",
  "models": [{ "name": "z-ai/glm-4.7", "context_limit": 204800 }],
  "supports_streaming": true
}
```

Two details differ from the other harnesses:

- For an OpenAI Chat endpoint, `base_url` is the full `/chat/completions` URL, because that is how Goose's `openai` engine expects it. An Anthropic endpoint gets the `anthropic` engine and a base URL with no `/v1`.
- Each model carries only `name` and `context_limit`; Goose has no output-limit or image field here.

`--default` writes two lines into `config.yaml`:

```yaml
GOOSE_PROVIDER: custom_openrouter
GOOSE_MODEL: z-ai/glm-4.7
```

## Where the API key goes

This is why Goose is marked experimental. yoink checks `GOOSE_DISABLE_KEYRING`, in your environment first and then in `config.yaml`. The values `true`, `1`, `yes` and `on` count as set.

| Keyring | What yoink does | What you do |
| --- | --- | --- |
| disabled | merges `CUSTOM_<PROVIDER>_API_KEY: <key>` into `secrets.yaml` (`0600`) | nothing |
| enabled (the default) | writes no key anywhere, prints a notice | export the variable, or enter the key once with `goose configure` |

```bash
yoink connect openrouter --to goose --default z-ai/glm-4.7
export CUSTOM_OPENROUTER_API_KEY="<your key>"
```

The variable name is the profile id in upper snake case between `CUSTOM_` and `_API_KEY`. An id that does not fit lowercase-and-hyphens gets a short hash suffix so two ids cannot collide on one name. yoink never reads or writes the OS keyring.

## Which providers work

Goose takes OpenAI Chat first, then Anthropic Messages. The five dual-endpoint presets land on their Chat endpoint, `openai` lands on Chat Completions at `https://api.openai.com/v1/chat/completions`, and `ollama` works too. A gateway that answered only the Responses probe cannot connect.

## Paths

- Linux and macOS: `~/.config/goose`, or `$XDG_CONFIG_HOME/goose`.
- Windows: `%APPDATA%\Block\goose\config`.
- `GOOSE_PATH_ROOT` set: `$GOOSE_PATH_ROOT/config`.

yoink counts Goose as installed when the `goose` binary is on your `PATH`, the config folder exists, or `/Applications/Goose.app` is present.

## The provider file is yoink's

`custom_<provider>.json` is owned by yoink: it is overwritten on every connect with no backup and deleted on disconnect. Fields you add to it by hand, such as `headers`, are carried over on re-sync, but do not keep a hand-made file under the same name. `config.yaml` and `secrets.yaml` are shared files and get the usual one-time `.yoink.bak` copy.

`yoink disconnect openrouter --from goose` deletes the provider file, removes `CUSTOM_OPENROUTER_API_KEY` from `secrets.yaml` if it is there, and clears `GOOSE_PROVIDER` and `GOOSE_MODEL` only when they point at `custom_openrouter`.

## FAQ

### Goose says the provider has no API key. What did I miss?

Your keyring is on, so yoink did not store the key. Export `CUSTOM_<PROVIDER>_API_KEY` in the shell that starts Goose, or run `goose configure` and enter it once. Setting `GOOSE_DISABLE_KEYRING` and connecting again makes yoink write it to `secrets.yaml` instead.

### Can yoink import a Goose provider I set up myself?

Only when its key sits in `secrets.yaml` under the name in its `api_key_env`. A key kept in the keyring is invisible to yoink, so that provider is skipped.
