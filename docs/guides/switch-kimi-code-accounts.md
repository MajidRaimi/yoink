---
title: Switch between Kimi Code accounts
seoTitle: "Switch between Kimi Code CLI accounts · Yoink CLI"
description: "Kimi Code will not add a second account while one is signed in. yoink saves the current login, moves it aside for kimi login, and switches between both."
nav: Switch Kimi Code accounts
order: 5
related:
  - docs/subscriptions.md
  - docs/providers.md
  - docs/guides/switch-copilot-cli-accounts.md
---

# Switch between Kimi Code accounts

Also at [yoink.codes/guides/switch-kimi-code-accounts/](https://yoink.codes/guides/switch-kimi-code-accounts/).

To switch Kimi Code between accounts, add each one with `yoink add` (pick **Kimi Code**), or sign in and run `yoink save kimi-personal --tool kimi`, then switch with `yoink use kimi-personal`. yoink swaps every `credentials/*.json` file in `~/.kimi-code`, and moves the current login aside so `kimi login` can add another.

## The short answer

```bash
yoink add
yoink save kimi-personal --tool kimi
yoink use kimi-personal
yoink use kimi-personal --force
yoink current --tool kimi
```

`yoink add` handles the sign-in, `yoink save` captures the account Kimi Code is signed in to now, and `yoink use` switches. Add `--force` when you switch from a script while Kimi Code is still running. The output names the account by its Kimi user id:

```text
✔ Switched to kimi-personal (kimi:u1001)
Restart Kimi Code to pick up the new login.
```

## Why kimi login cannot add a second account

`kimi login` does not offer to add another account while one is already signed in. yoink works around this by keeping a copy of the current login as a profile, then giving `kimi login` an empty folder to sign in to.

Kimi Code keeps its login home at `$KIMI_CODE_HOME` when that variable is set, otherwise at `~/.kimi-code`. The login is the set of JSON files in its `credentials/` folder. yoink snapshots every one of them, so a profile is the whole folder's JSON content rather than a single token.

To name the account, yoink decodes the `access_token` in those files locally and reads its `user_id` claim, checking `credentials/kimi-code.json` before the others. The label is `kimi:<user_id>`, and if the token carries a `region` claim, yoink shows it next to the id. If no file holds a readable `user_id`, yoink stops with "Could not identify the Kimi Code login" and asks you to run `kimi login` again, instead of saving a profile it could not tell apart from the others.

## Add an account with yoink

Run `yoink add` in a terminal and choose **Kimi Code**. Here is what happens to your files:

1. yoink saves the live login as a profile, if no profile holds that account yet.
2. It renames `credentials/` to `credentials.yoink-<timestamp>` in the same Kimi Code home. Nothing is deleted.
3. It runs `kimi login`, which now sees no account and starts a fresh sign-in.
4. When the sign-in succeeds, yoink captures the new login and asks for a name. Any non-JSON entries from the old folder are moved into the new `credentials/` (unless one of the same name already exists), and the set-aside folder is removed.

If `kimi login` fails or produces no login, yoink deletes whatever partial `credentials/` it left and renames the set-aside folder back, so you end up signed in as before. yoink also tells you which profile still holds the previous login, should restoring it ever fail. `yoink add` needs an interactive terminal and the `kimi` command on your `PATH`.

## Switch

`yoink use kimi-work` re-saves the live login into the active Kimi Code profile (only when its user id matches), writes the target's credential files with owner-only permissions, and removes any live `credentials/*.json` file the target does not have. Kimi Code alone changes; Claude Code and the other tools keep their logins. If a `kimi` process is running, yoink asks first in a terminal and refuses in a script unless you pass `--force`. The shared rules are in [What a switch does](../subscriptions.md#what-a-switch-does).

## Kimi Code login vs the Kimi Code API key preset

Two different things carry the Kimi Code name in yoink, and they do not overlap:

| Aspect | Kimi Code login | `kimi-code` preset |
| --- | --- | --- |
| What it is | your subscription sign-in, from `kimi login` | an API key from `https://www.kimi.com/code` |
| Used by | the Kimi Code CLI only | other coding agents, through their own config files |
| Endpoints | not applicable | `https://api.kimi.com/coding/v1` (OpenAI Chat) and `https://api.kimi.com/coding` (Anthropic Messages) |
| Added with | `yoink add`, then **Kimi Code** | `yoink add`, then **Provider (API key)**, then **Kimi Code** |

yoink never copies a subscription token into a harness config. To use Kimi models in Claude Code, opencode or another agent, add the preset as a provider; the [preset table](../providers.md#presets) lists its endpoints, and the [harness table](../harnesses.md#supported-harnesses) shows which protocol each agent uses.

## FAQ

### What is the credentials.yoink folder in my Kimi Code home?

It is the previous `credentials/` folder, set aside while `yoink add` runs `kimi login`. yoink removes it as soon as the new sign-in is captured, or renames it back if the sign-in fails. If you find one after an interrupted add, your earlier login is in it.

### Can I sign in to two Kimi Code accounts at the same time?

yoink does not run them side by side. It keeps each account as a saved profile and puts one account's files in `credentials/` at a time. Switching takes one command, then a restart of Kimi Code.
