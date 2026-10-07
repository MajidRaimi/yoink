# Providers

A provider is an API-key backend (OpenAI, Kimi, OpenRouter, a local Ollama, or any OpenAI- or Anthropic-compatible API) that yoink stores once and writes into every coding harness you connect it to: pi, omp, opencode, codex, Claude Code, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue, and Claude Desktop. You keep one key and one model list in yoink, and yoink keeps each harness config in sync. See [Harnesses](./harnesses.md) for what gets written where.

## Adding a provider

Run `yoink add` (alias `yoink login`) in an interactive terminal and pick **Provider (API key)**. yoink then asks:

1. **Which provider?** One of the presets below, or **Custom**.
2. **API key.** Hidden input.
3. **Models.** A picker built from the provider's live model list. Lists longer than 12 entries get a search box: type to filter, space to toggle, and select as many models as you like.
4. **Profile id.** The id harness configs use for this provider (letters, digits, dots, dashes, underscores). yoink suggests one from the provider name.
5. **Harnesses.** Which installed harnesses to connect it to, and the default model for them.

```bash
yoink add
```

### Presets

Presets know their endpoints, so yoink only needs a key. With a preset, yoink lists models from the first endpoint below.

| Preset id | Provider | Endpoints |
| --- | --- | --- |
| `openai` | OpenAI | `openai-responses` and `openai-chat` at `https://api.openai.com/v1` |
| `kimi-code` | Kimi Code | `openai-chat` at `https://api.kimi.com/coding/v1`, `anthropic-messages` at `https://api.kimi.com/coding` |
| `moonshot` | Moonshot AI | `openai-chat` at `https://api.moonshot.ai/v1`, `anthropic-messages` at `https://api.moonshot.ai/anthropic` |
| `openrouter` | OpenRouter | `openai-chat` at `https://openrouter.ai/api/v1`, `anthropic-messages` at `https://openrouter.ai/api` |
| `deepseek` | DeepSeek | `openai-chat` at `https://api.deepseek.com/v1`, `anthropic-messages` at `https://api.deepseek.com/anthropic` |
| `zai` | Z.ai | `openai-chat` at `https://api.z.ai/api/paas/v4`, `anthropic-messages` at `https://api.z.ai/api/anthropic` |
| `ollama` | Ollama (local) | `openai-chat` at `http://localhost:11434/v1` |

### Custom providers and endpoint probing

Pick **Custom** for anything else (a gateway like Fuse, a self-hosted proxy, a vLLM server). yoink asks for a display name and a base URL, then probes the URL with your key to find out which protocols it speaks:

1. It lists models from the OpenAI-style `/v1/models` and the Anthropic-style `/v1/models` at the same time.
2. It sends a one-token `ping` to `/v1/messages` (Anthropic Messages), `/chat/completions` (OpenAI Chat, only when a model list came back), and `/responses` (OpenAI Responses), trying up to three chat models from the list.
3. Every protocol that answers is saved as an endpoint. yoink strips trailing paths like `/chat/completions` and normalizes `/v1`, so you can paste whichever URL the provider's docs show.

If every probe fails with 401 or 403, yoink says the key was rejected. If nothing answers, it asks you to check the base URL. The endpoints a provider supports decide which harnesses it can connect to: codex needs `openai-responses`, Claude Code needs `anthropic-messages`, and pi, omp, and opencode accept any of the three.

## Model selection and models.dev

