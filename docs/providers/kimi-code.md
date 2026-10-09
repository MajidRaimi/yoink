---
title: Use a Kimi Code API key in your coding agents
seoTitle: "Use a Kimi Code API key in opencode, pi and more · Yoink"
description: "The kimi-code preset points Claude Code at api.kimi.com/coding and opencode, pi or Crush at api.kimi.com/coding/v1. Distinct from switching Kimi logins."
nav: Kimi Code
order: 2
preset: kimi-code
related:
  - docs/subscriptions.md
  - docs/providers/moonshot.md
  - docs/harnesses.md
---

# Use a Kimi Code API key in your coding agents

Also at [yoink.codes/providers/kimi-code/](https://yoink.codes/providers/kimi-code/).

A Kimi Code API key works in opencode, pi, Crush, Claude Code and eight more agents through the `kimi-code` preset. Run `yoink add`, pick **Kimi Code**, paste the key from `https://www.kimi.com/code`, choose models and tick agents. yoink writes `https://api.kimi.com/coding/v1` or `https://api.kimi.com/coding` into each config, depending on the protocol.

## Two URLs that differ by /v1

Both endpoints live under the same path. OpenAI Chat Completions is `https://api.kimi.com/coding/v1`, and Anthropic Messages is the same address without `/v1`, `https://api.kimi.com/coding`. Chat Completions comes first in the preset, so the interactive picker lists models from `https://api.kimi.com/coding/v1/models`.

In practice the Anthropic URL lands in three places: Claude Code's `ANTHROPIC_BASE_URL`, Droid's `customModels` entries (with `provider: "anthropic"`), and the Claude Desktop config library. Every other agent gets the `/v1` address.

## This is not Kimi Code login switching

yoink handles Kimi in two unrelated ways, and they never share a credential:

| Aspect | `kimi-code` preset (this page) | Kimi Code login |
| --- | --- | --- |
| What you hold | An API key | A subscription sign-in from `kimi login` |
| Where it goes | Other agents' config files | `~/.kimi-code/credentials/` (or `$KIMI_CODE_HOME`) |
| Which tool uses it | opencode, pi, Crush, Claude Code and the rest | The Kimi Code CLI only |
| Command | `yoink connect kimi-code --to ...` | `yoink use <name>`, saved with `--tool kimi` |

Switching a Kimi login never touches the agents this preset is connected to, and connecting the preset never changes who is signed in to the Kimi CLI. The login side is covered in [Subscriptions](../subscriptions.md#kimi-code).

## Add it

```bash
yoink add

echo "$KIMI_CODE_API_KEY" | yoink add --external --name kimi-code --preset kimi-code \
  --models <model> --connect opencode,pi,crush --default <model> --token-stdin
```

The suggested profile id in the interactive flow is `kimi-code`, which also names the provider inside each config. Agents that read the key from the environment derive their variable from that id: Goose looks for `CUSTOM_KIMI_CODE_API_KEY` and Zed for `KIMI_CODE_API_KEY`, and yoink prints the exact name after connecting.

Here is the Crush entry yoink writes into `~/.config/crush/crush.json` (model list trimmed):

```json
{
  "providers": {
    "kimi-code": {
      "name": "Kimi Code",
      "type": "openai-compat",
      "base_url": "https://api.kimi.com/coding/v1",
      "api_key": "<your key>",
      "models": [{ "id": "<model>", "name": "<model>" }]
    }
  },
  "models": { "large": { "model": "<model>", "provider": "kimi-code" } }
}
```

## Use it in Claude Code

Connecting `kimi-code` to Claude Code switches Claude Code over to it, because Claude Code holds one backend at a time. yoink writes the [seven managed keys](../providers.md#claude-code-is-exclusive) with `ANTHROPIC_BASE_URL` set to `https://api.kimi.com/coding`. Switching back to a saved Claude account strips them.

```bash
yoink connect kimi-code --to claude-code --default <model>
```

## Pick models and rotate the key

`yoink models kimi-code` reopens the picker against the live list, and `--set` takes ids directly. A new key goes in with `yoink edit kimi-code --token-stdin` and reaches every connected agent at once.

## FAQ

### Should I pick kimi-code or moonshot?

Pick the preset that matches where your key came from. `kimi-code` sends it to `api.kimi.com`, with keys from `https://www.kimi.com/code`. `moonshot` sends it to `api.moonshot.ai`, with keys from the Moonshot AI platform console. See [the Moonshot page](./moonshot.md).

### Which agents get the URL without /v1?

Claude Code, Droid and Claude Desktop, the three that use Anthropic Messages from this preset, get `https://api.kimi.com/coding`. Every other agent yoink connects gets `https://api.kimi.com/coding/v1`. Codex gets neither, because it [needs a Responses endpoint](../harnesses/codex.md#which-providers-work).
