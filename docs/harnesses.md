# Harnesses

A harness is a coding agent that reads providers from its own config file. yoink writes your [providers](./providers.md) into each one, so a key you add once works in all of them.

## Supported harnesses

| Harness | Id | Config yoink writes | Format | Protocols (in order of preference) | Default model |
| --- | --- | --- | --- | --- | --- |
| pi | `pi` | `~/.pi/agent/models.json` and `settings.json` | JSON | `openai-chat`, `openai-responses`, `anthropic-messages` | `defaultProvider` and `defaultModel: "<provider>/<model>"` in `settings.json` |
| omp | `omp` | `~/.omp/agent/models.yml` and `config.yml` | YAML | `openai-chat`, `openai-responses`, `anthropic-messages` | `modelRoles.default: <provider>/<model>` in `config.yml` |
| opencode | `opencode` | `~/.config/opencode/opencode.json` | JSON or JSONC | `openai-chat`, `anthropic-messages`, `openai-responses` | `"model": "<provider>/<model>"` |
| codex | `codex` | `~/.codex/config.toml` | TOML | `openai-responses` only | `model = "<model>"` and `model_provider = "<provider>"` |
| Claude Code | `claude-code` | `~/.claude/settings.json` | JSON (`env` block) | `anthropic-messages` only | `ANTHROPIC_MODEL` and every model tier |

yoink picks the first protocol in the harness's order that the provider supports. A harness the provider has no compatible endpoint for is shown but cannot be selected.

### Paths and overrides

- **pi** follows `PI_CODING_AGENT_DIR` when set.
- **omp** writes `models.yml`, or `models.yaml` when that file already exists. A legacy `models.json` is carried over into the YAML file the first time yoink writes it.
- **opencode** follows `XDG_CONFIG_HOME`, and edits `opencode.jsonc` instead when that is the file you have. Edits are made in place, so your comments and formatting survive.
- **codex** follows `CODEX_HOME`. yoink writes a `[model_providers.<id>]` table with `name`, `base_url`, `wire_api = "responses"`, and `experimental_bearer_token`.
- **Claude Code** follows `CLAUDE_CONFIG_DIR`.

A harness counts as installed when its binary is on your `PATH` or its config directory exists (opencode also checks `/Applications/OpenCode.app`).

### What a provider entry looks like

pi and omp share one schema: `name`, `baseUrl`, `api` (`openai-completions`, `openai-responses`, or `anthropic-messages`), `apiKey`, and a `models` list with `id`, `name`, `reasoning`, `input`, `contextWindow`, and `maxTokens`. opencode gets `npm` (`@ai-sdk/openai-compatible`, `@ai-sdk/openai`, or `@ai-sdk/anthropic`), `name`, `options.baseURL`, `options.apiKey`, and a `models` map with `name`, `tool_call`, `reasoning`, `limit`, and `modalities` for image-capable models. Model limits come from [models.dev](./providers.md#model-selection-and-modelsdev).

yoink only owns the keys it writes. Anything else you added to a provider or model entry by hand is kept when yoink re-syncs, and the rest of each file is left alone.

### codex is responses-only

codex talks to custom providers over the OpenAI Responses API, so yoink only connects providers that have an `openai-responses` endpoint. The `openai` preset has one. Most other presets and gateways expose only Chat Completions or Anthropic Messages, and codex shows **needs an OpenAI Responses endpoint** for them in the harness picker. A custom provider gets a Responses endpoint when its `/responses` route answers the probe.

### Claude Code is exclusive

Claude Code holds one backend at a time, so connecting a provider to it switches your active yoink profile to that provider. See [Claude Code is exclusive](./providers.md#claude-code-is-exclusive) for the managed env keys and the per-project option.

## Backups

The first time yoink changes an existing pi, omp, opencode, or codex config file, it copies the original to `<file>.yoink.bak` (for example `~/.codex/config.toml.yoink.bak`). The backup is made once and never overwritten, so it always holds the config from before yoink touched it. Every write after that is atomic and owner-only (`0600`).

## Commands

### `yoink connect <name>`

Write a provider into one or more harnesses. Without `--to`, it opens the harness picker, where already-connected harnesses are pre-checked and unchecking one disconnects it.

```bash
yoink connect fuse
yoink connect fuse --to pi,opencode,omp --default claude-sonnet-4-5
yoink connect openai --to codex --default gpt-5.2-codex
```

`--default` sets the harness default model (see the table above). Leave it out to keep each harness's current default. Claude Code always needs a model, so without `--default` it keeps the last model used there, or takes the provider's first selected model. Non-interactive use requires `--to`.

### `yoink disconnect <name>`

Remove a provider from harnesses. Its entry is deleted, and any default model that pointed at it is cleared.

```bash
yoink disconnect fuse --from codex
yoink disconnect fuse
```

Without `--from`, yoink disconnects it from every harness whose config currently contains it. If a config cannot be parsed, yoink stops and tells you which `--from` value to pass to disconnect anyway.

### `yoink models <name>`

Choose which models a provider exposes, then re-sync every connected harness.

```bash
yoink models fuse
yoink models fuse --set claude-sonnet-4-5,gpt-5.2
```

### `yoink harnesses`

Show each harness, whether it is installed, which yoink providers it holds, and its config path.

```bash
yoink harnesses
yoink harnesses --json
```

`--json` prints an array of `{ id, label, installed, configPath, protocols, providers, error }`, where `error` is set when a config file could not be read.

### `yoink import`

Find providers you already set up by hand in your harnesses and let yoink manage them.

```bash
yoink import
yoink import --yes
```

yoink reads every installed harness and collects providers that carry a literal API key. Entries that point at an environment variable or a command (`$VAR`, `${VAR}`, `{env:VAR}`, `{file:...}`, `!command`, or a bare `UPPER_CASE` name in omp) are skipped, because yoink cannot sync a key it does not have. The same key and URL found in several harnesses become one provider, with their endpoints and models merged. Providers yoink already manages are left out.

The interactive flow lets you choose which ones to import; `--yes` imports all of them. Each imported provider is recorded as connected to the harnesses it came from and re-synced, so those entries now follow yoink. Claude Code is the exception: an imported Claude Code provider is saved but not marked active. The interactive menu offers an import once, the first time you open it.

## After a change

Restart any harness that is already running so it reloads its config.
