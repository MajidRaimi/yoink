---
title: Security
seoTitle: "How Yoink keeps API keys and logins safe · Yoink CLI"
description: "Atomic owner-only writes, kept symlinks, one-time backups, seven managed Claude Code keys, a git-tracked config guard, and keys passed on stdin, never argv."
nav: Security
order: 8
section: Understand
---

# Security

yoink handles live logins and API keys, so every write follows the same rules. This page lists them, with the exact files and flags involved. For the full list of paths, see [How it works](./how-it-works.md#files-yoink-touches).

## Atomic writes

yoink never edits a credential or config file in place. It writes the new contents to a temporary file next to the target (`<file>.<pid>.tmp`), then renames it over the target. A rename is atomic, so `~/.claude.json`, `profiles.json`, or a harness config is either the old version or the new one, never half-written, even if yoink is interrupted. If the write fails, the temporary file is removed.

On Windows, where another process can briefly hold a file open, the rename is retried a few times before yoink gives up.

## Owner-only permissions

Files that hold secrets are written with owner-only permissions:

- A new secret file is created as `0600` (read and write for you, nothing for anyone else).
- An existing secret file keeps your permission bits, minus any group or other access, so it ends up owner-only too.
- yoink's own directories (`~/.config/yoink`, subscription snapshot directories, and the harness config directories it creates) are created as `0700`.

That covers `~/.config/yoink/profiles.json`, `~/.config/yoink/subscriptions.json`, `~/.claude/.credentials.json` on Linux and Windows, every harness config that receives a key, every subscription login file yoink restores, and every backup. On Windows the files inherit the user profile's ACLs, the same protection Claude Code itself applies.

## Symlinks are kept

If a config file is a symlink, for example into a dotfiles repo, yoink resolves the link and writes to the file it points at. The symlink stays a symlink. A link whose target does not exist yet is followed too, and the target's directory is created.

## One-time backups

The first time yoink changes an existing harness config, it copies the original to `<file>.yoink.bak` (for example `~/.codex/config.toml.yoink.bak`):

- The backup is made once and never overwritten, so it always holds the config from before yoink touched it.
- It is owner-only (`0600`).
- When the config sits inside a git work tree, yoink adds `*.yoink.bak` to that repo's `.git/info/exclude`, so the backup is never committed by accident.
- When you rotate a provider's key or disconnect a provider, yoink scrubs the retired key out of the backups it touched in that operation. A backup keeps your original config, not a key yoink wrote and then replaced.

Claude Code's `settings.json` gets no backup, because yoink only ever changes its seven managed keys there. The per-provider Goose and Claude Desktop files get none either: yoink owns those files and deletes them on disconnect. See [Harnesses](./harnesses.md#backups).

## Seven managed keys in Claude Code

When a provider is applied to Claude Code, yoink writes exactly these keys into the `env` block of `~/.claude/settings.json` (or `./.claude/settings.local.json` for a single project), and nothing else:

- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- `CLAUDE_CODE_SUBAGENT_MODEL`

Switching back to a Claude account strips the same seven keys. Every other key in your settings, inside `env` or not, is left alone.

## Git-tracked configs

When you connect a provider to a harness, yoink first checks whether git tracks any config file it is about to write a key into (and does not ignore it). If one is tracked, the key could end up in a commit, so:

- The interactive flow names the tracked files and asks whether to write anyway.
- `yoink add --external` and `yoink connect` refuse to write it unless you pass `--allow-tracked`.

For the **This project only** scope, yoink checks that `.gitignore` excludes `.claude/settings.local.json` and offers to add it before writing. See [Providers](./providers.md#this-project-only).

## Keys stay off the command line

- **`--token-stdin`.** Scripts pass an API key on stdin, never as an argument, so it stays out of your shell history and the process list. `yoink add --external`, `yoink edit`, and `yoink probe` all take it. The menu bar app uses the same flag for every key.
- **Hidden input.** The interactive prompts read keys without echoing them, and yoink never prints a key back.
- **Keychain writes through stdin.** On macOS, yoink writes the `Claude Code-credentials` Keychain entry by running `security -i` and sending the command on stdin, with the credential hex-encoded. It never appears in the arguments of a running process. If an entry is too large to send that way, yoink refuses with a message instead of falling back to argv.

## No secrets in JSON output

The `--json` modes exist for scripts and the menu bar app, and none of them include a token or an API key:

- `yoink list --json` (and its alias `yoink accounts --json`) and `yoink current --json` print `name`, `type`, `label`, and `current` for each profile.
- `yoink harnesses --json` prints each harness's id, label, install state, config path, protocols, notices, and the names of the providers it holds.
- `yoink status <name> --json` prints each harness's state for one provider.

## Subscription logins are re-captured by identity

Before switching a ChatGPT (Codex), Kimi Code, Gemini, or GitHub Copilot login, yoink re-captures the live login into the active profile so a refreshed token is not lost. It only does that when the live identity matches the profile (same account id, email, or user id), so a login that belongs to someone else is never written into your profile. Identities are read locally from the login files; yoink makes no network call to find out who you are, and a stored identity never contains a token.

If any step of a subscription switch fails, yoink puts the previous live login back. See [Subscriptions](./subscriptions.md#what-a-switch-does).

## Where keys go

yoink sends an API key only to that provider's own URLs, when it probes endpoints or lists models. The [models.dev](https://models.dev) catalog it uses for model limits is fetched without a key.

## Related

- [How it works](./how-it-works.md): the switch sequence and every file yoink touches.
- [Providers](./providers.md): where keys are stored and how Claude Code scope works.
- [Harnesses](./harnesses.md): what each harness config receives.
