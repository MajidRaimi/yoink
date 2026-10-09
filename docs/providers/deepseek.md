---
title: Use DeepSeek in your coding agents
seoTitle: "Use DeepSeek in opencode, pi, Crush and more · Yoink CLI"
description: "Connect a DeepSeek API key to 12 coding agents with yoink. Claude Code uses api.deepseek.com/anthropic; opencode, pi and Crush use the OpenAI-style /v1."
nav: DeepSeek
order: 5
preset: deepseek
related:
  - docs/providers.md
  - docs/harnesses.md
  - docs/security.md
---

# Use DeepSeek in your coding agents

Also at [yoink.codes/providers/deepseek/](https://yoink.codes/providers/deepseek/).

DeepSeek works in opencode, pi, Crush, Claude Code and eight more coding agents once you add the key with `yoink add` and the `deepseek` preset. yoink stores the key once, then writes `https://api.deepseek.com/v1` into OpenAI-style configs and `https://api.deepseek.com/anthropic` into Anthropic-style ones. Only codex is out of reach, since it needs a Responses endpoint ([codex and providers](../harnesses/codex.md#which-providers-work)).

## Get a key and add it

Create a key at `https://platform.deepseek.com/api_keys`, then add it. There is no separate key check for this preset. Instead, the interactive flow fetches `https://api.deepseek.com/v1/models` with your key to build the model picker, so a wrong key shows up as a rejected request at that step, before anything is written.

```bash
yoink add

echo "$DEEPSEEK_API_KEY" | yoink add --external --name deepseek --preset deepseek \
  --models <model> --connect opencode,pi,crush --default <model> --token-stdin
```

The scripted form never contacts DeepSeek: a preset is not probed, and the models you pass are taken as given. It does look the ids up on [models.dev](../providers.md#model-selection-and-modelsdev), preferring entries filed under the provider key `deepseek` or served from `api.deepseek.com`, so opencode and Crush get real context and output limits.

## What opencode gets

opencode prefers OpenAI Chat Completions, so yoink writes the `/v1` endpoint through the `@ai-sdk/openai-compatible` package and sets the default as `deepseek/<model>`:

```json
{
  "provider": {
    "deepseek": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "DeepSeek",
      "options": {
        "baseURL": "https://api.deepseek.com/v1",
        "apiKey": "<your key>"
      },
      "models": { "<model>": { "name": "<model>", "tool_call": true } }
    }
  },
  "model": "deepseek/<model>"
}
```

The rest of `opencode.json` is left alone, and the original file is copied to `opencode.json.yoink.bak` the first time yoink changes it ([backups](../harnesses.md#backups)).

## Where the /anthropic URL goes

Three agents take Anthropic Messages from this preset: Claude Code, Droid (which lists it first) and Claude Desktop. Claude Desktop is experimental and gets a file of its own, `Claude-3p/configLibrary/yoink-deepseek.json`:

```json
{
  "inferenceProvider": "gateway",
  "inferenceGatewayBaseUrl": "https://api.deepseek.com/anthropic",
  "inferenceGatewayApiKey": "<your key>",
  "inferenceModels": ["<model>"]
}
```

yoink does not activate it. The notice after connecting tells you to open Claude Desktop, go to Developer, then Configure third-party inference, select `yoink-deepseek`, and relaunch.

Claude Code is the other Anthropic consumer. Connecting DeepSeek there writes `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic` with your model in every tier and makes DeepSeek the active profile; [Providers](../providers.md#claude-code-is-exclusive) lists the seven keys and the per-project scope.

## Keys outside config files

Two agents read the DeepSeek key from your environment instead of a file yoink writes the key into. Goose looks for `CUSTOM_DEEPSEEK_API_KEY` (unless `GOOSE_DISABLE_KEYRING` is set, in which case yoink fills `secrets.yaml`), and Zed looks for `DEEPSEEK_API_KEY`. Qwen Code keeps it in its own `env` block as `YOINK_DEEPSEEK_API_KEY`, which yoink manages.

## FAQ

### Do I need two DeepSeek keys for the two endpoints?

No. The preset stores one key and sends it to whichever endpoint each agent uses. Rotating it with `yoink edit deepseek --token-stdin` updates every connected config at once.

### How do I find out if my DeepSeek key is wrong?

Use the interactive `yoink add`. The preset has no key-check URL, but the model picker fetches `https://api.deepseek.com/v1/models` with your key, so a rejected key fails there before anything is written. The scripted form takes the key as given and does not send it to DeepSeek.
