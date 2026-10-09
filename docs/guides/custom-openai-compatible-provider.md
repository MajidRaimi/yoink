---
title: Connect a custom OpenAI- or Anthropic-compatible provider
seoTitle: "Connect any OpenAI-compatible API to coding agents · Yoink"
description: "Paste a base URL and key, and yoink probes /v1/models, /v1/messages, /chat/completions and /responses to find what a gateway or vLLM server speaks."
nav: Custom compatible provider
order: 10
related:
  - docs/providers.md
  - docs/security.md
  - docs/guides/one-api-key-every-coding-agent.md
---

# Connect a custom OpenAI- or Anthropic-compatible provider

Also at [yoink.codes/guides/custom-openai-compatible-provider/](https://yoink.codes/guides/custom-openai-compatible-provider/).

To connect a gateway, a self-hosted proxy or a vLLM server to your coding agents, give yoink its base URL and key with `yoink add`, choosing **Custom**. yoink probes `/v1/models`, `/v1/messages`, `/chat/completions` and `/responses`, saves every protocol that answers, and offers only the agents those protocols can reach.

## The short answer

```bash
echo "$FUSE_API_KEY" | yoink probe --base-url https://api.fuse.example/v1 --token-stdin --json

echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \
  --base-url https://api.fuse.example/v1 --models claude-sonnet-4-5,gpt-5.2 \
  --connect pi,opencode,omp --default claude-sonnet-4-5 --token-stdin
```

`yoink probe` is a dry run: it prints the endpoints and models it found and saves nothing. Without `--json`, a run against a local test server that answers OpenAI Chat and Anthropic Messages prints:

```text
✔ anthropic-messages   http://localhost:18765
✔ openai-chat          http://localhost:18765/v1
2 model(s): claude-sonnet-4-5, gpt-5.2
```

`yoink add` runs the same probe and then saves the provider. Interactively, `yoink add`, then **Provider (API key)**, then **Custom**, asks for a display name and the base URL before the key.

## How endpoint probing works

The probe runs in two rounds, and every request goes to the host you gave:

1. **List models.** yoink calls the OpenAI-style `/models` (first at your URL as given, then with `/v1` added) and the Anthropic-style `/v1/models` at the same time, and merges the two lists.
2. **Ping each protocol.** It sends a tiny `ping` request to `/v1/messages` (Anthropic Messages), to `/chat/completions` (OpenAI Chat, only when a model list came back) and to `/responses` (OpenAI Responses). Each ping tries up to three chat models from the list, skipping ids that look like embedding, speech, image, moderation or rerank models.

A protocol counts as supported when the server answers in that protocol's shape, or with a structured `400` or `422` error, which proves the route exists. A `404` whose error mentions the model also counts. A `404` with an error body that does not mention the model retries with the next model, and a `404` with no error body means the route is missing. Every supported protocol is saved as an endpoint, at most one per protocol.

Each request times out after 8 seconds. Redirects on the same host are followed. A redirect to a different host is not, so the key is never sent somewhere you did not type; yoink tells you to use the final base URL instead.

## URL normalization

Paste whichever URL the provider's docs show. yoink drops a trailing `/chat/completions`, `/completions`, `/responses`, `/messages` or `/models`, plus any query string and trailing slash. OpenAI-style endpoints keep their version segment (`/v1`, `/v4`, `/v1beta`), and the Anthropic endpoint is stored without `/v1`, because `/v1/messages` is added on each call. So `https://api.fuse.example/v1/chat/completions` is saved as `https://api.fuse.example/v1` for Chat and `https://api.fuse.example` for Messages.

## Skip probing with --protocol or --endpoint

When you already know what the server speaks, or it is not running yet, skip the network:

```bash
echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \
  --base-url https://api.fuse.example/v1 --protocol openai-chat,anthropic-messages \
  --models claude-sonnet-4-5 --token-stdin

echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \
  --endpoint openai-chat=https://api.fuse.example/v1,anthropic-messages=https://api.fuse.example \
  --models claude-sonnet-4-5 --token-stdin
```

`--protocol` saves each listed protocol at the one `--base-url`, normalized as above. `--endpoint` gives each protocol its own exact URL, for servers that put them on different paths. `--endpoint` cannot be combined with `--preset` (yoink answers `Pass either --preset or --endpoint, not both.`) or with `--protocol`, and a protocol may appear only once in it.

## When the probe fails

| Message | Meaning |
| --- | --- |
| `The provider at <url> rejected the API key (401/403).` | Every route that answered refused the key. Check the key, not the URL. |
| `No OpenAI or Anthropic compatible API answered at <url>.` | Nothing answered in a known shape: a wrong path, a server that is down, or a protocol yoink does not speak. |
| `<url> redirected to a different host.` | Use the URL the redirect points to as the base URL. |

The protocols found decide which agents you can tick. A server with only OpenAI Chat reaches ten harnesses, but not codex, Claude Code or Claude Desktop. codex needs a `/responses` route and both Claude apps need `/v1/messages`.

## Model metadata from models.dev

pi, omp and opencode want a context window, an output limit, reasoning and image support for each model. yoink looks every selected model up in the [models.dev](https://models.dev) catalog, preferring an entry from the same provider (matched by preset id or by the host of your base URL), then exact ids over vendor-prefixed ones. The catalog is fetched without your key and cached at `~/.config/yoink/cache/models-dev.json`. It is refreshed at most once a day; if a refresh fails, yoink keeps the cached copy and waits an hour before trying again. A model the catalog does not know gets a 128,000 token context window, 32,000 output tokens, text input and no reasoning.

## FAQ

### Can I connect a server on localhost?

Yes. `http://` URLs work, so a local vLLM or proxy on your machine can be probed and connected like any other. The `ollama` preset is the built-in shortcut for `http://localhost:11434/v1`.

### Do I have to probe again after the server adds a protocol?

Yes. Run `yoink edit <name>` and pick **Endpoints**, which re-probes a base URL and saves what answers now. Every connected harness is re-synced with the new endpoints, and harnesses that need the new protocol can then be ticked.
