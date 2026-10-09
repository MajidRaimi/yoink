---
title: Use a custom provider in Codex CLI
seoTitle: "Add a custom model provider to Codex CLI · Yoink CLI"
description: "yoink writes a [model_providers] table into ~/.codex/config.toml with wire_api = \"responses\". Codex needs a Responses endpoint, so few presets fit."
nav: codex
order: 4
harness: codex
related:
  - docs/guides/switch-codex-accounts.md
  - docs/guides/one-api-key-every-coding-agent.md
  - docs/harnesses.md
---

# Use a custom provider in Codex CLI

Also at [yoink.codes/harnesses/codex/](https://yoink.codes/harnesses/codex/).

Codex CLI only talks to custom providers over the OpenAI Responses API. yoink therefore connects a provider to codex only when it has an `openai-responses` endpoint, and writes it as a `[model_providers.<id>]` table in `~/.codex/config.toml`. Run `yoink connect <name> --to codex --default <model>` to add it and make it active.

## What yoink writes

For a provider saved under the profile id `openai-api`, `yoink connect openai-api --to codex --default gpt-5.2-codex` produces this, with the key redacted:

```toml
model = "gpt-5.2-codex"
model_provider = "openai-api"

[model_providers.openai-api]
name = "OpenAI"
base_url = "https://api.openai.com/v1"
wire_api = "responses"
experimental_bearer_token = "<your key>"
```

`name` is the provider's display name, `base_url` is its Responses endpoint, and `wire_api` is always `"responses"`, which [Codex's config reference](https://learn.chatgpt.com/docs/config-file/config-reference) lists as the only supported value. The key goes in `experimental_bearer_token` as a literal, because yoink keeps one key in sync across harnesses instead of asking you to export an environment variable. Your other tables and keys in `config.toml` are left as they were.

## Which providers work

Only providers with an `openai-responses` endpoint can be connected. Among the presets that is `openai` alone:

| Preset | Reaches codex | Why |
| --- | --- | --- |
| `openai` | yes | has an `openai-responses` endpoint |
| `kimi-code`, `moonshot`, `openrouter`, `deepseek`, `zai` | no | Chat Completions and Anthropic Messages only |
| `ollama` | no | Chat Completions only |

In the harness picker those rows show **needs an OpenAI Responses endpoint**. From the command line, the attempt fails with a message that names the protocol codex needs:

```text
✖ codex: openrouter has no endpoint codex can use (needs one of: openai-responses).
```

A custom provider gets a Responses endpoint when its `/responses` route answers yoink's probe, or when you declare it with `--protocol openai-responses`. See [codex is responses-only](../harnesses.md#codex-is-responses-only) for the probe details.

## Pick a profile id Codex does not reserve

Codex reserves the provider ids `openai`, `ollama` and `lmstudio` for its built-in providers, and its config reference says they cannot be overridden. yoink uses your profile id as the table name, so save the OpenAI preset under a different id before connecting it to codex:

```bash
echo "$OPENAI_API_KEY" | yoink add --external --name openai-api --preset openai \
  --models gpt-5.2,gpt-5.2-codex --token-stdin
yoink connect openai-api --to codex --default gpt-5.2-codex
```

The same applies to a custom provider: avoid naming it `ollama` or `lmstudio` if you plan to use it in codex.

## Set the default model

`--default` writes two root keys: `model` with the model id, and `model_provider` with the profile id. Codex reads `model_provider` to choose which provider is active, so a provider you connect without `--default` sits in the file unused until you pick it. Codex ignores `model_provider` in a project-local `.codex/config.toml`, which is why yoink writes the user-level file under `CODEX_HOME` or `~/.codex`.

## ChatGPT login versus API key

A `model_provider` that points at a custom provider overrides your ChatGPT login. When yoink sees a ChatGPT login in `auth.json` and the provider you just connected is the active one, it prints a notice after connecting, with the full path to your config:

```text
Codex is set to model_provider = "openai-api" in ~/.codex/config.toml, which overrides the ChatGPT login. Run `yoink disconnect openai-api --from codex` or remove model_provider from that file to use ChatGPT.
```

Switching between several ChatGPT logins is a separate feature that does not touch `config.toml`; see [switch between Codex accounts](../guides/switch-codex-accounts.md).

## Backups and disconnect

The first time yoink changes an existing `config.toml`, it saves `config.toml.yoink.bak` once and never overwrites it. `yoink disconnect openai-api --from codex` removes the `[model_providers.openai-api]` table, and removes `model` and `model_provider` together when `model_provider` points at that provider, which hands control back to your ChatGPT login.

## FAQ

### Why can't codex use my OpenRouter or DeepSeek key?

Those presets expose Chat Completions and Anthropic Messages endpoints, and codex only speaks the Responses API to custom providers. yoink refuses the pairing instead of writing a config codex cannot use. The same keys still work in harnesses that accept Chat Completions, such as opencode or [pi](./pi.md).

### Why should the OpenAI profile not be named openai for codex?

It writes the table, but Codex treats `openai` as its built-in provider id and does not let a config table override it. Save the preset under another id such as `openai-api`, as shown above.
