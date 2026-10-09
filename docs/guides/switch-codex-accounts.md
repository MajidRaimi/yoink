---
title: Switch between Codex (ChatGPT) accounts
seoTitle: "Switch Codex (ChatGPT) accounts without logout · Yoink CLI"
description: "Save several ChatGPT logins for Codex and switch between them. yoink swaps auth.json or the Codex Auth Keychain entry and re-saves the live login first."
nav: Switch Codex accounts
order: 2
related:
  - docs/subscriptions.md
  - docs/guides/switch-claude-code-accounts.md
  - docs/harnesses.md
---

# Switch between Codex (ChatGPT) accounts

Also at [yoink.codes/guides/switch-codex-accounts/](https://yoink.codes/guides/switch-codex-accounts/).

To switch Codex between ChatGPT accounts without logging out, save each login once with `yoink add` (pick **ChatGPT (Codex)**) or `yoink save codex-work --tool codex`, then run `yoink use codex-work`. yoink re-saves the live login, then restores the target's `auth.json`, or its `Codex Auth` Keychain entry on macOS. Restart Codex afterward.

## The short answer

```bash
yoink add
yoink save codex-work --tool codex
yoink use codex-work
yoink use codex-work --force
yoink current --tool codex
```

`yoink add` opens a menu where **ChatGPT (Codex)** sits next to Claude accounts and providers. `yoink save` snapshots whichever ChatGPT login Codex holds right now. `yoink use` switches, and `--force` skips the running-process check described below. `yoink current --tool codex` prints only the active Codex profile.

A switch prints the profile name with the account email and ChatGPT plan, then a reminder to restart:

```text
✔ Switched to codex-work (work@example.com · team)
Restart Codex to pick up the new login.
```

## Where Codex keeps its login

Codex has one login home: `$CODEX_HOME` when that variable is set, otherwise `~/.codex`. yoink follows the same rule, so a shell that exports `CODEX_HOME` switches the login in that directory. Inside it, the login lives in one of two places, decided by `cli_auth_credentials_store` in `config.toml`:

| `cli_auth_credentials_store` | Where the login is | What yoink switches |
| --- | --- | --- |
| not set, or `"file"` | `auth.json` | `auth.json`, written atomically with `0600` permissions |
| `"keyring"` | the system keyring | the `Codex Auth` Keychain entry (macOS only) |
| `"auto"` | `auth.json` if it exists, otherwise the keyring | whichever of the two holds the login (macOS only) |

Any other value stops yoink with a message naming the file, rather than guessing. On macOS, the Keychain entry's account name is derived from the real path of your Codex home (`cli|` plus the first 16 hex characters of its SHA-256), so two Codex homes keep two separate entries and a switch in one never touches the other.

yoink reads the account from the ID token in that login: the email, and the ChatGPT plan from the `https://api.openai.com/auth` claim. That decoding happens locally. A Codex home signed in with an API key instead of ChatGPT can be saved too; it is labeled `OpenAI API key` and matched by a short hash of the key, so the key itself never appears in `yoink list`.

## Add a second ChatGPT login

Run `yoink add` in a terminal and choose **ChatGPT (Codex)**. Before anything else, yoink saves the login that is live now as its own profile (if no profile holds it yet) and tells you the name it used. Then it runs `codex login`, which opens a browser for you to sign in to the other ChatGPT account. When you return, yoink captures the new login, suggests a name built from the email (an address starting with `work@` becomes `codex-work`), and asks whether to add another.

If the sign-in fails, or the login is unchanged afterward, yoink saves nothing and puts the previous login back. `yoink add` needs an interactive terminal; in a script, sign in with `codex login` yourself and run `yoink save <name> --tool codex`.

## Switch, and the running-process guard

A running Codex can write its old token back on its next refresh, which would undo the switch. yoink looks for a process named `codex`, or a Node process running the `@openai/codex` package. When it finds one:

- In a terminal, it asks "ChatGPT (Codex) is running. It may overwrite the login on its next refresh. Switch anyway?" with **No** as the default.
- From a script, it refuses with "ChatGPT (Codex) is running, so the switch was skipped. Close it first, or pass --force." and exits with status 1.

The rest of the switch (re-saving the live login only when its identity matches, the atomic write, and the rollback on failure) is the same for every subscription tool and is described in [What a switch does](../subscriptions.md#what-a-switch-does). Only Codex changes; Claude Code and the other tools keep their logins. Codex switching is CLI only: the Mac menu bar app switches Claude Code accounts and manages providers, but not ChatGPT logins (see [Desktop app](../desktop.md)).

## Linux keyring limitation

yoink can only read and write a keyring-stored Codex login on macOS. On Linux and Windows it refuses as soon as `config.toml` says `"keyring"` or `"auto"`, even when an `auth.json` happens to exist, because with `"auto"` Codex may still move the login into the keyring. The error names the exact file to edit:

```toml
cli_auth_credentials_store = "file"
```

Add that line to `config.toml` in your Codex home, run `codex login` once more so Codex writes `auth.json`, then save and switch as usual.

## When a provider overrides the ChatGPT login

If you also use yoink to connect an API-key provider to Codex with a default model, yoink writes `model_provider = "<provider>"` into the same `config.toml`. Codex then talks to that provider, and the ChatGPT login you switched to is not used. yoink checks for this after every Codex switch and prints a warning with the full path to the file:

```text
! Codex is set to model_provider = "openrouter" in ~/.codex/config.toml, which overrides the ChatGPT login. Run `yoink disconnect openrouter --from codex` or remove model_provider from that file to use ChatGPT.
```

The value `openai` (Codex's built-in provider) does not trigger the warning. To run Codex on an API key instead of a subscription, see the [Codex harness page](../harnesses/codex.md) for what yoink writes into `config.toml`, and [codex is responses-only](../harnesses.md#codex-is-responses-only) for why the [`openai` preset](../providers/openai.md) is the one preset Codex accepts.

## FAQ

### Does switching Codex accounts change my Claude Code account?

No. yoink routes `yoink use` by profile type, and a Codex profile only touches the Codex login home. Claude Code, Kimi Code, Gemini and Copilot keep whichever login they had.

### I use two CODEX_HOME directories. Will yoink mix them up?

yoink keeps one list of Codex profiles, but a switch always writes into the Codex home that is active in the shell where you run it, and on macOS each home has its own Keychain entry. Run `yoink use` with the same `CODEX_HOME` you start Codex with.
