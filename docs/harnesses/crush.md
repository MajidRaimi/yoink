---
title: Use any provider in Crush
seoTitle: "Add a custom provider to Charm Crush · Yoink CLI"
description: "yoink writes providers.<id> into ~/.config/crush/crush.json with type openai-compat or anthropic and sets models.large. It warns if a crushrc overrides it."
nav: Crush
order: 9
harness: crush
related:
  - docs/harnesses.md
  - docs/providers/openrouter.md
  - docs/security.md
---

# Use any provider in Crush

Also at [yoink.codes/harnesses/crush/](https://yoink.codes/harnesses/crush/).

To give Charm's Crush another provider, yoink adds a `providers.<id>` block to `~/.config/crush/crush.json`, typed `openai-compat` or `anthropic`, and with `--default` points `models.large` at your model. It never edits Crush's state folder. One command does it: `yoink connect <name> --to crush --default <model>`.

## What yoink writes

On a fresh machine yoink creates `crush.json` with Crush's `$schema` line, then adds the provider. This is the OpenRouter preset after `--default z-ai/glm-4.7`, key redacted; the limits come from models.dev:

```json
{
  "$schema": "https://charm.land/crush.json",
  "providers": {
    "openrouter": {
      "name": "OpenRouter",
      "type": "openai-compat",
      "base_url": "https://openrouter.ai/api/v1",
      "api_key": "<your key>",
      "models": [
        {
          "id": "z-ai/glm-4.7",
          "name": "GLM-4.7",
          "cost_per_1m_in": 0,
          "cost_per_1m_out": 0,
          "cost_per_1m_in_cached": 0,
          "cost_per_1m_out_cached": 0,
          "context_window": 204800,
          "default_max_tokens": 131072,
          "can_reason": true,
          "supports_attachments": false
        }
      ]
    }
  },
  "models": {
    "large": { "model": "z-ai/glm-4.7", "provider": "openrouter" }
  }
}
```

The four cost fields are always `0`: yoink has no price list, so it writes zero instead of guessing. `context_window`, `default_max_tokens` and `can_reason` come from the model data yoink stores with the provider, and `supports_attachments` follows whether the model takes images.

## Which providers work

Crush takes OpenAI Chat Completions first and Anthropic Messages second. It has no Responses support through yoink, so:

- the `openai` preset lands as `openai-compat` against `https://api.openai.com/v1`, not as Crush's own `openai` type;
- the five dual-endpoint presets (`openrouter`, `kimi-code`, `moonshot`, `deepseek`, `zai`) use their Chat endpoint;
- `ollama` works on `http://localhost:11434/v1`;
- a custom gateway that only answered the `/responses` probe is refused with "has no endpoint Crush can use".

```bash
yoink connect openrouter --to crush --default z-ai/glm-4.7
yoink connect ollama --to crush
```

## Crush is not experimental

Crush carries no experimental tag in yoink; the experimental harnesses are Goose, Zed and Claude Desktop. The key goes straight into `crush.json` as a literal `api_key`, so there is no environment variable to export afterwards.

## Two notices to read after connecting

**A `crushrc` beside the file.** Crush's [README](https://github.com/charmbracelet/crush) (checked 2026-10-10) documents a newer `crushrc` format and calls the JSON format still supported but deprecated. When a `crushrc` sits in the same folder as `crush.json`, yoink prints "If Crush reads it instead of crush.json, add OpenRouter there too." yoink only looks in that folder; a project-level `.crushrc` is not checked.

**A model picked in the Crush UI.** Crush remembers your last picker choice in its state file, `~/.local/share/crush/crush.json`. yoink reads that file but never writes it. If it names a different provider than the one you just set as default, yoink tells you to pick `<provider>/<model>` in Crush with `ctrl+m`.

## Paths

| Setting | Effect |
| --- | --- |
| `CRUSH_GLOBAL_CONFIG` | folder that holds `crush.json` |
| `XDG_CONFIG_HOME` | `crush.json` goes in `$XDG_CONFIG_HOME/crush` |
| `CRUSH_GLOBAL_DATA`, `XDG_DATA_HOME` | where yoink looks for the state file |
| Windows, neither set | `%LOCALAPPDATA%\crush` |

## Default and disconnect

`--default` merges `model` and `provider` into `models.large` and leaves any other keys you set there alone. `yoink disconnect openrouter --from crush` removes the provider block and clears `models.large` and `models.small` when either points at it. The first write keeps the original file as `crush.json.yoink.bak`.

## FAQ

### Do I need to migrate to crushrc for yoink to work?

No. Crush still reads `crush.json`, and that is the file yoink manages. If you have already moved to `crushrc`, yoink's notice is the cue to add the provider there by hand, because yoink does not write `crushrc`.

### Why are the cost fields zero?

yoink writes every `cost_per_1m_*` field as `0` because it has no price list to fill them from. The provider still bills you as usual; check usage on the provider's own dashboard, or edit the numbers by hand. A hand edit to a cost field is overwritten on the next re-sync, since those fields belong to yoink.
