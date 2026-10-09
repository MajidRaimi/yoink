---
title: Use an OpenAI API key in your coding agents
seoTitle: "Use an OpenAI API key in Codex, opencode and pi · Yoink CLI"
description: "The openai preset has a Responses endpoint, so it is the one preset that reaches Codex. yoink writes it to 11 agents; Claude Code needs Anthropic Messages."
nav: OpenAI
order: 1
preset: openai
related:
  - docs/harnesses/pi.md
  - docs/subscriptions.md
  - docs/harnesses.md
---

# Use an OpenAI API key in your coding agents

Also at [yoink.codes/providers/openai/](https://yoink.codes/providers/openai/).

To use an OpenAI API key in Codex, opencode, pi and eight more agents, run `yoink add`, pick the `openai` preset, paste the key and tick the agents. It is the only preset with an OpenAI Responses endpoint, so it is the only one Codex accepts. Claude Code and Claude Desktop are left out: they need Anthropic Messages.

## One base URL, two protocols

The `openai` preset saves two endpoints at the same address, `https://api.openai.com/v1`: OpenAI Responses first, then OpenAI Chat Completions. The other six presets offer Chat Completions with Anthropic Messages, or Chat Completions alone. Because Responses comes first, the interactive model picker is built from `https://api.openai.com/v1/models` through that endpoint.

Which protocol an agent receives depends on its own preference order, not on the preset. Two agents end up on Responses:

- **codex** speaks nothing else to custom providers.
- **Droid** prefers Anthropic Messages, which this preset lacks, so it takes Responses next and yoink writes its `customModels` entries with `provider: "openai"`.

pi, omp, opencode, Qwen Code, Kilo Code, Crush, Goose, Zed and Continue all put Chat Completions first and get that. The [pi page](../harnesses/pi.md#faq) explains why that shows up as `openai-completions` in `models.json`.

## Add it, and name it something other than openai

Interactively, `yoink add` suggests the profile id `openai`, taken from the preset label. Change it before you connect Codex. Codex ships a built-in provider with the id `openai`, and when it merges `[model_providers]` from `config.toml` it keeps a built-in entry over a user entry with the same id ([source](https://github.com/openai/codex/blob/main/codex-rs/model-provider-info/src/lib.rs)). A table yoink writes as `[model_providers.openai]` would then be ignored, and Codex would fall back to its built-in OpenAI provider and its own credentials instead of your key. Any other id, such as `openai-api`, avoids the clash.

```bash
yoink add

echo "$OPENAI_API_KEY" | yoink add --external --name openai-api --preset openai \
  --models gpt-5.2,gpt-5.2-codex --connect pi,codex --default gpt-5.2-codex --token-stdin

yoink connect openai-api --to opencode,crush,droid
```

For Codex, yoink writes one table and, with `--default`, the two root keys:

```toml
model = "gpt-5.2-codex"
model_provider = "openai-api"

[model_providers.openai-api]
name = "OpenAI"
base_url = "https://api.openai.com/v1"
wire_api = "responses"
experimental_bearer_token = "<your key>"
```

## Codex: ChatGPT login or API key

Setting `model_provider` makes Codex send its requests with the API key instead of your ChatGPT login. If `~/.codex/auth.json` holds a ChatGPT login when you connect, yoink prints this notice under the result (path shortened):

```text
Codex is set to model_provider = "openai-api" in ~/.codex/config.toml, which overrides the ChatGPT login.
Run `yoink disconnect openai-api --from codex` or remove model_provider from that file to use ChatGPT.
```

Disconnecting removes the table and clears `model` and `model_provider` only when they point at this provider. Switching between several ChatGPT logins is a separate feature that rewrites `auth.json`; see [Subscriptions](../subscriptions.md#chatgpt-codex).

## Why Claude Code is not offered

Claude Code and Claude Desktop accept only Anthropic Messages. `yoink connect openai-api --to claude-code` stops with `"openai-api" has no Anthropic-compatible endpoint, which Claude Code requires.` and writes nothing. To run an OpenAI-hosted model in Claude Code you need a gateway that answers `/v1/messages`, added as a [custom provider](../providers.md#custom-providers-and-endpoint-probing).

## Rotate or narrow the key

`yoink edit openai-api` re-writes a new key into every connected agent, including the `experimental_bearer_token` line in `config.toml`. `yoink models openai-api --set gpt-5.2` trims the model list and re-syncs the same set of agents.

```bash
echo "$NEW_OPENAI_API_KEY" | yoink edit openai-api --token-stdin
```

## FAQ

### Can I keep my ChatGPT login and an OpenAI API key in Codex at the same time?

Both can be saved, but Codex uses one at a time. While `model_provider` points at the yoink provider, Codex uses the key. Run `yoink disconnect openai-api --from codex` to go back to the ChatGPT login.

### Why does Droid get the Responses endpoint when pi gets Chat Completions?

Droid's order is Anthropic Messages, then Responses, then Chat Completions. This preset has no Anthropic endpoint, so Responses is the first match. pi lists Chat Completions first.
