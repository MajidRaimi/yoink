# Subscriptions

Besides Claude Code accounts, yoink can save and switch the subscription logins of four other coding tools: ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot. Each tool's logins switch inside that tool only. yoink never copies a subscription token from one tool into another, or into a harness config.

## Supported tools

| Tool | `--tool` id | Login home | What a switch changes | Identity shown | Login command |
| --- | --- | --- | --- | --- | --- |
| ChatGPT (Codex) | `codex` | `$CODEX_HOME` or `~/.codex` | `auth.json`, or the `Codex Auth` Keychain entry on macOS when Codex stores credentials in the keyring | email and ChatGPT plan from the ID token | `codex login` |
| Kimi Code | `kimi` | `$KIMI_CODE_HOME` or `~/.kimi-code` | every `credentials/*.json` | `kimi:<user_id>` from the access token | `kimi login` |
| Gemini | `gemini` | `$GEMINI_CLI_HOME/.gemini` or `~/.gemini` | `oauth_creds.json` and `google_accounts.json` | the active Google account | `gemini`, then `/auth` |
| GitHub Copilot | `copilot` | `$COPILOT_HOME` or `~/.copilot` | `last_logged_in_user` in `config.json` only | the GitHub login | `copilot login` |

Identity is read locally from files yoink already holds. yoink makes no network calls to find out who you are, and the identity it stores never contains a token.

## Commands

```bash
yoink add
yoink save codex-work --tool codex
yoink use codex-work
yoink use codex-work --force
yoink list
yoink current
yoink current --tool kimi
yoink list --json
```

| Command | What it does |
| --- | --- |
| `yoink add` | The menu lists **ChatGPT (Codex)**, **Kimi Code**, **Gemini**, and **GitHub Copilot** next to Claude and providers. yoink first saves the current login if no profile holds it yet, runs the tool's login command in your terminal, captures the new login, and asks for a name. |
| `yoink save <name> --tool <tool>` | Snapshot the login that is live for that tool right now. |
| `yoink use <name>` | Switch to a profile. yoink routes by profile type: a Claude account or provider switches Claude Code, a subscription profile switches only its own tool. `yoink <name>` works too. |
| `yoink use <name> --force` | Switch even though the tool is running (see below). |
| `yoink list` | Every profile, grouped by tool, with the active one in each group marked. |
| `yoink current [--tool <tool>]` | The active profile. Without `--tool` it shows Claude Code and every tool with an active subscription profile. |
| `yoink list --json` | `[{ "name", "type", "label", "current" }]` for scripts and the desktop app. Never includes secrets. |

`rename`, `remove`, and `edit` (rename) work on subscription profiles the same way they do on Claude accounts. Removing a profile deletes the snapshot only, never the live login.

## What a switch does

1. **Running-process guard.** If the tool is running, it may write its old login back on its next token refresh. In an interactive terminal yoink asks before switching (default no). From a script it refuses unless you pass `--force`.
2. **Refresh the current profile.** The live login is re-captured into the tool's active profile, so refreshed tokens are not lost. This only happens when the live identity matches that profile (same account id, email, or user id). A login that belongs to someone else is never written into it.
3. **Restore the target.** Files are written atomically with owner-only (`0600`) permissions, then any keyring entry. If anything fails, yoink puts the previous live login back.
4. **Mark it active.** The profile becomes the current one for that tool. Other tools, and Claude Code, are left alone.

Snapshots live in `~/.config/yoink/subscriptions.json` (`0600`), next to `profiles.json`. They are kept in their own file so older versions of the menu bar app, which only understand Claude and provider profiles, keep reading `profiles.json` without trouble.

## Per-tool notes

### ChatGPT (Codex)

Codex keeps its login in `auth.json`, or in the system keyring when `cli_auth_credentials_store` is `keyring` (or `auto` with no `auth.json`). On macOS yoink switches the `Codex Auth` Keychain entry for your Codex home. On Linux the Secret Service keyring is not supported yet, so yoink refuses with a message instead of guessing. Set `cli_auth_credentials_store = "file"` in `~/.codex/config.toml` to switch on Linux.

### Kimi Code

`kimi login` does not offer to add a second account while one is signed in. When you add a Kimi account, yoink first saves the current credentials as a profile, then moves `credentials/` aside so `kimi login` starts fresh. Your previous login stays available as its own profile.

### Gemini

`gemini` has no separate login command. yoink starts `gemini`; run `/auth`, sign in with Google, then exit so yoink can capture the login. yoink refuses to manage Gemini when `GEMINI_FORCE_ENCRYPTED_FILE_STORAGE=true` or when the login lives in `gemini-credentials.json`, because those credentials are not portable files.

### GitHub Copilot

Copilot already keeps a token per GitHub user, so yoink swaps no credential files. `copilot login` adds an account without signing the others out, and a switch only rewrites `last_logged_in_user` (`host` and `login`) in `config.json`, keeping every other key. If `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, or `GITHUB_TOKEN` is set, yoink warns that the variable overrides the stored login.

## Related

- [Usage](./usage.md): every command.
- [Interactive menu](./interactive-menu.md): profiles grouped by tool, and switching with `Enter`.
- [How it works](./how-it-works.md): how Claude Code accounts are switched.
