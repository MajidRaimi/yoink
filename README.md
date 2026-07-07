<div align="center">

<img src="https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/banner.png" alt="yoink" width="820" />

<h1>Yoink</h1>

<p><strong>Switch between Claude Code accounts from your macOS menu bar or terminal, fast.</strong></p>

<p>
Snapshot each login into a named profile, swap them in a single keystroke from the menu bar app or the
CLI, and run OpenRouter, Ollama, or any Anthropic-compatible model through the same Claude Code harness.
No browser, no re-login.
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
| `n` | Add a new account (Claude sign-in or external provider) |
| `e` | Edit the highlighted profile |
| `s` | Save your current login as a profile |
| `d` | Delete the highlighted profile (after a confirm) |
| `q` / `Esc` / `Ctrl-C` | Quit |

Actions loop back to the list, so you can switch, add, and prune in one sitting, then leave with `q`.

## Features

- **Instant switching.** Each profile stores the credential blob (macOS Keychain on macOS, `~/.claude/.credentials.json` on Linux/Windows) plus the `oauthAccount` identity, so a swap is a keystroke, not a browser round-trip.
- **Never loses a token.** Every switch re-snapshots the active profile from the live credential store first, so a background token refresh is never dropped.
- **External providers.** Register OpenRouter, Ollama, z.ai, DeepSeek, Moonshot, or any Anthropic-compatible endpoint as a switchable profile, with a searchable model picker.
- **Per-project overrides.** Apply a provider globally, or scope it to one repo via `./.claude/settings.local.json`, which yoink adds to your `.gitignore` before writing.
- **Nothing leaks.** yoink only ever touches seven managed `ANTHROPIC_*` / `CLAUDE_CODE_SUBAGENT_MODEL` keys, warns before writing a token into a git-tracked file, and writes every file atomically.
- **One binary.** `bun build --compile` bakes the CLI, its deps, and the runtime into a single file. No Node, no runtime to install.

## Commands

| Command | Aliases | What it does |
| --- | --- | --- |
| `yoink` | | Open the interactive account menu |
| `yoink <name>` | | Switch straight to a saved profile |
| `yoink add` | `login` | Add an account: Claude sign-in or an external provider |
| `yoink edit <name>` | | Edit a profile (name, or provider / URL / key / model) |
| `yoink save <name>` | | Snapshot the current login as a profile |
| `yoink use <name>` | `switch` | Switch to a saved profile |
| `yoink list` | `ls` | List all saved profiles |
| `yoink current` | `who` | Show the active profile |
| `yoink rename <a> <b>` | | Rename a profile |
| `yoink remove <name>` | `rm` | Delete a profile |
| `yoink version` | `-v` | Print the version |
| `yoink help` | `-h` | Print help |

## External providers

`yoink add` also registers any Anthropic-compatible provider. Pick **External provider** and give it a name, a base URL (e.g. `https://openrouter.ai/api`), and an API key. yoink validates the key against `${baseURL}/v1/models`, then shows a searchable picker; the model you choose fills every Claude Code model tier. Switching to a Claude account strips the provider `env` block again so your subscription takes back over.

See [external providers](./docs/external-providers.md) for the full flow.

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
- [External providers](./docs/external-providers.md)
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
