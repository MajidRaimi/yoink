<div align="center">

<img src="https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/banner.png" alt="yoink" width="820" />

<h1>Yoink</h1>

<p><strong>Switch Claude Code accounts and manage API-key providers across every coding harness, fast.</strong></p>

<p>
Snapshot each Claude login into a named profile and swap them in a single keystroke from the menu bar app or the
CLI. Add an API key once (OpenAI, Kimi, OpenRouter, Ollama, or any compatible API) and yoink writes it into
pi, omp, opencode, codex, and Claude Code, and keeps them in sync. No browser, no re-login, no hand-edited configs.
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
<a href="https://yoink.codes/download/"><strong>Download</strong></a> &nbsp;·&nbsp;
<a href="https://yoink.codes/docs/getting-started/"><strong>Docs</strong></a> &nbsp;·&nbsp;
<a href="https://www.npmjs.com/package/yoink-cli"><strong>npm</strong></a>
</p>

<br />

<img src="https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/demo.svg" alt="Yoink switching between Claude Code accounts" width="720" />

</div>

---

## Install

### macOS menu bar app

Download the notarized **Yoink** app for Apple Silicon or Intel from the [download page](https://yoink.codes/download/), then drag it to Applications. It lives in the menu bar, so switching accounts is one click with no terminal.

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

Register your accounts once, then hop between them instantly:

```bash
yoink add        # sign in as account A, name it "work"
                 # "Add another?" > yes > sign in as account B, name it "personal"

yoink personal   # switch to personal
yoink work       # switch back
```

Restart Claude Code after a switch so it picks up the new login.

## The interactive menu

Run `yoink` with no arguments for a keyboard-driven list of your accounts:

```
 yoink  switch Claude accounts

 ● work        work@company.com
 ○ personal    me@personal.dev
 ○ openrouter  z-ai/glm-4.7

 ↑↓ move  ↵ switch  n new  e edit  s save  d delete  q quit
```

| Key | Action |
| --- | --- |
| `↑` `↓` / `j` `k` | Move between accounts |
| `↵` | Switch to the highlighted account |
| `n` | Add a new account (Claude sign-in or API-key provider) |
| `e` | Edit the highlighted profile |
| `s` | Save your current login as a profile |
| `d` | Delete the highlighted profile (after a confirm) |
| `q` / `Esc` / `Ctrl-C` | Quit |

Actions loop back to the list, so you can switch, add, and prune in one sitting, then leave with `q`.

## Features

- **Instant switching.** Each profile stores the credential blob (macOS Keychain on macOS, `~/.claude/.credentials.json` on Linux/Windows) plus the `oauthAccount` identity, so a swap is a keystroke, not a browser round-trip.
- **Never loses a token.** Every switch re-snapshots the active profile from the live credential store first, so a background token refresh is never dropped.
- **One key, every harness.** Add a provider once and connect it to pi, omp, opencode, codex, and Claude Code. Rotate the key or change the model list and yoink re-syncs every harness it is connected to.
- **Subscription logins beyond Claude.** Save and switch ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins too. Each tool switches inside itself only, so a subscription token never leaks into another tool. See [subscriptions](./docs/subscriptions.md).
- **Presets and custom providers.** OpenAI, Kimi Code, Moonshot, OpenRouter, DeepSeek, Z.ai, and Ollama are built in. For anything else, yoink probes the base URL to find which of OpenAI Chat, OpenAI Responses, and Anthropic Messages it speaks.
- **Real model metadata.** Pick as many models as you like from the provider's live list; context windows, output limits, reasoning, and image support come from [models.dev](https://models.dev).
- **Import what you already have.** `yoink import` finds providers you set up by hand in your harness configs and brings them under management.
- **Per-project overrides.** Apply a provider to Claude Code globally, or scope it to one repo via `./.claude/settings.local.json`, which yoink offers to add to your `.gitignore` before writing.
- **Nothing leaks.** Harness configs are written atomically with owner-only permissions and backed up once to `<file>.yoink.bak`. In Claude Code, yoink only ever touches seven managed `ANTHROPIC_*` / `CLAUDE_CODE_SUBAGENT_MODEL` keys and warns before writing a key into a git-tracked file.
- **One binary.** `bun build --compile` bakes the CLI, its deps, and the runtime into a single file. No Node, no runtime to install.

## Commands

| Command | Aliases | What it does |
| --- | --- | --- |
| `yoink` | | Open the interactive account menu |
| `yoink <name>` | | Switch straight to a saved profile |
| `yoink add` | `login` | Add a Claude account, a Codex, Kimi, Gemini, or Copilot login, or an API-key provider |
| `yoink edit <name>` | | Edit a profile (name, or a provider's harnesses / models / key / endpoints) |
| `yoink save <name>` | | Snapshot the current login as a profile (`--tool codex\|kimi\|gemini\|copilot` for other tools) |
| `yoink use <name>` | `switch` | Switch to a saved profile in the tool it belongs to (`--force` if the tool is running) |
| `yoink connect <name>` | | Connect a provider to harnesses (pi, omp, opencode, codex, claude-code) |
| `yoink disconnect <name>` | | Remove a provider from harnesses |
| `yoink models <name>` | | Choose which models a provider exposes, then re-sync |
| `yoink harnesses` | | Show detected harnesses and their providers |
| `yoink import` | | Import providers already configured in your harnesses |
| `yoink list` | `ls` | List all saved profiles, grouped by tool (`--json` for scripts) |
| `yoink current` | `who` | Show the active profile (`--tool <tool>` for one tool) |
| `yoink rename <a> <b>` | | Rename a profile |
| `yoink remove <name>` | `rm` | Delete a profile |
| `yoink version` | `-v` | Print the version |
| `yoink help` | `-h` | Print help |

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

codex only connects to providers with an OpenAI Responses endpoint, and Claude Code holds one backend at a time, so connecting a provider there switches the active profile. See [providers](./docs/providers.md) and [harnesses](./docs/harnesses.md) for the full flow.

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
