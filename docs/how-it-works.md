# How it works

yoink switches between Claude Code accounts by swapping the two pieces of state that identify a login: the credential blob Claude Code keeps on your machine, and the `oauthAccount` identity block Claude Code keeps in `~/.claude.json`. A yoink profile pairs those two together, so restoring a profile restores both halves at once.

## Where the credential lives

Where Claude Code keeps the credential blob depends on your platform, and yoink follows suit:

- **macOS.** The credential lives in the Keychain under the service name `Claude Code-credentials`. yoink reads and writes this entry through the `security` CLI, the same interface Claude Code uses.
- **Linux and Windows.** Claude Code keeps the same credential blob in a plaintext file at `~/.claude/.credentials.json`. yoink reads and writes that file atomically with owner-only permissions (`0600` on Linux; on Windows the file inherits the user profile's ACLs, the same protection Claude Code itself applies).

In every case it is a single credential blob per machine: whichever account is logged in owns that entry. If the `CLAUDE_CONFIG_DIR` environment variable is set, yoink follows it for `.credentials.json`, `.claude.json`, and `settings.json`, matching Claude Code.

## What a profile is

A profile is two things captured together:

1. The credential blob from the platform store (the Keychain service `Claude Code-credentials` on macOS, `~/.claude/.credentials.json` on Linux and Windows).
2. The `oauthAccount` identity block from `~/.claude.json`.

Keeping both means a restored profile is a complete login, not just a token: the account identity in `~/.claude.json` matches the stored credential.

## A switch, step by step

When you switch to a saved profile, yoink does three things in order:

1. **Re-snapshot the active profile first.** Before touching anything, yoink reads the currently active profile back out of the live credential store and re-saves it. Claude Code can refresh its token in the background, so this step captures any newer token before it is overwritten. A background refresh is never lost.
2. **Write the target credential blob into the credential store.** yoink replaces the live credential with the target profile's credential blob: the `Claude Code-credentials` Keychain entry on macOS, or `~/.claude/.credentials.json` on Linux and Windows.
3. **Restore the target identity into `~/.claude.json`.** yoink writes the target profile's `oauthAccount` block back into `~/.claude.json`.

After a switch, restart Claude Code so it reloads the credential and identity from disk.

## Where profiles live

Profiles are stored in `~/.config/yoink/profiles.json`. yoink sets this file to `chmod 600` (owner read/write only), because it holds credential material.

## Files yoink touches

| Path | Role |
| --- | --- |
| `~/.config/yoink/profiles.json` | Profile store (credential blobs + identities), `chmod 600` on POSIX, same path on every OS |
| macOS Keychain service `Claude Code-credentials` | The live Claude Code login token (macOS) |
| `~/.claude/.credentials.json` | The live Claude Code login token (Linux and Windows), written atomically with owner-only permissions |
| `~/.claude.json` | Holds the `oauthAccount` identity block |
| `~/.claude/settings.json` | Global managed env block (external providers, applied globally) |
| `./.claude/settings.local.json` | Per-project managed env block, highest precedence |
| `./.gitignore` | yoink auto-adds `.claude/settings.local.json` before writing it |

If the `CLAUDE_CONFIG_DIR` environment variable is set, yoink follows it for `.credentials.json`, `.claude.json`, and `settings.json`, matching Claude Code.

## Notes

- **First Keychain access prompts on macOS only.** The first time yoink reads or writes the `Claude Code-credentials` entry, macOS asks for permission. Choose **Always Allow** so yoink can operate without prompting on every switch. No such prompt exists on Linux or Windows.
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

  Switching back to a Claude account restores the stored login and strips this env block.
- **Supported platforms.** yoink runs on macOS (Apple Silicon and Intel), Linux (x64 and arm64, glibc), and Windows (x64). The binary ships for `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, and `windows-x64`. Windows arm64 is not supported. On Linux and Windows, Claude Code keeps the credential in a plaintext file at `~/.claude/.credentials.json`; yoink writes it atomically, and on Windows the file inherits the user profile's ACLs, the same protection Claude Code itself applies.

For day-to-day commands, see [./usage.md](./usage.md). The project site is [https://yoink.codes](https://yoink.codes).
