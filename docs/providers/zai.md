---
title: Use z.ai in your coding agents
seoTitle: "Use z.ai GLM in opencode, pi and other agents · Yoink CLI"
description: "Add a z.ai key once: yoink uses api.z.ai/api/anthropic for Claude Code and api.z.ai/api/paas/v4 for opencode, pi, Qwen Code, Crush and more."
nav: z.ai
order: 6
preset: zai
related:
  - docs/providers.md
  - docs/harnesses.md
  - docs/providers/openrouter.md
---

# Use z.ai in your coding agents

Also at [yoink.codes/providers/zai/](https://yoink.codes/providers/zai/).

To run z.ai's GLM models in opencode, pi, Qwen Code, Crush, Claude Code and seven more agents, add your key with `yoink add` and the `zai` preset. yoink writes `https://api.z.ai/api/paas/v4` into agents that speak OpenAI Chat Completions and `https://api.z.ai/api/anthropic` into those that speak Anthropic Messages.

## A base URL that ends in v4

Most OpenAI-style providers end their base URL in `/v1`. z.ai's ends in `/api/paas/v4`, and yoink keeps it exactly like that. Its URL normalizer treats any trailing `/v<number>` as a version, so it never appends a second `/v1`. The model picker therefore reads `https://api.z.ai/api/paas/v4/models`, and agents that want a full request path get one built on the same base: Goose, for example, is given `https://api.z.ai/api/paas/v4/chat/completions`.

The same rule matters if you ever add z.ai as a custom provider instead of the preset. Paste the `v4` URL as is and the probe will try `/chat/completions` and `/responses` under it unchanged.

## Add it

The preset id is `zai`, without a dot. The label is `Z.ai`, so the interactive flow suggests the profile id `z-ai`; the scripted example uses `zai`. Keys come from `https://z.ai/manage-apikey/apikey-list`.

```bash
yoink add

echo "$ZAI_API_KEY" | yoink add --external --name zai --preset zai \
  --models <model> --connect opencode,pi,qwen,goose --default <model> --token-stdin
```

GLM model ids are not built into yoink. Pick them from the live list, or pass the ids exactly as z.ai's `/models` returns them. Do not reuse OpenRouter ids here: OpenRouter prefixes the vendor, as in `z-ai/glm-4.7`, and that prefixed form belongs to the [OpenRouter preset](./openrouter.md).

```bash
yoink models zai
```

## What Qwen Code and Goose get

Qwen Code takes Chat Completions. yoink adds one entry per model under `modelProviders.openai` in `~/.qwen/settings.json` and puts the key in the `env` block once (entry trimmed):

```json
{
  "modelProviders": {
    "openai": [
      {
        "id": "<model>",
        "baseUrl": "https://api.z.ai/api/paas/v4",
        "envKey": "YOINK_ZAI_API_KEY",
        "wireApi": "chat-completions"
      }
    ]
  },
  "env": { "YOINK_ZAI_API_KEY": "<your key>" }
}
```

Goose (experimental) gets `custom_providers/custom_zai.json` with `"engine": "openai"` and `"api_key_env": "CUSTOM_ZAI_API_KEY"`, plus `GOOSE_PROVIDER: custom_zai` in `config.yaml`. Unless Goose runs with `GOOSE_DISABLE_KEYRING`, export `CUSTOM_ZAI_API_KEY` in your shell or enter the key once with `goose configure`.

## Use it in Claude Code

Connecting z.ai to Claude Code with `yoink connect zai --to claude-code --default <model>` writes `ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic` into `~/.claude/settings.json`, gives every tier the same GLM model, and makes z.ai the active profile. [Providers](../providers.md#claude-code-is-exclusive) lists the seven keys, and switching back to a Claude account removes them.

Note the shape of this second URL: `/api/anthropic` sits beside `/api/paas/v4`, not under it, and has no version suffix. The preset holds the two as separate endpoints, each tagged with its own protocol, so the `v4` rule above applies only to the Chat Completions address. Droid and Claude Desktop are the other two agents that take this Anthropic endpoint.

## FAQ

### Should I use the zai preset or OpenRouter for GLM models?

Use `zai` when your key is from z.ai; requests go straight to `api.z.ai`. Use `openrouter` when your key is from OpenRouter; model ids then carry the `z-ai/` prefix. Both presets reach the same twelve agents.

### Why does the profile id show up as z-ai?

The interactive flow builds its suggestion from the preset label, Z.ai, and the dot becomes a dash. The preset id stays `zai`. Type `zai` at the prompt if you prefer it; environment variables such as `YOINK_ZAI_API_KEY` follow the id you choose.
