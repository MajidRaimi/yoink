<div align="center">

<img src="https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/banner.png" alt="yoink" width="820" />

<h1>Yoink</h1>

<p><strong>Every AI coding login and provider, in one place.</strong></p>

<p>Yoink for AI coding is an open source (MIT) CLI for macOS, Linux and Windows, plus a macOS menu bar app, that switches AI coding logins and connects API-key providers to 13 coding harnesses.</p>

<p><sub>Not the Yoink drag-and-drop app for Mac, and not the PyPI <code>yoink-cli</code> media downloader.</sub></p>

<p>
Switch Claude Code, ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins without signing out. Add an API key once
(OpenAI, Kimi, OpenRouter, Ollama, or any compatible API) and yoink connects it to the coding harnesses that speak
its API, up to 13: pi, omp, opencode, codex, Claude Code, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue and
Claude Desktop. Drive it from the terminal on macOS, Linux and Windows, or from the macOS menu bar.
</p>

<p>
<a href="https://www.npmjs.com/package/yoink-cli"><img src="https://img.shields.io/npm/v/yoink-cli?color=facc15&labelColor=0a0908&logo=npm&logoColor=white" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/yoink-cli"><img src="https://img.shields.io/npm/dm/yoink-cli?color=facc15&labelColor=0a0908" alt="npm downloads" /></a>
<a href="https://github.com/MajidRaimi/yoink/stargazers"><img src="https://img.shields.io/github/stars/MajidRaimi/yoink?color=facc15&labelColor=0a0908&logo=github&logoColor=white" alt="GitHub stars" /></a>
<a href="https://github.com/MajidRaimi/yoink/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/MajidRaimi/yoink/ci.yml?branch=main&labelColor=0a0908&label=ci" alt="CI status" /></a>
<img src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-facc15?labelColor=0a0908" alt="macOS | Linux | Windows" />
<a href="./LICENSE"><img src="https://img.shields.io/npm/l/yoink-cli?color=facc15&labelColor=0a0908" alt="MIT license" /></a>
</p>

<p>
<a href="https://yoink.codes"><strong>Website</strong></a> &nbsp;·&nbsp;
<a href="https://yoink.codes/download/"><strong>Download for Mac</strong></a> &nbsp;·&nbsp;
<a href="https://yoink.codes/docs/getting-started/"><strong>Read the docs</strong></a> &nbsp;·&nbsp;
<a href="https://www.npmjs.com/package/yoink-cli"><strong>npm</strong></a>
</p>

</div>

---

## Install

### macOS menu bar app

