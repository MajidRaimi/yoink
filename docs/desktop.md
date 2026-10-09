---
title: Desktop app
seoTitle: "Yoink menu bar app for macOS: switch Claude Code accounts"
description: "The Yoink menu bar app for macOS switches Claude Code accounts, saves the current login, adds API-key providers and ticks the coding agents they connect to."
nav: Desktop app
order: 2
section: Start
demo: menubar-panel
---

# Desktop app

Yoink for macOS is a small menu bar app. It switches Claude Code accounts, saves the login you are on, adds API-key [providers](./providers.md), and connects them to your [harnesses](./harnesses.md), all from a panel that opens on a click or a shortcut.

The app ships with its own copy of the yoink CLI and runs it for every change, so the menu bar and the terminal share the same profiles in `~/.config/yoink/profiles.json`. You do not need to install the CLI to use the app.

> **Note**
> Subscription logins for ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot switch from the CLI only today. The app shows Claude accounts and providers. See [Subscriptions](./subscriptions.md).

## Install

1. Download the DMG for your Mac from the [download page](https://yoink.codes/download/): one build for Apple Silicon, one for Intel. Both need macOS 12 or later.
2. Open the DMG and drag **Yoink** to Applications.
3. Launch Yoink. It has no Dock icon; look for the Yoink mark in the menu bar.

The first time the app reads or writes the `Claude Code-credentials` Keychain entry, macOS asks for permission. Choose **Always Allow**, the same as with the CLI.

## Open the panel

- **Click** the menu bar icon to open or close the panel.
- **Press the global shortcut** from any app. The default is `Option` + `Y`, and you can change it in Settings.
- **Press `Esc`** to close the panel.

Right-click the menu bar icon for **Launch at login**, **Check for updates**, and **Quit Yoink**.

## Profiles

The panel opens on your profiles, with a search box focused. Type to filter by name, email, or provider.

| Key | Action |
| --- | --- |
| `↑` / `↓` (or `j` / `k` when the search box is not focused) | Move the highlight |
| `Enter` | Switch to the highlighted Claude account, or open the highlighted provider's harnesses |
| `Esc` | Clear the search, then close the panel |

Each row also has buttons to rename the profile in place, edit a provider, and delete the profile. Deleting a Claude account removes its saved snapshot and never logs you out. Deleting a provider first disconnects it from every harness.

The list updates on its own when `profiles.json` changes, so a switch you make with the CLI shows up in the panel right away.

### Switching while Claude Code is running

Before a switch, the app checks whether Claude Code is running. If it is, the app asks first: a live session can overwrite the switched credentials on its next token refresh, so the switch may not stick until that session exits. Choose **Switch anyway** to go ahead, or cancel. Restart Claude Code after a switch, as you would with `yoink use`.

## Add a Claude account

Open the **+** menu and choose **Add Claude account**. The app opens a terminal inside the panel and runs `yoink add`, so you get the same sign-in flow as the CLI: yoink saves the current login first, runs the Claude sign-in, and captures the new login as a profile. A status chip shows when the flow is running, done, or failed.

## Save the current login

Choose **Save current login** from the **+** menu, type a name, and press `Enter`. This is the same as `yoink save <name>`: it snapshots the Claude Code login that is live right now.

## Add a provider

Choose **Add provider** from the **+** menu. The wizard has four steps:

1. **Provider.** Pick a preset (OpenAI, Kimi Code, Moonshot AI, OpenRouter, DeepSeek, Z.ai, or Ollama) or **Custom** for any OpenAI- or Anthropic-compatible API.
2. **API key.** Enter the key and the profile id harness configs will use. For a custom provider, also enter a display name and a base URL; the app probes the URL with your key to find the protocols it speaks, exactly like the CLI.
3. **Models.** Search the provider's live model list and select as many as you like.
4. **Harnesses.** Tick the harnesses to connect it to, and optionally pick a default model for them.

The key goes to the CLI on stdin (`--token-stdin`), never as a command-line argument. `⌘` + `Enter` moves to the next step, and `Esc` goes back one.

## Harness checklist

Press `Enter` on a provider to open its checklist. The **Harnesses** tab lists all 13 harnesses with their config path and state:

- **connected** harnesses are ticked. Untick one to disconnect the provider from it.
- **not installed** and **incompatible** harnesses are greyed out. An incompatible row says which protocol it needs, for example codex needs an OpenAI Responses endpoint.
- Claude Code is marked **one at a time**, because connecting a provider to it switches Claude Code to that provider. If Claude Code is running, the app asks before connecting.
- Goose, Zed, and Claude Desktop carry an **experimental** tag. After connecting one, the app shows the extra step that harness needs.

The **Models** tab changes which models the provider exposes and re-syncs every connected harness.

## Settings

Open Settings from the gear icon:

- **Global shortcut.** Click **Change**, then press the new combination (it needs at least one modifier). `Esc` cancels. The shortcut is saved in `~/.config/yoink/desktop.json`.
- **Launch at login.** Starts Yoink when you log in to your Mac. The same toggle is in the menu bar icon's right-click menu.

## Updates

Choose **Check for updates** from the menu bar icon's right-click menu. When a newer version is published on GitHub Releases, the app downloads it, installs it, and restarts. A notification tells you if you are already on the latest version.

## Related

- [Getting started](./getting-started.md): install the CLI on macOS, Linux, or Windows.
- [Providers](./providers.md): presets, probing, and model selection in detail.
- [Security](./security.md): how yoink writes credentials and config files.
