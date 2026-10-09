---
title: Import the providers you already configured
seoTitle: "Import providers from your coding agent configs · Yoink CLI"
description: "yoink import reads pi, opencode, codex, Crush and other harness configs, merges the same key and URL into one provider, and keeps every harness in sync after."
nav: Import existing providers
order: 8
related:
  - docs/harnesses.md
  - docs/security.md
  - docs/guides/one-api-key-every-coding-agent.md
---

# Import the providers you already configured

Also at [yoink.codes/guides/import-existing-provider-configs/](https://yoink.codes/guides/import-existing-provider-configs/).

If you already pasted API keys into pi, opencode, codex or other coding agents, run `yoink import`. yoink reads every installed harness config, collects each provider that holds a literal key, merges entries that share a key and base URL, and from then on re-writes those configs whenever you edit the provider in one place.

## The short answer

```bash
yoink harnesses
yoink import
yoink import --yes
yoink list
```

`yoink harnesses` shows which harnesses yoink detects and which providers it already manages in each. `yoink import` opens a checklist of what it found, with every candidate pre-selected and a hint naming the harnesses it came from and its model count. `yoink import --yes` imports all of them without asking, which is the form to use in a script: without a terminal and without `--yes`, yoink stops with `Pass --yes to import without prompting.` Run it again later and it answers `No unmanaged providers found in your harness configs.`

## What import finds

yoink asks each installed harness adapter for the providers in its config: pi's `models.json`, omp's `models.yml`, opencode's and Kilo Code's `provider` block, codex's `[model_providers.*]` tables, Qwen Code's `modelProviders`, Droid's `customModels`, Crush's `providers`, Continue's `models`, Claude Desktop's library, and the `ANTHROPIC_BASE_URL` in Claude Code's `settings.json`. Each entry brings its base URL, protocol and models. Model limits that the harness config stored, such as pi's `contextWindow`, are kept; a model with no limits gets the defaults of 128,000 tokens of context and 32,000 of output.

A harness whose config cannot be parsed is reported as `Could not read <harness> config: <reason>`, and the scan carries on with the others.

## What it skips and why

yoink can only keep a key in sync if it has the key itself. An entry that points somewhere else is skipped:

| Form in the config | Example |
| --- | --- |
| Shell variable | `$OPENAI_API_KEY`, `${OPENAI_API_KEY}` |
| opencode variable or file | `{env:GROQ_API_KEY}`, `{file:~/.keys/groq}` |
| Command | `!pass show openai` |
| Bare variable name in omp | `OPENAI_API_KEY` |

For the same reason Zed has nothing to import (it never stores a key in `settings.json`), and neither does Goose when its key lives in the OS keyring. Providers yoink already manages, matched by the same key and a shared base URL, are left out of the list.

## Merging the same key across harnesses

The same key at the same base URL, found in several harnesses, becomes one provider. Its endpoints and models are the union of what each harness had. Suppose pi holds a DeepSeek entry called `ds` with `deepseek-reasoner`, and opencode holds the same key and URL as `deepseek` with `deepseek-chat`. `yoink import --yes` creates one provider, `ds`, with both models. It then re-writes both configs: opencode's `deepseek` entry is replaced by `ds`, and its `"model": "deepseek/deepseek-chat"` default becomes `"ds/deepseek-chat"`, so opencode still opens on the same model.

If the chosen id is already taken by another yoink profile, the import gets a numbered suffix such as `ds-2`. A harness that cannot use the merged provider's protocols is left unchanged and named in the output.

### Claude Code is imported, not activated

An `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN` in `~/.claude/settings.json` become a provider named after the host (`https://api.z.ai/api/anthropic` becomes `z`), with `ANTHROPIC_MODEL` as its model. yoink saves it but does not make it the active Claude Code profile and does not rewrite `settings.json`. Claude Code holds one backend at a time, so taking it over is left to an explicit `yoink use z`.

## After import: one place to edit

Each imported provider is recorded as connected to the harnesses it came from. From now on:

```bash
echo "$NEW_DEEPSEEK_KEY" | yoink edit ds --token-stdin
yoink connect ds --to crush,qwen
yoink status ds
```

The key rotation reaches pi and opencode together, and `yoink connect` adds harnesses the key was never pasted into. The first time yoink rewrites each existing config, it saves the original as `<file>.yoink.bak` next to it, so the hand-written version is still there if you want to compare.

## FAQ

### Does the menu offer an import on its own?

Once. The first time you open the interactive menu, yoink scans your harnesses and, if it finds unmanaged providers, shows the same checklist with a short first-run note. Skipping it records that the offer was made. If that scan finds nothing but could not read one of the configs, the offer stays open and runs again the next time you open the menu. `yoink import` works at any time.

### Why was my provider not found?

Usually because the config stores a reference instead of the key, such as `{env:VAR}` or `$VAR`. Either replace it with the literal key and run `yoink import` again, or add the provider fresh with `yoink add` and connect it to that harness. Also check `yoink harnesses`: an agent shown as not installed is not scanned.

### Will import change my default models?

No. When yoink re-writes an imported entry, it reads the default each harness had and writes it back, renaming the provider part of the model reference when the id changed.
