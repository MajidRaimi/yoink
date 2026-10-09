---
title: Use any provider in Continue
seoTitle: "Add a custom provider to Continue config.yaml · Yoink CLI"
description: "yoink adds one model entry per model to ~/.continue/config.yaml with apiBase and apiKey, creates the file if missing, and keeps your YAML comments."
nav: Continue
order: 12
harness: continue
related:
  - docs/harnesses.md
  - docs/providers.md
  - docs/providers/openrouter.md
---

# Use any provider in Continue

Also at [yoink.codes/harnesses/continue/](https://yoink.codes/harnesses/continue/).

Continue lists its models in `~/.continue/config.yaml`, one entry per model, and uses whichever entry comes first. yoink writes an entry for every model you selected, with `apiBase` and a literal `apiKey`, and `--default` moves your pick to the top of the list. The command is `yoink connect <name> --to continue --default <model>`.

## What yoink writes

If the file does not exist yet, yoink creates it with a header (`name: Local Config`, `version: 1.0.0`, `schema: v1`) and a `models` list. One model from the OpenRouter preset comes out like this, key redacted:

```yaml
name: Local Config
version: 1.0.0
schema: v1
models:
  - name: GLM-4.7 (openrouter)
    provider: openai
    model: z-ai/glm-4.7
    apiBase: https://openrouter.ai/api/v1/
    apiKey: <your key>
    roles:
      - chat
      - edit
      - apply
    capabilities:
      - tool_use
    defaultCompletionOptions:
      contextLength: 204800
      maxTokens: 131072
```

This matches the OpenAI-compatible form in Continue's [OpenAI provider docs](https://docs.continue.dev/customize/model-providers/top-level/openai): `provider: openai` plus a custom `apiBase`. A few specifics:

- `apiBase` always ends in `/`. For an Anthropic endpoint it is the base URL plus `/v1/`, with `provider: anthropic`.
- `roles` is always `chat`, `edit` and `apply`. yoink does not add `autocomplete` or `embed`, so pick a separate model for those.
- `capabilities` gains `image_input` when the model accepts images.
- The `name` is the model's display name followed by the profile id in parentheses. That suffix is how yoink recognizes its entries.

## Which providers work

Continue takes OpenAI Chat, then Anthropic Messages. Every preset lands on its Chat endpoint, `ollama` and `openai` included, so the Anthropic shape only shows up for a custom gateway that answered the `/v1/messages` probe and not the Chat one. A Responses-only gateway cannot connect.

## How the default works

Continue has no default-model key, so yoink uses list order. `--default` moves that model's entry to the first position; without it, a new provider's entries go to the end and a known provider's entries stay where they were. Your own entries keep their order around them.

```bash
yoink connect openrouter --to continue --default z-ai/glm-4.7
yoink connect openrouter --to continue
```

## Still on config.json?

Older Continue setups use `~/.continue/config.json`. If that file exists and `config.yaml` does not, yoink refuses to connect, because a new `config.yaml` would hide your JSON config. The error asks you to run Continue's "Convert config.json to config.yaml" action first. `yoink import` still reads models from the legacy file, and `yoink harnesses` shows `config.json` as the config path until you migrate.

## Detection

yoink treats Continue as installed when `~/.continue` exists, the `cn` command-line tool is on your `PATH`, or a `continue.continue-*` folder is in `~/.vscode/extensions`.

## Disconnect and backups

`yoink disconnect openrouter --from continue` removes every entry whose name ends in `(openrouter)` and keeps the rest of the file, comments included. The first write keeps the original as `config.yaml.yoink.bak`.

## FAQ

### Can I rename the entries yoink adds?

Not safely. yoink matches its entries by the full `<model name> (<provider>)` name, such as `GLM-4.7 (openrouter)`. Rename one and keep the suffix, and the next connect or re-sync replaces it with a fresh entry under the original name, losing your name and any keys you added. Drop the suffix, and yoink stops recognizing it: the next connect adds a duplicate and disconnect leaves yours behind. To customize an entry, add keys and leave `name` alone: yoink rewrites only the fields shown in the example above and keeps any other key you put on the entry.

### Why does yoink skip some of my models during import?

`yoink import` adopts entries with `provider: openai` or `provider: anthropic` and a literal key. An `apiKey` written as a `${{ secrets.NAME }}` template, or any other reference to a variable, is skipped, because yoink cannot keep a key in sync that it never sees.
