---
title: Interactive menu
seoTitle: "Yoink interactive menu: switch AI coding logins with Enter"
description: "Run yoink with no arguments to open a keyboard menu: move with j and k, switch with Enter, and add, edit, save or delete Claude, Codex or provider profiles."
nav: Interactive menu
order: 3
section: Switch
demo: menu
---

# Interactive menu

Running `yoink` with no arguments opens a keyboard-driven list of your saved profiles. It is the default surface for switching accounts and managing profiles without remembering command names.

```
yoink

  ● work            (active)
    personal
    openrouter

  ↑↓ move  ↵ switch  n new  e edit  s save  d delete  q quit
```

The active profile is marked with a green dot. Highlighting a row and pressing `Enter` switches to it. After any action completes, the menu loops back to the list so you can keep working.

## Keymap

| Key | Action |
| --- | --- |
| `↑` / `↓` or `j` / `k` | Move the highlight (wraps at the top and bottom) |
| `Enter` | Switch to the highlighted login within its own tool. On a provider row, open its harness picker. |
| `n` | Add a new account (Claude sign-in, a Codex, Kimi, Gemini, or Copilot login, or an API-key provider) |
| `e` | Edit the highlighted profile |
| `s` | Save the current live login as a new profile |
| `d` | Delete the highlighted profile (after a confirmation) |
| `q` / `Esc` / `Ctrl-C` | Quit |

With [subscription logins](./subscriptions.md) saved, rows are grouped by tool under a section header (Claude Code, ChatGPT (Codex), Kimi Code, Gemini, GitHub Copilot), each with its own active marker. `Enter` switches within the highlighted row's tool and leaves the others alone.

Switching from the menu behaves the same as [`yoink use`](./usage.md): it warns if Claude Code is running, and no-ops if the highlighted profile is already active. See [How it works](./how-it-works.md) for what a switch changes on disk and in the credential store.

## Editing from the menu

Pressing `e` opens an editor that adapts to the highlighted profile's type:

- **Claude account:** the only editable field is the profile name, so `e` goes straight to a rename prompt. The stored Claude login and `oauthAccount` identity are not touched.
- **Provider:** `e` shows a field picker: **Harnesses** (connect or disconnect any of the 13 supported [harnesses](./harnesses.md)), **Models** (reruns the searchable model picker), **Profile id**, **Display name**, **API key**, and **Endpoints** (re-probes a base URL). Every change is re-synced into the harnesses the provider is connected to, so you do not need a separate switch or connect.

This mirrors the standalone [`yoink edit`](./usage.md) command. For how providers are configured and applied, see [Providers](./providers.md) and [Harnesses](./harnesses.md).
