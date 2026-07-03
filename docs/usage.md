# Usage

`yoink` switches between Claude Code accounts from your terminal. This page covers every command, the shorthand for switching, and a few common examples.

## Commands

| Command | Aliases | What it does |
| --- | --- | --- |
| `yoink` | | Open the interactive account menu. |
| `yoink <name>` | | Switch straight to a saved profile. |
| `yoink add` | `login` | Add an account: Claude sign-in or an external provider (needs an interactive terminal). |
| `yoink edit <name>` | | Edit a profile (rename a Claude account; change name, provider, base URL, API key, or model for an external one). |
| `yoink save <name>` | | Snapshot the current live login as a profile. |
| `yoink use <name>` | `switch` | Switch to a saved profile (warns if Claude Code is running; no-ops if already active). |
| `yoink list` | `ls` | List all saved profiles (marks the active one). |
| `yoink current` | `who` | Show the active profile. |
| `yoink rename <a> <b>` | | Rename a profile. |
| `yoink remove <name>` | `rm` | Delete a profile. |
| `yoink version` | `-v`, `--version` | Print the version. |
| `yoink help` | `-h`, `--help` | Print help. |

Any unrecognized argument is treated as a profile name, so `yoink work` and `yoink use work` are identical.

## Examples

```bash
yoink add

yoink list

yoink work

yoink use personal

yoink current

yoink save temp

yoink rename temp scratch

yoink remove scratch
```

## Related

- [Interactive menu](./interactive-menu.md): keymap and behavior of the `yoink` account menu.
- [External providers](./external-providers.md): adding OpenRouter, Ollama, z.ai, and other non-Claude backends.
