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
| `Enter` | Switch to the highlighted profile |
| `n` | Add a new account (Claude sign-in or an external provider) |
| `e` | Edit the highlighted profile |
| `s` | Save the current live login as a new profile |
| `d` | Delete the highlighted profile (after a confirmation) |
| `q` / `Esc` / `Ctrl-C` | Quit |

Switching from the menu behaves the same as [`yoink use`](./usage.md): it warns if Claude Code is running, and no-ops if the highlighted profile is already active. See [How it works](./how-it-works.md) for what a switch changes on disk and in the credential store.

## Editing from the menu

Pressing `e` opens an editor that adapts to the highlighted profile's type:

- **Claude account:** the only editable field is the profile name, so `e` goes straight to a rename prompt. The stored Claude login and `oauthAccount` identity are not touched.
- **External provider:** `e` shows a field picker. You can change the name, provider, base URL, API key, or model. Editing the model reruns the searchable model picker. When you edit the profile that is currently active, the changes are re-applied to the live settings immediately (the managed env block is rewritten), so you do not need a separate switch.

This mirrors the standalone [`yoink edit`](./usage.md) command. For how external providers are configured and applied, see [External providers](./external-providers.md).