Download the notarized **Yoink** app for Apple Silicon or Intel from the [download page](https://yoink.codes/download/), then drag it to Applications. It lives in the menu bar and handles Claude Code accounts and API-key providers: switch accounts, save the current login, add a provider and tick the harnesses it connects to. Subscription logins for Codex, Kimi, Gemini and Copilot switch from the CLI.

### CLI

macOS / Linux:

```bash
curl -fsSL https://yoink.codes/install.sh | bash
```

Windows (PowerShell):

```powershell
powershell -c "irm https://yoink.codes/install.ps1 | iex"
```

Or on any OS with Node:

```bash
npm install -g yoink-cli
```

Each drops a single self-contained binary onto your PATH. Confirm it answers:

```bash
yoink version
```

## Quick start

Register your Claude accounts once, then switch between them by name:

```bash
yoink add        # sign in as account A, name it "work"
                 # "Add another?" > yes > sign in as account B, name it "personal"

yoink personal   # switch to personal
yoink work       # switch back
```

Restart Claude Code after a switch so it picks up the new login.

Save the logins of your other coding tools the same way. Each one switches inside its own tool only:

```bash
yoink save codex-work --tool codex   # snapshot the ChatGPT login Codex holds right now
yoink add                            # pick ChatGPT (Codex), Kimi Code, Gemini or GitHub Copilot to add another
yoink use codex-work                 # switch Codex, leave Claude Code and the rest alone
yoink current                        # the active profile in every tool
```

Connect an API-key provider to your harnesses:

```bash
yoink add        # pick "Provider (API key)", a preset or Custom, paste the key, pick models, tick harnesses
yoink harnesses  # see which harness has which provider
```

## The interactive menu

Run `yoink` with no arguments for a keyboard-driven list of your profiles, grouped by tool once you have more than one kind:

```
┌  yoink switch accounts
│
│  Claude Code
│  ● work (work@company.com)
│  ○ personal
│  Providers
│  ○ openrouter
│  ChatGPT (Codex)
│  ○ codex-work
│
└  ↑↓/jk move   ↵ switch   n new   e edit   s save   d delete   q quit
```

| Key | Action |
| --- | --- |
| `↑` `↓` / `j` `k` | Move between profiles |
| `↵` | Switch to the highlighted profile, within its own tool |
| `n` | Add a Claude account, a Codex, Kimi, Gemini or Copilot login, or an API-key provider |
| `e` | Edit the highlighted profile |
| `s` | Save your current login as a profile |
| `d` | Delete the highlighted profile (after a confirm) |
| `q` / `Esc` / `Ctrl-C` | Quit |

Actions loop back to the list, so you can switch, add, and prune in one sitting, then leave with `q`. See [interactive menu](./docs/interactive-menu.md).

## Features

- **Instant Claude Code switching.** Each profile stores the credential blob (macOS Keychain on macOS, `~/.claude/.credentials.json` on Linux/Windows) plus the `oauthAccount` identity, so a swap is a keystroke, not a browser round-trip.
- **Never loses a token.** Every switch re-snapshots the active profile from the live credential store first, so a background token refresh is never dropped.
- **Subscription logins beyond Claude.** Save and switch ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins too. Each tool switches inside itself only, so a subscription token never leaks into another tool, and yoink asks before switching a tool that is running. See [subscriptions](./docs/subscriptions.md).
- **One provider, up to 13 harnesses.** Add a provider once and connect it to every harness its endpoints support (pi, omp, opencode, codex, Claude Code, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue and Claude Desktop). Rotate the key or change the model list and yoink re-syncs every harness it is connected to.
- **Presets and custom providers.** OpenAI, Kimi Code, Moonshot, OpenRouter, DeepSeek, Z.ai and Ollama are built in. For anything else, yoink probes the base URL to find which of OpenAI Chat, OpenAI Responses and Anthropic Messages it speaks.
- **Real model metadata.** Pick as many models as you like from the provider's live list; context windows, output limits, reasoning and image support come from [models.dev](https://models.dev).
- **Import what you already have.** `yoink import` finds providers you set up by hand in your harness configs and brings them under management.
- **Per-project overrides.** Apply a provider to Claude Code globally, or scope it to one repo via `./.claude/settings.local.json`, which yoink offers to add to your `.gitignore` before writing.
- **Careful writes.** Harness configs are written atomically with owner-only permissions and backed up once to `<file>.yoink.bak` (except the per-provider Goose and Claude Desktop files, which yoink owns and deletes on disconnect). In Claude Code, yoink only ever touches seven managed `ANTHROPIC_*` / `CLAUDE_CODE_SUBAGENT_MODEL` keys and warns before writing a key into a git-tracked file.
- **Scriptable.** Every provider flow has a non-interactive form with the key read from stdin, and `list`, `current`, `harnesses`, `presets`, `status` and `probe` print JSON for scripts.
- **Terminal or menu bar.** The CLI runs on macOS, Linux and Windows; the macOS menu bar app covers Claude accounts and providers with no terminal.
- **One binary.** `bun build --compile` bakes the CLI, its deps and the runtime into a single file. No Node, no runtime to install.

## Commands

| Command | Aliases | What it does |
| --- | --- | --- |
| `yoink` | | Open the interactive account menu |
| `yoink <name>` | | Switch straight to a saved profile |
| `yoink add` | `login` | Add a Claude, ChatGPT (Codex), Kimi Code, Gemini or Copilot login, or an API-key provider |
| `yoink edit <name>` | | Edit a profile (name, or a provider's harnesses, models, key or endpoints) |
| `yoink save <name>` | | Snapshot the current login as a profile (`--tool codex\|kimi\|gemini\|copilot` for other tools) |
| `yoink use <name>` | `switch` | Switch to a saved profile inside its own tool (`--force` skips the running check) |
| `yoink connect <name>` | | Connect a provider to harnesses (`--to pi,opencode,codex,...`) |
| `yoink disconnect <name>` | | Remove a provider from harnesses (`--from <h,...>`) |
| `yoink models <name>` | | Choose which models a provider exposes, then re-sync |
| `yoink harnesses` | | Show detected harnesses and their providers (`--json`) |
| `yoink import` | | Import providers already configured in your harnesses (`--yes`) |
| `yoink status <name>` | | Show each harness for a provider: installed, compatible, connected (`--json`) |
| `yoink presets` | | List built-in provider presets (`--json`) |
| `yoink probe` | | Detect a provider's endpoints and models (`--base-url` or `--preset`, key on stdin) |
| `yoink list` | `ls`, `accounts` | List all saved profiles, grouped by tool (`--json` for scripts) |
| `yoink current` | `who` | Show the active profiles (`--tool <tool>`, `--json`) |
| `yoink rename <a> <b>` | | Rename a profile |
| `yoink remove <name>` | `rm` | Delete a profile |
| `yoink version` | `-v`, `--version` | Print the version |
| `yoink help` | `-h`, `--help` | Print help |

Full flags in [usage](./docs/usage.md) and the [CLI reference](https://yoink.codes/reference/).

## Providers across harnesses

Run `yoink add`, pick **Provider (API key)**, choose a preset or **Custom**, paste the key, pick models, and tick the harnesses to connect. Or do it in one line from a script, with the key on stdin:

```bash
echo "$FUSE_API_KEY" | yoink add --external --name fuse --provider Fuse \
  --base-url https://api.fuse.example/v1 --models claude-sonnet-4-5,gpt-5.2 \
  --connect pi,opencode,omp --default claude-sonnet-4-5 --token-stdin

yoink harnesses
```

```
● Claude Code  no providers  /Users/you/.claude/settings.json
● pi           fuse  /Users/you/.pi/agent/models.json
● omp          fuse  /Users/you/.omp/agent/models.yml
● opencode     fuse  /Users/you/.config/opencode/opencode.json
○ codex        not installed  /Users/you/.codex/config.toml
```

yoink probed the URL, found which protocols Fuse speaks, looked the two models up on models.dev, and wrote a provider entry into each harness with `claude-sonnet-4-5` as the default. Later changes follow everywhere:

```bash
yoink models fuse --set claude-sonnet-4-5,gpt-5.2,kimi-k2   # re-syncs pi, omp, opencode
yoink connect fuse --to claude-code                         # makes Fuse Claude Code's backend
yoink disconnect fuse --from opencode
```

codex only connects to providers with an OpenAI Responses endpoint, and Claude Code holds one backend at a time, so connecting a provider there switches the active profile. Goose, Zed, and Claude Desktop are experimental: yoink writes their config, then prints a short notice when one more step is needed, such as exporting the key or selecting the config inside the app. See [providers](./docs/providers.md) and [harnesses](./docs/harnesses.md) for the full flow.

### Supported harnesses

| Harness | Id | Config | Protocols |
| --- | --- | --- | --- |
| pi | `pi` | `~/.pi/agent/models.json` | Chat, Responses, Messages |
| omp | `omp` | `~/.omp/agent/models.yml` | Chat, Responses, Messages |
| opencode | `opencode` | `~/.config/opencode/opencode.json` | Chat, Messages, Responses |
| codex | `codex` | `~/.codex/config.toml` | Responses only |
| Claude Code | `claude-code` | `~/.claude/settings.json` | Messages only |
| Qwen Code | `qwen` | `~/.qwen/settings.json` | Chat, Responses, Messages |
| Kilo Code | `kilo` | `~/.config/kilo/kilo.json` | Chat, Messages, Responses |
| Droid | `droid` | `~/.factory/settings.json` | Messages, Responses, Chat |
| Crush | `crush` | `~/.config/crush/crush.json` | Chat, Messages |
| Goose (experimental) | `goose` | `~/.config/goose/custom_providers/` | Chat, Messages |
| Zed (experimental) | `zed` | `~/.config/zed/settings.json` | Chat, Responses, Messages |
| Continue | `continue` | `~/.continue/config.yaml` | Chat, Messages |
| Claude Desktop (experimental) | `claude-desktop` | `Claude-3p/configLibrary/` | Messages only |

Chat is OpenAI Chat Completions, Responses is the OpenAI Responses API, and Messages is Anthropic Messages, each listed in the harness's order of preference.

## How it works

Claude Code keeps your login in the macOS Keychain under the service `Claude Code-credentials` on macOS, and in `~/.claude/.credentials.json` on Linux and Windows. A profile pairs that credential blob with the `oauthAccount` identity from `~/.claude.json`. A switch:

1. Re-snapshots the currently active profile from the live credential store.
2. Writes the target profile's credential blob back (Keychain entry on macOS, `.credentials.json` elsewhere).
3. Restores the target profile's account identity into `~/.claude.json`.

Profiles live in `~/.config/yoink/profiles.json` on every OS (`chmod 600` on POSIX). Full details in [how it works](./docs/how-it-works.md).

## Supported platforms

macOS (Apple Silicon and Intel), Linux (x64 and arm64, both glibc and musl/Alpine), and Windows (x64 and arm64). On macOS, credentials are swapped through the login Keychain via the `security` CLI; on Linux and Windows, through `~/.claude/.credentials.json`, written atomically with the same protections Claude Code itself applies. The installers and npm package ship prebuilt binaries for every platform, so nothing else is needed. On bare Alpine, run `apk add libstdc++ libgcc` once (the same runtime libraries Node needs there).

## Documentation

Full guides live at [yoink.codes](https://yoink.codes) and in [`docs/`](./docs):

- [Getting started](./docs/getting-started.md)
- [Usage](./docs/usage.md)
- [Interactive menu](./docs/interactive-menu.md)
- [Providers](./docs/providers.md)
- [Harnesses](./docs/harnesses.md)
- [Subscriptions](./docs/subscriptions.md)
- [How it works](./docs/how-it-works.md)
- [Development](./docs/development.md) · [Contributing](./docs/contributing.md)

## Development

```bash
bun install
bun run dev        # web dev server + CLI test watcher (mprocs)
bun run build      # build every app (turbo)
bun run test       # run every app's tests
```

Build the CLI from source and link it:

```bash
cd apps/cli && bun run build
ln -sf "$PWD/dist/yoink" ~/.local/bin/yoink
```

See [docs/development.md](./docs/development.md) for the monorepo layout, release flow, and architecture.

## Star history

<a href="https://star-history.com/#MajidRaimi/yoink&Date">
  <img src="https://api.star-history.com/svg?repos=MajidRaimi/yoink&type=Date" alt="Star History Chart" width="600" />
</a>

## License

[MIT](./LICENSE) © Majid Raimi
