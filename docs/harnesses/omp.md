---
title: Use any provider in omp
seoTitle: "Add a custom provider to omp (models.yml) · Yoink CLI"
description: "Connect a provider to omp. yoink writes ~/.omp/agent/models.yml (or models.yaml), carries over a legacy models.json and sets modelRoles.default in config.yml."
nav: omp
order: 2
harness: omp
related:
  - docs/harnesses/pi.md
  - docs/providers/openrouter.md
  - docs/guides/import-existing-provider-configs.md
---

# Use any provider in omp

Also at [yoink.codes/harnesses/omp/](https://yoink.codes/harnesses/omp/).

omp, the Oh My Pi coding agent, keeps custom providers in YAML at `~/.omp/agent/models.yml` and its default model under `modelRoles` in `config.yml`. yoink edits both files as YAML documents, so your other keys stay put. Add a key with `yoink add`, then run `yoink connect <name> --to omp` to write it.

## What yoink writes

omp reads the same provider schema as pi, only in YAML. yoink owns one entry under `providers`, keyed by the profile id you picked when you added the provider. This is the entry for an OpenRouter key saved as `openrouter`, with the key redacted. The context window and output limit come from [models.dev](../providers.md#model-selection-and-modelsdev) for models it knows.

```yaml
providers:
  openrouter:
    name: OpenRouter
    baseUrl: https://openrouter.ai/api/v1
    api: openai-completions
    apiKey: <your key>
    models:
      - id: z-ai/glm-4.7
        name: GLM-4.7
        reasoning: true
        input:
          - text
        contextWindow: 204800
        maxTokens: 131072
```

The `api` value tracks the protocol yoink picked: `openai-completions`, `openai-responses`, or `anthropic-messages`. The omp README on [GitHub](https://github.com/can1357/oh-my-pi) shows the same `baseUrl`, `api` and `models` fields for hand-written providers.

### models.yml or models.yaml

yoink writes `models.yml` by default. If you already keep a `models.yaml` in `~/.omp/agent` and no `models.yml`, yoink edits `models.yaml` instead, so you never end up with two provider files.

### Moving off a legacy models.json

Older omp setups kept providers in `~/.omp/agent/models.json`. When neither YAML file exists yet, the first `yoink connect` reads that JSON file and writes its whole contents into the new `models.yml` together with the yoink entry. Your hand-made providers come across unchanged, including ones whose key is an environment variable name. The JSON file itself stays on disk untouched, so you can delete it once omp is happy with the YAML.

## Which providers work

omp accepts OpenAI Chat, OpenAI Responses and Anthropic Messages, in that order of preference. Every preset reaches it, including a local `ollama`, and so does any custom URL that answers at least one probe.

```bash
yoink connect openrouter --to omp
yoink connect openrouter --to omp,pi --default z-ai/glm-4.7
```

Connecting to `omp` and [pi](./pi.md) together is common, since both agents read the same entry shape. Each still gets its own file, and yoink keeps them in sync when you change models or rotate the key.

## Set the default model

omp picks its model through roles. `--default z-ai/glm-4.7` writes this into `~/.omp/agent/config.yml`:

```yaml
modelRoles:
  default: openrouter/z-ai/glm-4.7
```

yoink only sets the `default` role. Any other roles you defined in `config.yml` are left as they are, and they can still point at models from other providers. Without `--default`, yoink does not touch `config.yml` at all.

## Backups and disconnect

The first write to `models.yml` and to `config.yml` saves a `.yoink.bak` copy next to each, once, as described in [Backups](../harnesses.md#backups). `yoink disconnect openrouter --from omp` deletes the `openrouter` entry and removes `modelRoles.default` only when it starts with `openrouter/`.

## Import and gotchas

- **Import skips env names.** `yoink import` adopts omp providers with a literal key. It skips `$VAR`, `${VAR}` and `!command` values, and, specific to omp, a bare upper case name such as `OPENROUTER_KEY`, because omp treats that as an environment variable to read.
- **Detection.** omp counts as installed when the `omp` binary is on your `PATH` or `~/.omp/agent` exists.
- **Restart.** A running omp session keeps the config it loaded. Restart it after a connect, a model change or a key rotation.

## FAQ

### Does yoink delete my old omp models.json?

No. It copies the providers from `models.json` into the new `models.yml` the first time it writes, and leaves the JSON file where it was. Remove it yourself after checking that omp lists your providers.

### Why did yoink import skip one of my omp providers?

Its `apiKey` is probably a bare upper case name like `OPENROUTER_KEY`, or a `$VAR` reference. omp reads those from your environment, so yoink never sees the real key and cannot keep it in sync. Put the literal key in the entry, or add the provider with `yoink add`.
