# How it works

yoink switches between Claude Code accounts by swapping the two pieces of state that identify a login: the credential blob Claude Code keeps in the macOS Keychain, and the `oauthAccount` identity block Claude Code keeps in `~/.claude.json`. A yoink profile pairs those two together, so restoring a profile restores both halves at once.

## The Keychain credential

Claude Code stores your login token in the macOS Keychain under the service name `Claude Code-credentials`. This is a single credential blob per machine: whichever account is logged in owns that entry. yoink reads and writes this entry directly, which is why yoink is macOS-only (it depends on the macOS Keychain and the `security` interface Claude Code uses on macOS).

## What a profile is

A profile is two things captured together:

1. The credential blob from the Keychain service `Claude Code-credentials`.
2. The `oauthAccount` identity block from `~/.claude.json`.

Keeping both means a restored profile is a complete login, not just a token: the account identity in `~/.claude.json` matches the credential in the Keychain.

## A switch, step by step

When you switch to a saved profile, yoink does three things in order:

1. **Re-snapshot the active profile first.** Before touching anything, yoink reads the currently active profile back out of the live Keychain and re-saves it. Claude Code can refresh its token in the background, so this step captures any newer token before it is overwritten. A background refresh is never lost.
2. **Write the target credential blob into the Keychain.** yoink replaces the `Claude Code-credentials` entry with the target profile's credential blob.
3. **Restore the target identity into `~/.claude.json`.** yoink writes the target profile's `oauthAccount` block back into `~/.claude.json`.

After a switch, restart Claude Code so it reloads the credential and identity from disk.

## Where profiles live

Profiles are stored in `~/.config/yoink/profiles.json`. yoink sets this file to `chmod 600` (owner read/write only), because it holds credential material.

## Files yoink touches

| Path | Role |
| --- | --- |
| `~/.config/yoink/profiles.json` | Profile store (credential blobs + identities), `chmod 600` |
| macOS Keychain service `Claude Code-credentials` | The live Claude Code login token |
| `~/.claude.json` | Holds the `oauthAccount` identity block |
| `~/.claude/settings.json` | Global managed env block (external providers, applied globally) |
| `./.claude/settings.local.json` | Per-project managed env block, highest precedence |
| `./.gitignore` | yoink auto-adds `.claude/settings.local.json` before writing it |

## Notes

- **First Keychain access prompts macOS.** The first time yoink reads or writes the `Claude Code-credentials` entry, macOS asks for permission. Choose **Always Allow** so yoink can operate without prompting on every switch.
- **Switching while Claude Code is running.** yoink warns if Claude Code is running when you switch. A live session can overwrite the token on its next background refresh, so quit Claude Code before switching and restart it afterward.
- **Atomic writes.** yoink writes files by writing to a temporary file and then renaming it into place, so a file such as `~/.claude.json` or `profiles.json` is never left half-written if the process is interrupted.
- **Only seven managed env keys.** When applying or stripping an external provider, yoink writes or removes exactly these keys and nothing else:
  - `ANTHROPIC_BASE_URL`
  - `ANTHROPIC_AUTH_TOKEN`
  - `ANTHROPIC_MODEL`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL`
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL`
  - `CLAUDE_CODE_SUBAGENT_MODEL`

  Switching back to a Claude account restores the Keychain login and strips this env block.
- **macOS only.** yoink reads and writes the macOS Keychain directly, so it runs on macOS only. The binary ships for `darwin-arm64` and `darwin-x64`.

For day-to-day commands, see [./usage.md](./usage.md). The project site is [https://yoink.codes](https://yoink.codes).
