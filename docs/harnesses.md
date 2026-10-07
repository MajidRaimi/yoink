# Harnesses

A harness is a coding agent (or an editor or desktop app with an agent) that reads providers from its own config file. yoink writes your [providers](./providers.md) into each one, so a key you add once works in all of them.

## Supported harnesses

| Harness | Id | Config yoink writes | Format | Protocols (in order of preference) | Default model |
| --- | --- | --- | --- | --- | --- |
| pi | `pi` | `~/.pi/agent/models.json` and `settings.json` | JSON | `openai-chat`, `openai-responses`, `anthropic-messages` | `defaultProvider` and `defaultModel: "<provider>/<model>"` in `settings.json` |
| omp | `omp` | `~/.omp/agent/models.yml` and `config.yml` | YAML | `openai-chat`, `openai-responses`, `anthropic-messages` | `modelRoles.default: <provider>/<model>` in `config.yml` |
| opencode | `opencode` | `~/.config/opencode/opencode.json` | JSON or JSONC | `openai-chat`, `anthropic-messages`, `openai-responses` | `"model": "<provider>/<model>"` |
| codex | `codex` | `~/.codex/config.toml` | TOML | `openai-responses` only | `model = "<model>"` and `model_provider = "<provider>"` |
| Claude Code | `claude-code` | `~/.claude/settings.json` | JSON (`env` block) | `anthropic-messages` only | `ANTHROPIC_MODEL` and every model tier |
| Qwen Code | `qwen` | `~/.qwen/settings.json` | JSON | `openai-chat`, `openai-responses`, `anthropic-messages` | `model.name` and `security.auth.selectedType` |
| Kilo Code | `kilo` | `~/.config/kilo/kilo.json` | JSON or JSONC | `openai-chat`, `anthropic-messages`, `openai-responses` | `"model": "<provider>/<model>"` |
| Droid | `droid` | `~/.factory/settings.json` | JSON | `anthropic-messages`, `openai-responses`, `openai-chat` | not set |
| Crush | `crush` | `~/.config/crush/crush.json` | JSON | `openai-chat`, `anthropic-messages` | `models.large: { provider, model }` |
| Goose (experimental) | `goose` | `~/.config/goose/custom_providers/custom_<provider>.json` and `config.yaml` | JSON and YAML | `openai-chat`, `anthropic-messages` | `GOOSE_PROVIDER: custom_<provider>` and `GOOSE_MODEL` in `config.yaml` |
| Zed (experimental) | `zed` | `~/.config/zed/settings.json` | JSONC | `openai-chat`, `openai-responses`, `anthropic-messages` | `agent.default_model: { provider, model }` |
| Continue | `continue` | `~/.continue/config.yaml` | YAML | `openai-chat`, `anthropic-messages` | the chosen model moves to the top of `models` |
| Claude Desktop (experimental) | `claude-desktop` | `Claude-3p/configLibrary/yoink-<provider>.json` | JSON | `anthropic-messages` only | first entry of `inferenceModels` |

yoink picks the first protocol in the harness's order that the provider supports. A harness the provider has no compatible endpoint for is shown but cannot be selected.

Harnesses marked **experimental** work, but their config format is young or yoink cannot write the key where the harness reads it, so check the notice yoink prints after connecting. They carry a small `experimental` tag in the CLI, the menu, and the desktop app.

### Paths and overrides

- **pi** follows `PI_CODING_AGENT_DIR` when set.
- **omp** writes `models.yml`, or `models.yaml` when that file already exists. A legacy `models.json` is carried over into the YAML file the first time yoink writes it.
- **opencode** follows `XDG_CONFIG_HOME`, and edits `opencode.jsonc` instead when that is the file you have. Edits are made in place, so your comments and formatting survive.
- **codex** follows `CODEX_HOME`. yoink writes a `[model_providers.<id>]` table with `name`, `base_url`, `wire_api = "responses"`, and `experimental_bearer_token`.
- **Claude Code** follows `CLAUDE_CONFIG_DIR`.
- **Qwen Code** follows `QWEN_HOME`.
- **Kilo Code** follows `XDG_CONFIG_HOME`, and edits `kilo.jsonc` instead when that is the file you have, in place, like opencode.
- **Crush** follows `CRUSH_GLOBAL_CONFIG`, then `XDG_CONFIG_HOME/crush`. yoink never touches Crush's data directory (`~/.local/share/crush`).
- **Goose** follows `GOOSE_PATH_ROOT`. On Windows the config lives in `%APPDATA%\Block\goose\config`.
- **Zed** follows `XDG_CONFIG_HOME`. On Windows the config lives in `%APPDATA%\Zed`.
- **Claude Desktop** keeps its library under `~/Library/Application Support/Claude-3p` on macOS, `%LOCALAPPDATA%\Claude-3p` on Windows, and `~/.config/Claude-3p` on Linux.

