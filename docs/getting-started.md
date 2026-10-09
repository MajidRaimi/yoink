---
title: Getting started
description: "Install yoink on macOS, Linux or Windows, save your first Claude Code login as a profile, and switch between accounts."
nav: Getting started
order: 1
section: Start
---

# Getting started

yoink keeps every AI coding login and provider in one place. It switches Claude Code accounts, switches ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins inside their own tools, and writes API-key providers into 13 coding tools. For Claude Code it reads and writes the login that Claude Code keeps on your machine (the macOS Keychain, or `~/.claude/.credentials.json` on Linux and Windows), so you can keep a work account and a personal account side by side and move between them in one command.

On a Mac, the menu bar app also switches Claude Code accounts and manages providers. See [Desktop app](./desktop.md).

## Supported platforms

- **macOS** (Apple Silicon and Intel). Claude Code stores your login in the Keychain under the service `Claude Code-credentials`, and yoink reads and writes it through the `security` CLI.
- **Linux** (x64 and arm64, glibc and musl/Alpine). Claude Code stores the same credential blob in a plaintext file at `~/.claude/.credentials.json`, and yoink reads and writes that file atomically with owner-only permissions (`0600`).
- **Windows** (x64 and arm64). Same as Linux: the credential lives at `~/.claude/.credentials.json`, and the file inherits the user profile's ACLs, the same protection Claude Code itself applies.

On bare Alpine, run `apk add libstdc++ libgcc` once (the same runtime libraries Node needs there).

If `CLAUDE_CONFIG_DIR` is set, yoink follows it for `.credentials.json`, `.claude.json`, and `settings.json`, matching Claude Code.

## Requirements

- **Nothing else to install.** yoink is a single self-contained binary compiled with Bun. You do not need Bun, Node, or any runtime on your machine to run it (the npm package includes a small Node shim that execs the right-arch binary).

## Install

On macOS and Linux, install with the hosted script:

```bash
curl -fsSL https://yoink.codes/install.sh | bash
```

The script downloads the binary for your OS and architecture from the latest GitHub Release, verifies its SHA-256 checksum, extracts it, and installs it to `/usr/local/bin` or `~/.local/bin`.

On Windows, install with PowerShell:

```powershell
powershell -c "irm https://yoink.codes/install.ps1 | iex"
```

The installer puts `yoink.exe` in `%LOCALAPPDATA%\Programs\yoink` and adds it to your user `PATH`.

Or install from npm on any OS with Node:

```bash
npm install -g yoink-cli
```

Confirm the install:

```bash
yoink version
```

### From source

You need [Bun](https://bun.sh) and git to build from source. Clone the repo, install dependencies, and compile the CLI:

```bash
git clone https://github.com/MajidRaimi/yoink.git
cd yoink
bun install
cd apps/cli && bun run build
ln -sf "$PWD/dist/yoink" ~/.local/bin/yoink
```

Make sure `~/.local/bin` is on your `PATH`, then run `yoink version` to confirm. [Development](./development.md) covers the monorepo layout and the release flow.

## Add your accounts

`yoink add` (alias: `yoink login`) captures your Claude Code logins as named profiles. Adding a Claude account needs an interactive terminal, because it runs the Claude sign-in.

When you run it, yoink:

1. Snapshots the account currently logged into Claude Code first, so nothing is lost.
2. Runs the Claude sign-in flow (`claude auth login`).
3. Captures the resulting login as a new profile.
4. Offers to add another account.

A common setup is one profile for work and one for personal use:

```bash
yoink add
```

Sign in to your work account, name the profile `work`, then when yoink asks, add another and sign in to your personal account as `personal`. The same menu adds a ChatGPT (Codex), Kimi Code, Gemini, or GitHub Copilot login (see [Subscriptions](./subscriptions.md)). You can also add an API-key provider (OpenAI, Kimi Code, Moonshot, OpenRouter, DeepSeek, Z.ai, Ollama, or any OpenAI- or Anthropic-compatible API) from the same menu and connect it to any of the 13 supported harnesses. See [Providers](./providers.md) and [Harnesses](./harnesses.md).

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

**Restart Claude Code after switching.** yoink writes the new login (into the Keychain on macOS, into `~/.claude/.credentials.json` on Linux and Windows) and restores the account identity, but a running Claude Code session will not pick up the change until it restarts. If Claude Code is running when you switch, yoink warns you, because a live session can overwrite the token on its next refresh.

**First-run Keychain prompt.** On macOS, the first time yoink reads or writes the Keychain, macOS asks for permission. Choose **Always Allow** so you are not prompted on every switch. No such prompt exists on Linux or Windows.

## Confirm

Check that yoink is installed and see the current version:

```bash
yoink version
```

For the full command reference, see [Usage](./usage.md), and for the menu keymap, see [Interactive menu](./interactive-menu.md). For what yoink reads and writes under the hood, see [How it works](./how-it-works.md) and [Security](./security.md).
