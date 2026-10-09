---
title: Use Ollama in your coding agents
seoTitle: "Use local Ollama models in opencode, pi and Crush · Yoink"
description: "The ollama preset points 10 coding agents at http://localhost:11434/v1. Codex, Claude Code and Claude Desktop need other protocols, so they are not offered."
nav: Ollama
order: 7
preset: ollama
related:
  - docs/providers.md
  - docs/harnesses.md
  - docs/harnesses/pi.md
---

# Use Ollama in your coding agents

Also at [yoink.codes/providers/ollama/](https://yoink.codes/providers/ollama/).

To use local Ollama models in opencode, pi, Crush, Qwen Code, Continue and five more agents, run `yoink add`, pick **Ollama (local)**, choose from the models your server reports and tick the agents. yoink writes `http://localhost:11434/v1` into each config. Codex, Claude Code and Claude Desktop cannot use this preset.

## One endpoint, on localhost

The `ollama` preset is the only one with a single endpoint and the only one on plain `http`: OpenAI Chat Completions at `http://localhost:11434/v1`. That one protocol decides the reach:

- **Reached (10):** pi, omp, opencode, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed and Continue all accept Chat Completions.
- **codex** needs OpenAI Responses.
- **Claude Code** and **Claude Desktop** need Anthropic Messages.

So the honest answer to "Claude Code with Ollama" is that this preset cannot do it. `yoink connect ollama --to claude-code` stops with `"ollama" has no Anthropic-compatible endpoint, which Claude Code requires.` A server that answers `/v1/messages` can still be added as a [custom provider](../providers.md#custom-providers-and-endpoint-probing); the probe decides.

## The key prompt

The preset has no key page, but yoink still asks for an API key: the interactive prompt rejects an empty value, and the scripted form fails with "No token received on stdin" without one. Ollama's own [OpenAI compatibility docs](https://docs.ollama.com/api/openai-compatibility) say the client needs an API key value and the local server ignores it, so any non-empty string satisfies both.

## Add it

Start Ollama first. In the interactive flow yoink lists models from `http://localhost:11434/v1/models`, and when nothing is listening it stops with `Could not reach http://localhost:11434/v1/models. Check the base URL and your connection.` The scripted form never contacts the server, so it works even while Ollama is stopped:

```bash
yoink add

echo "ollama" | yoink add --external --name ollama --preset ollama \
  --models <model> --connect opencode,pi,crush,continue --default <model> --token-stdin
```

The interactive flow suggests the profile id `ollama-local`, from the label "Ollama (local)". Zed derives its key variable from that id (`OLLAMA_LOCAL_API_KEY`, or `OLLAMA_API_KEY` for the id `ollama`); since Ollama ignores the key, any value there works too.

## Local model limits

yoink looks every selected model up on models.dev. When a local model name has no entry there, yoink falls back to its defaults: a 128,000 token context window, 32,000 output tokens, text input, no reasoning. Those numbers reach every config that stores limits. Continue, for example, gets:

```yaml
models:
  - name: <model> (ollama)
    provider: openai
    model: <model>
    apiBase: http://localhost:11434/v1/
    apiKey: ollama
    roles:
      - chat
      - edit
      - apply
    capabilities:
      - tool_use
    defaultCompletionOptions:
      contextLength: 128000
      maxTokens: 32000
```

These are yoink's defaults, not values read from Ollama, so they can differ from the context your model actually runs with. Droid is written differently from the other presets: with no Anthropic or Responses endpoint available, its entries use `provider: "generic-chat-completion-api"`.

## Ollama on another machine

The preset always points at `localhost`. For a server elsewhere on your network, add a custom provider with the address and skip the probe by naming the protocol:

```bash
echo "ollama" | yoink add --external --name gpu-box --provider "Ollama (gpu-box)" \
  --base-url http://192.168.1.20:11434/v1 --protocol openai-chat \
  --models <model> --connect crush --token-stdin
```

## FAQ

### Do I have to re-run yoink after pulling a new model?

Yes, to expose it in your agents. Run `yoink models ollama` to reopen the picker against the server's current list, or `yoink models ollama --set <model>,<model>` to name them directly. Either re-syncs every connected agent.

### Does yoink start or manage the Ollama server?

No. yoink only writes agent configs that point at `http://localhost:11434/v1`. Starting Ollama and pulling models stay with Ollama.
