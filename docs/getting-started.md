# Getting started

yoink switches between Claude Code accounts from your terminal. It reads and writes the login that Claude Code keeps in the macOS Keychain, so you can keep a work account and a personal account side by side and move between them in one command.

## Requirements

- **macOS only.** yoink talks to the macOS Keychain (service `Claude Code-credentials`), which is where Claude Code stores your login. There is no equivalent path on other platforms, so yoink ships for macOS exclusively.
- **Nothing else to install.** yoink is a single self-contained binary compiled with Bun. You do not need Bun, Node, or any runtime on your machine to run it (the npm package includes a small Node shim that execs the right-arch binary).

## Install

Install with the hosted script:

```bash
curl -fsSL https://yoink.codes/install.sh | bash
```

The script downloads the binary for your architecture (`darwin-arm64` or `darwin-x64`) from the latest GitHub Release, verifies its SHA-256 checksum, extracts it, and installs it to `/usr/local/bin` or `~/.local/bin`.

Or install from npm:

```bash
npm install -g yoink-cli
```

Confirm the install:

```bash
yoink version
```

### From source

You need [Bun](https://bun.sh) to build from source. From the repo:

```bash
cd apps/cli && bun run build
ln -sf "$PWD/dist/yoink" ~/.local/bin/yoink
```

Make sure `~/.local/bin` is on your `PATH`, then run `yoink version` to confirm.

## Add your accounts

`yoink add` (alias: `yoink login`) captures your Claude Code logins as named profiles. It needs an interactive terminal.

When you run it, yoink:

1. Snapshots the account currently logged into Claude Code first, so nothing is lost.
2. Runs the Claude sign-in flow (`claude auth login`).
3. Captures the resulting login as a new profile.
4. Offers to add another account.

A common setup is one profile for work and one for personal use:

```bash
yoink add
```

Sign in to your work account, name the profile `work`, then when yoink asks, add another and sign in to your personal account as `personal`. You can also add an external provider (OpenRouter, Ollama, z.ai, DeepSeek, Moonshot, or any Anthropic-compatible endpoint) from the same menu. See [Usage](./usage.md) for the external-provider flow.

List what you have saved at any time:

```bash
yoink list
```

## Switch

Open the interactive menu and pick an account:

```bash
yoink
```

Or switch straight to a saved profile by name:

```bash
yoink work
```

**Restart Claude Code after switching.** yoink writes the new login into the Keychain and restores the account identity, but a running Claude Code session will not pick up the change until it restarts. If Claude Code is running when you switch, yoink warns you, because a live session can overwrite the token on its next refresh.

**First-run Keychain prompt.** The first time yoink reads or writes the Keychain, macOS asks for permission. Choose **Always Allow** so you are not prompted on every switch.

## Confirm

Check that yoink is installed and see the current version:

```bash
yoink version
```

For the full command reference and the interactive menu keymap, see [Usage](./usage.md). For what yoink reads and writes under the hood, see [How it works](./how-it-works.md).