Harnesses need more than a model id: pi, omp, and opencode want a context window, an output limit, whether the model reasons, and whether it takes images. yoink looks each selected model up on [models.dev](https://models.dev), preferring the entry from the same provider, and stores the result with the provider. The catalog is cached at `~/.config/yoink/cache/models-dev.json` and refreshed at most once a day. A model models.dev does not know gets safe defaults: a 128,000 token context window, 32,000 output tokens, text input, no reasoning.

Change the selection any time:

```bash
yoink models fuse                          # interactive picker, pre-checked with the current models
yoink models fuse --set gpt-5.2,claude-sonnet-4-5
```

Either way, every connected harness is re-synced with the new list.

## Where keys live

yoink stores the API key in `~/.config/yoink/profiles.json` (`chmod 600`) and writes it as a literal value into each connected harness config. Every harness file yoink writes is written atomically with owner-only permissions (`0600`), inside a `0700` directory when yoink has to create one. The first time yoink changes an existing harness config it saves the original next to it as `<file>.yoink.bak`.

Keys are never printed. When you add a provider non-interactively, pass the key on stdin with `--token-stdin` so it stays out of your shell history and the process list.

## Editing and re-sync

`yoink edit <name>` on a provider opens a field picker: **Harnesses**, **Models**, **Profile id**, **Display name**, **API key**, and **Endpoints** (re-probes a base URL). Saving any change re-writes the provider into every harness it is connected to, so a rotated key or a new model reaches pi, omp, opencode, and codex in one step. Renaming the profile id removes the old entry from each harness before writing the new one. A harness default model is kept as long as that model is still selected.

`yoink rename <a> <b>` re-syncs the same way, and `yoink remove <name>` disconnects the provider from every harness first and only deletes the profile when every harness update succeeds.

## Claude Code is exclusive

pi, omp, opencode, and codex can hold many providers side by side. Claude Code cannot: it talks to one backend at a time. Connecting a provider to Claude Code makes it the active yoink profile, exactly like `yoink use <name>`, and writes seven managed env keys into `~/.claude/settings.json`. The default model you pick fills every Claude Code tier:

- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

yoink never writes or strips any other key. Switching to a Claude account restores that login and strips the seven keys again, so your subscription takes back over. Disconnecting a provider from Claude Code does the same, and marks the Claude profile matching your live login as active.

If `~/.claude/settings.json` is tracked by git, the interactive flow warns before writing a key into it.

### This project only

When you connect a provider to Claude Code from the interactive harness picker, yoink asks **Apply to Claude Code where?**

- **Globally** switches Claude Code to the provider, as above.
- **This project only** writes the same seven keys into `./.claude/settings.local.json`, the highest-precedence settings file, and leaves your global setup alone. Before writing, yoink checks that `.gitignore` excludes `.claude/settings.local.json` and offers to add it, so the key is never committed.

The project scope is not tracked as a connection, so edits to the provider do not rewrite `settings.local.json`. Connect it again to refresh it.

## Non-interactive add

Scripts and the desktop app can add a provider without prompts. Pass the key on stdin:

```bash
echo "$OPENAI_API_KEY" | yoink add --external --name openai --preset openai \
  --models gpt-5.2,gpt-5.2-codex --connect pi,codex --default gpt-5.2-codex --token-stdin

echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \
  --base-url https://api.fuse.example/v1 --models claude-sonnet-4-5,gpt-5.2 \
  --connect pi,opencode,omp --default claude-sonnet-4-5 --token-stdin
```

| Flag | Meaning |
| --- | --- |
| `--name <id>` | Profile id, also used as the provider id in harness configs. Required. |
| `--preset <id>` | Use a preset's endpoints. One of `openai`, `kimi-code`, `moonshot`, `openrouter`, `deepseek`, `zai`, `ollama`. |
| `--base-url <url>` | Custom provider URL. Required unless `--preset` is given. |
| `--protocol <p,...>` | Skip probing and use these protocols at `--base-url`: `openai-chat`, `openai-responses`, `anthropic-messages`. |
| `--provider <label>` | Display name. Defaults to the preset label or the profile id. |
| `--models <m,...>` | Models to expose. Required. Metadata comes from models.dev. |
| `--connect <h,...>` | Harnesses to connect right away: `pi`, `omp`, `opencode`, `codex`, `claude-code`. |
| `--default <m>` | Default model to set in the connected harnesses. |
| `--token-stdin` | Read the API key from stdin. Required. |

Without `--protocol`, a custom `--base-url` is probed exactly like the interactive flow. A preset is never probed.

### Legacy Claude Code form

The original single-model form still works and is what the macOS desktop app uses. It saves the base URL as one Anthropic Messages endpoint with one model, ready for Claude Code. Connect it to other harnesses later with `yoink connect`:

```bash
echo "$KEY" | yoink add --external --name glm --provider OpenRouter \
  --base-url https://openrouter.ai/api --model z-ai/glm-4.7 --token-stdin

yoink edit glm --model z-ai/glm-4.6
echo "$NEW_KEY" | yoink edit glm --token-stdin
```

`yoink edit <name>` accepts `--name`, `--provider`, `--base-url`, `--model`, and `--token-stdin`. Editing the active provider re-applies the env block right away, and any harness connections are re-synced.

Restart a running harness after a change so it reloads its config.
