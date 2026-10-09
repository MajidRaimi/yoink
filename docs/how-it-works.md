---
title: How it works
seoTitle: "How Claude Code account switching works · Yoink CLI"
description: "How yoink switches Claude Code accounts: the Keychain entry or .credentials.json, the oauthAccount block in ~/.claude.json, and the re-snapshot step first."
nav: How it works
order: 7
section: Understand
---

# How it works

yoink switches between Claude Code accounts by swapping the two pieces of state that identify a login: the credential blob Claude Code keeps on your machine, and the `oauthAccount` identity block Claude Code keeps in `~/.claude.json`. A yoink profile pairs those two together, so restoring a profile restores both halves at once.

The same profile store also holds [subscription logins](./subscriptions.md) for ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot, and API-key [providers](./providers.md). Each kind switches differently, and each is covered below.

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

## Subscription logins

A subscription profile is a snapshot of one tool's own login files (and, for Codex on macOS, its `Codex Auth` Keychain entry). Switching one only touches that tool's login home, never Claude Code and never another tool:

1. If the tool is running, yoink asks first (from a script, it refuses unless you pass `--force`).
2. yoink re-captures the live login into the active profile, but only when the live identity matches that profile, so a login that belongs to someone else is never written into it.
3. yoink writes the target login atomically with owner-only permissions, and puts the previous login back if anything fails.

The per-tool files and identity rules are in [Subscriptions](./subscriptions.md).

## Providers

A provider profile holds an API key, the endpoints yoink found for it, and the models you picked. It does not replace a login. Instead, yoink writes an entry for it into each [harness](./harnesses.md) you connect, and re-syncs those entries whenever you change the key, the models, or the name.

Claude Code is the one exception. It holds a single backend at a time, so connecting a provider to it works like a switch: yoink writes seven managed env keys into `~/.claude/settings.json` (listed under Notes below). Switching back to a Claude account restores that login and strips the seven keys again. See [Providers](./providers.md#claude-code-is-exclusive).

## Where profiles live

Profiles are stored in `~/.config/yoink/profiles.json`. yoink sets this file to `chmod 600` (owner read/write only), because it holds credential material.

## Files yoink touches

| Path | Role |
| --- | --- |
| `~/.config/yoink/profiles.json` | Profile store (credential blobs + identities), `chmod 600` on POSIX, same path on every OS |
| `~/.config/yoink/subscriptions.json` | ChatGPT, Kimi Code, Gemini and Copilot login snapshots plus the active one per tool, `chmod 600` on POSIX |
| macOS Keychain service `Claude Code-credentials` | The live Claude Code login token (macOS) |
| `~/.claude/.credentials.json` | The live Claude Code login token (Linux and Windows), written atomically with owner-only permissions |
| `~/.claude.json` | Holds the `oauthAccount` identity block |
| `~/.claude/settings.json` | Global managed env block (a provider connected to Claude Code) |
| `./.claude/settings.local.json` | Per-project managed env block, highest precedence |
| `./.gitignore` | yoink offers to add `.claude/settings.local.json` before writing it |
| `~/.pi/agent/models.json`, `~/.pi/agent/settings.json` | pi providers and default model |
| `~/.omp/agent/models.yml`, `~/.omp/agent/config.yml` | omp providers and default model role |
| `~/.config/opencode/opencode.json` (or `.jsonc`) | opencode providers and default model |
| `~/.codex/config.toml` | codex model providers and default model |
| Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue, and Claude Desktop configs | Provider entries, one path per harness, listed in [Harnesses](./harnesses.md#supported-harnesses) |
| `~/.codex/auth.json`, `~/.kimi-code/credentials/`, `~/.gemini/oauth_creds.json` and `google_accounts.json`, `~/.copilot/config.json` | Live subscription logins, rewritten only when you switch that tool (see [Subscriptions](./subscriptions.md#supported-tools)) |
| `<harness config>.yoink.bak` | One-time backup of each harness config, made before yoink first changes it (not the per-provider Goose and Claude Desktop files, which yoink owns) |
| `~/.config/yoink/cache/models-dev.json` | Cached [models.dev](https://models.dev) catalog for model limits, refreshed daily |

The harness paths follow `PI_CODING_AGENT_DIR`, `XDG_CONFIG_HOME`, and `CODEX_HOME` when they are set. See [Harnesses](./harnesses.md) for exactly what each entry contains.

If the `CLAUDE_CONFIG_DIR` environment variable is set, yoink follows it for `.credentials.json`, `.claude.json`, and `settings.json`, matching Claude Code.

## Notes

- **First Keychain access prompts on macOS only.** The first time yoink reads or writes the `Claude Code-credentials` entry, macOS asks for permission. Choose **Always Allow** so yoink can operate without prompting on every switch. No such prompt exists on Linux or Windows.
- **Switching while Claude Code is running.** yoink warns if Claude Code is running when you switch. A live session can overwrite the token on its next background refresh, so quit Claude Code before switching and restart it afterward.
- **Atomic writes.** yoink writes files by writing to a temporary file and then renaming it into place, so a file such as `~/.claude.json` or `profiles.json` is never left half-written if the process is interrupted.
- **Only seven managed env keys.** When applying or stripping a provider in Claude Code, yoink writes or removes exactly these keys and nothing else:
  - `ANTHROPIC_BASE_URL`
  - `ANTHROPIC_AUTH_TOKEN`
  - `ANTHROPIC_MODEL`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL`
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL`
  - `CLAUDE_CODE_SUBAGENT_MODEL`

  Switching back to a Claude account restores the stored login and strips this env block.
- **Supported platforms.** yoink runs on macOS (Apple Silicon and Intel), Linux (x64 and arm64, glibc and musl), and Windows (x64 and arm64). The binary ships for `darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `linux-x64-musl`, `linux-arm64-musl`, `windows-x64`, and `windows-arm64`. On Linux and Windows, Claude Code keeps the credential in a plaintext file at `~/.claude/.credentials.json`; yoink writes it atomically, and on Windows the file inherits the user profile's ACLs, the same protection Claude Code itself applies.

For day-to-day commands, see [Usage](./usage.md). For the safety rules behind every write, see [Security](./security.md). The project site is [https://yoink.codes](https://yoink.codes).