A harness counts as installed when its binary is on your `PATH` or its config directory exists. A few have extra checks:

- **opencode** also checks the desktop app: `/Applications/OpenCode.app`, `/opt/OpenCode`, `/usr/share/applications/ai.opencode.desktop.desktop`, and `%LOCALAPPDATA%\Programs\OpenCode\OpenCode.exe`.
- **Kilo Code** looks for the `kilo` binary.
- **Zed** looks for the `zed` or `zeditor` binary, `/Applications/Zed.app`, or `/Applications/Zed Preview.app`.
- **Continue** looks for `~/.continue`, the `cn` binary, or a `~/.vscode/extensions/continue.continue-*` extension.
- **Claude Desktop** looks for `/Applications/Claude.app` or the `Claude-3p` directory.

### What a provider entry looks like

pi and omp share one schema: `name`, `baseUrl`, `api` (`openai-completions`, `openai-responses`, or `anthropic-messages`), `apiKey`, and a `models` list with `id`, `name`, `reasoning`, `input`, `contextWindow`, and `maxTokens`. opencode gets `npm` (`@ai-sdk/openai-compatible`, `@ai-sdk/openai`, or `@ai-sdk/anthropic`), `name`, `options.baseURL`, `options.apiKey`, and a `models` map with `name`, `tool_call`, `reasoning`, `limit`, and `modalities` for image-capable models. Model limits come from [models.dev](./providers.md#model-selection-and-modelsdev).

yoink only owns the keys it writes. Anything else you added to a provider or model entry by hand is kept when yoink re-syncs, and the rest of each file is left alone.

### The newer harnesses

Each of these writes only the entries it owns, so disconnecting removes yoink's entry for that provider (found by key, tag, or file name) and clears a default only when it points at that provider.

**Qwen Code** (`qwen`). yoink adds one entry per model to `modelProviders.<protocol>` in `settings.json`, using `chat-completions` or `responses` as the `wireApi` for OpenAI providers. The key is written once into the `env` block as `YOINK_<PROVIDER>_API_KEY`, and every model entry points at it through `envKey`. That `YOINK_<PROVIDER>_` prefix is how yoink tells its entries apart from yours. The default is `model.name` plus the matching `security.auth.selectedType`.

**Kilo Code** (`kilo`). Kilo is an opencode fork and gets exactly the same provider entry as opencode: `npm`, `name`, `options.baseURL`, a literal `options.apiKey`, and a `models` map. The default is `"model": "<provider>/<model>"`.

**Droid** (`droid`). yoink appends to `customModels` in `~/.factory/settings.json`, one entry per model, with `provider` set to `anthropic`, `openai`, or `generic-chat-completion-api`, a literal `apiKey`, `maxOutputTokens`, and `noImageSupport` for text-only models. Entries yoink owns end their `displayName` with ` [<provider>]`. yoink never sets a Droid default; pick the model inside Droid.

**Crush** (`crush`). yoink writes `providers.<provider>` in `crush.json` with `type` `openai-compat` or `anthropic`, a literal `api_key`, and a `models` list whose cost fields are written as `0`. The default is `models.large: { provider, model }`.

- Notice: when a `crushrc` file sits beside `crush.json`, yoink warns that it may override what was just written.

**Goose** (`goose`, experimental). yoink writes `custom_providers/custom_<provider>.json` with engine `openai` or `anthropic` and `api_key_env: "CUSTOM_<PROVIDER>_API_KEY"`, so the key is never in that file. The default is `GOOSE_PROVIDER: custom_<provider>` and `GOOSE_MODEL` in `config.yaml`. Where the key goes depends on how Goose stores secrets:

- When `GOOSE_DISABLE_KEYRING` is truthy in your environment or in `config.yaml`, yoink merges the key into `secrets.yaml` (`0600`) and there is nothing else to do.
- Otherwise Goose keeps secrets in the OS keyring, which yoink does not touch. Notice: export `CUSTOM_<PROVIDER>_API_KEY` in your shell, or enter the key once in Goose.

**Zed** (`zed`, experimental). yoink adds the provider to `language_models` in `settings.json`, editing in place so your comments survive: `openai_compatible` for Chat Completions, `openai_compatible` with `capabilities.chat_completions: false` for Responses, and `anthropic_compatible` (base URL without `/v1`) for Anthropic Messages. The default is `agent.default_model: { provider, model }`. Zed never reads a key from `settings.json`, so yoink does not write one.

- Notice: set `<PROVIDER>_API_KEY` (the provider id in upper snake case, for example `FUSE_API_KEY`) in your environment, or paste the key in Zed's agent settings.

**Continue** (`continue`). yoink adds one entry per model to `models` in `~/.continue/config.yaml`, with `provider: openai` or `provider: anthropic`, `apiBase`, and a literal `apiKey`. Entries yoink owns are named `<model> (<provider>)`. If the file is missing, yoink creates it with `name`, `version: 1.0.0`, and `schema: v1`. Continue has no default setting, so `--default` moves that model's entry to the top of `models`, which is the one Continue picks first. Comments in the YAML survive.

**Claude Desktop** (`claude-desktop`, experimental). yoink writes one file per provider, `Claude-3p/configLibrary/yoink-<provider>.json`, with the gateway URL, a literal `inferenceGatewayApiKey`, and `inferenceModels` (the default model goes first). It only speaks Anthropic Messages. Unlike Claude Code, it is not exclusive: several providers can sit in the library side by side. yoink never writes the library's `_meta.json` and never touches managed-preference files, so Claude Desktop will not switch to the new config on its own.

- Notice: open Claude Desktop, go to Developer, then Configure third-party inference, select the `yoink-<provider>` config, and relaunch.

### codex is responses-only

codex talks to custom providers over the OpenAI Responses API, so yoink only connects providers that have an `openai-responses` endpoint. The `openai` preset has one. Most other presets and gateways expose only Chat Completions or Anthropic Messages, and codex shows **needs an OpenAI Responses endpoint** for them in the harness picker. A custom provider gets a Responses endpoint when its `/responses` route answers the probe.

### Claude Code is exclusive

Claude Code holds one backend at a time, so connecting a provider to it switches your active yoink profile to that provider. See [Claude Code is exclusive](./providers.md#claude-code-is-exclusive) for the managed env keys and the per-project option.

## Backups

The first time yoink changes an existing config file in any harness other than Claude Code, it copies the original to `<file>.yoink.bak` (for example `~/.codex/config.toml.yoink.bak`). The backup is made once and never overwritten, so it always holds the config from before yoink touched it. Every write after that is atomic and owner-only (`0600`).

Two kinds of file are owned by yoink instead and get no backup: Goose's `custom_providers/custom_<provider>.json` and Claude Desktop's `Claude-3p/configLibrary/yoink-<provider>.json`. yoink overwrites them on connect and deletes them on disconnect, so do not keep a hand-made file at either path.

## Commands

### `yoink connect <name>`

Write a provider into one or more harnesses. Without `--to`, it opens the harness picker, where already-connected harnesses are pre-checked and unchecking one disconnects it.

```bash
yoink connect fuse
yoink connect fuse --to pi,opencode,omp --default claude-sonnet-4-5
yoink connect openai --to codex --default gpt-5.2-codex
yoink connect fuse --to qwen,kilo,crush,continue
```

Harness ids are `pi`, `omp`, `opencode`, `codex`, `claude-code`, `qwen`, `kilo`, `droid`, `crush`, `goose`, `zed`, `continue`, and `claude-desktop`. After a successful connect, yoink prints the harness's notice, if it has one, under the result.

`--default` sets the harness default model (see the table above). Leave it out to keep each harness's current default. Droid has no default to set, and Continue moves the chosen model to the top of its list instead. Claude Code always needs a model, so without `--default` it keeps the last model used there, or takes the provider's first selected model. Non-interactive use requires `--to`.

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

`--json` prints an array of `{ id, label, installed, configPath, protocols, experimental, notices, providers, error }`, where `experimental` marks the experimental harnesses, `notices` holds one post-connect notice for each connected provider that needs one (empty when none do), and `error` is set when a config file could not be read. `yoink status <name> --json` includes `experimental` and a single `notice` for that provider.

### `yoink import`

Find providers you already set up by hand in your harnesses and let yoink manage them.

```bash
yoink import
yoink import --yes
```

yoink reads every installed harness and collects providers that carry a literal API key. Entries that point at an environment variable or a command (`$VAR`, `${VAR}`, `{env:VAR}`, `{file:...}`, `!command`, or a bare `UPPER_CASE` name in omp) are skipped, because yoink cannot sync a key it does not have. For the same reason Zed, and Goose when its key lives in the keyring, have nothing to import. The same key and URL found in several harnesses become one provider, with their endpoints and models merged. Providers yoink already manages are left out.

The interactive flow lets you choose which ones to import; `--yes` imports all of them. Each imported provider is recorded as connected to the harnesses it came from and re-synced, so those entries now follow yoink. Claude Code is the exception: an imported Claude Code provider is saved but not marked active. The interactive menu offers an import once, the first time you open it.

## After a change

Restart any harness that is already running so it reloads its config.
