---
title: Switch between Gemini CLI accounts
seoTitle: "Switch Gemini CLI Google accounts · Yoink CLI"
description: "Save more than one Google login for Gemini CLI and switch between them. yoink swaps oauth_creds.json and google_accounts.json and refuses encrypted storage."
nav: Switch Gemini CLI accounts
order: 3
related:
  - docs/subscriptions.md
  - docs/guides/switch-codex-accounts.md
  - docs/security.md
---

# Switch between Gemini CLI accounts

Also at [yoink.codes/guides/switch-gemini-cli-accounts/](https://yoink.codes/guides/switch-gemini-cli-accounts/).

To switch Gemini CLI between Google accounts, save each login with `yoink add` (pick **Gemini**) or `yoink save gemini-work --tool gemini`, then run `yoink use gemini-work`. yoink swaps `oauth_creds.json` and `google_accounts.json` in `~/.gemini`, so Gemini starts on the other account without a new sign-in. Restart Gemini CLI afterward.

## The short answer

```bash
yoink add
yoink save gemini-work --tool gemini
yoink use gemini-work
yoink current --tool gemini
```

Pick **Gemini** in the `yoink add` menu to sign in to another Google account. `yoink save` captures the account Gemini is signed in to right now. `yoink use` switches, and `yoink current --tool gemini` shows which Gemini profile is active. A switch prints the Google account it moved to:

```text
✔ Switched to gemini-work (work@example.com)
Restart the Gemini CLI to pick up the new login.
```

## What a Gemini login is on disk

Gemini CLI keeps its login in a `.gemini` directory. yoink looks for it at `$GEMINI_CLI_HOME/.gemini` when `GEMINI_CLI_HOME` is set, and at `~/.gemini` otherwise. Note that the variable names the parent folder, not the `.gemini` folder itself. Two files make up a login:

| File | What it holds | Role in a switch |
| --- | --- | --- |
| `oauth_creds.json` | the Google OAuth tokens, including an ID token | the credential yoink saves and restores |
| `google_accounts.json` | `active` (the signed-in email) and `old` (accounts used before) | tells Gemini which account is current |

A yoink profile stores both files together. When it restores one and the profile lacks one of the two files, the live copy of that file is removed rather than kept, so Gemini never sees a token from one account next to the account list of another. Everything else in the directory, such as your Gemini settings, is left alone.

The name yoink shows is the `active` email from `google_accounts.json`, falling back to the email in the ID token. To decide whether the live login still belongs to the active profile, yoink compares that email and the token's Google subject id (`sub`), both read locally.

## Adding an account

Gemini CLI has no separate login command, so `yoink add` starts the interactive `gemini` session for you. Before it does, yoink:

1. saves the current Google login as a profile, if no profile holds it yet;
2. deletes the live `oauth_creds.json`;
3. moves the `active` email in `google_accounts.json` into `old` and sets `active` to null.

Gemini therefore starts signed out. Run `/auth`, sign in with the Google account you want to add, then quit with `/quit`. yoink captures the new login, suggests a name built from the email (for example `gemini-work`), and asks whether to add another. If the sign-in does not produce a login, yoink restores the one it set aside, so a cancelled `/auth` leaves you where you started.

You can also skip the menu: sign in inside Gemini yourself, then run `yoink save <name> --tool gemini`. That is the route to use from a script, because `yoink add` needs an interactive terminal.

## When yoink refuses

Some Gemini setups keep the login somewhere yoink cannot copy. yoink checks this before every save, switch and add, and stops with a message instead of producing a profile it could not restore:

| Condition | Message starts with |
| --- | --- |
| `GEMINI_FORCE_ENCRYPTED_FILE_STORAGE=true` in the environment | "Gemini CLI is set to keep its login in encrypted storage" |
| no `oauth_creds.json`, but a `gemini-credentials.json` | "Gemini CLI keeps this login in encrypted storage (gemini-credentials.json)" |

The first check is case-insensitive, so `TRUE` counts too. To use Gemini profiles, unset the variable and sign in again so Gemini writes `oauth_creds.json`.

## Switching and restoring

`yoink use gemini-personal` re-saves the live login into the active Gemini profile when the account matches, restores the target's two files with owner-only permissions, and marks it active for Gemini only. If Gemini CLI is running (a process named `gemini`, or Node running `@google/gemini-cli`), yoink asks first, and a script must pass `--force`. The shared steps are in [What a switch does](../subscriptions.md#what-a-switch-does).

Your Claude Code account and any Codex, Kimi Code or Copilot login stay as they were. The Mac menu bar app does not list Gemini profiles; switch them from the CLI. For how Codex logins differ, see [Switch between Codex (ChatGPT) accounts](./switch-codex-accounts.md).

## FAQ

### Do I need to run /auth again after every switch?

No. You sign in once per Google account while adding it. After that, `yoink use` restores the saved `oauth_creds.json` and `google_accounts.json`, and Gemini picks the account up when you restart it.

### Does yoink keep the Gemini settings of each account separately?

No. A Gemini profile holds only `oauth_creds.json` and `google_accounts.json`. Settings and other files in the `.gemini` directory are shared by every account and are never touched by a switch.
