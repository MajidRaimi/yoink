---
title: Switch between GitHub Copilot CLI accounts
seoTitle: "Switch GitHub Copilot CLI accounts · Yoink CLI"
description: "Switch the GitHub account Copilot CLI uses. yoink rewrites only last_logged_in_user in config.json and warns when GH_TOKEN or GITHUB_TOKEN overrides it."
nav: Switch Copilot CLI accounts
order: 4
related:
  - docs/subscriptions.md
  - docs/guides/switch-gemini-cli-accounts.md
  - docs/how-it-works.md
---

# Switch between GitHub Copilot CLI accounts

Also at [yoink.codes/guides/switch-copilot-cli-accounts/](https://yoink.codes/guides/switch-copilot-cli-accounts/).

To switch GitHub Copilot CLI accounts, sign in to each with `copilot login`, save them with `yoink save gh-work --tool copilot`, then run `yoink use gh-work`. Copilot keeps a token per GitHub user, so yoink only rewrites `last_logged_in_user` in `~/.copilot/config.json`. It swaps no credential files.

## The short answer

```bash
yoink add
yoink save gh-work --tool copilot
yoink save gh-personal --tool copilot
yoink use gh-work
yoink current --tool copilot
```

Run `yoink save` once while each account is the active one, or let `yoink add` (pick **GitHub Copilot**) run the sign-in for you. After that, `yoink use <name>` moves Copilot to that account:

```text
✔ Switched to gh-work (octo-work)
Restart the Copilot CLI to pick up the new login.
```

## How Copilot stores several users

Copilot CLI's login home is `$COPILOT_HOME` when that variable is set, otherwise `~/.copilot`. Its `config.json` already knows about more than one GitHub account. yoink reads two keys from it:

| Key | Holds |
| --- | --- |
| `logged_in_users` | every account that has signed in on this machine, each as `{ "host", "login" }` |
| `last_logged_in_user` | the one account Copilot uses now, in the same shape |

Because Copilot keeps the tokens for each signed-in user itself, a yoink Copilot profile is unusually small: it stores the `host` and `login` of one account and nothing else. There is no Copilot token in `~/.config/yoink/subscriptions.json`. The name shown is the GitHub login, and for a host other than `https://github.com`, such as a GitHub Enterprise server, it becomes `login@host` (for example `octo@ghe.example.com`).

## Add another GitHub login

`copilot login` adds an account without signing the others out, so adding one is straightforward. Through yoink, run `yoink add` and choose **GitHub Copilot**. yoink saves the account that is active now as a profile (if none holds it yet), then runs `copilot login`. Finish the GitHub device login in your browser, come back to the terminal, and yoink captures the new account and asks for a profile name.

Prefer to do it yourself? Save the current account first with `yoink save gh-work --tool copilot`, run `copilot login` as the second user, then `yoink save gh-personal --tool copilot`. Both accounts stay in `logged_in_users`, so neither sign-in is lost.

## What a switch changes (one key)

`yoink use gh-personal` reads `config.json`, finds the matching entry in `logged_in_users`, and writes it into `last_logged_in_user`. Every other key in the file is kept as it was. The file is written atomically with owner-only permissions, as formatted JSON.

Hosts are compared without case or a trailing slash, and logins without case, so `https://GitHub.com/` and `https://github.com` count as the same server. If the account in the profile is not in `logged_in_users` any more, yoink refuses with a message such as:

```text
✖ octo@ghe.example.com is not logged in to GitHub Copilot on this machine. Run `copilot login` as that user first.
```

yoink also refuses, with a hint to run `copilot login`, when `config.json` is missing. If Copilot is running (a process named `copilot`), yoink asks before switching, and a script must pass `--force`. The full sequence is in [What a switch does](../subscriptions.md#what-a-switch-does).

## Environment variables that override the login

Copilot prefers a token from the environment over the stored login. After every switch, yoink checks three variables, `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` and `GITHUB_TOKEN`, and prints one warning naming every one of them that is set and non-empty:

```text
! GH_TOKEN is set and overrides the stored GitHub Copilot login. Unset it for the switch to take effect.
```

The switch itself still happens. Unset the named variables in the shell where you start Copilot, or the account in `last_logged_in_user` will not be the one in use.

## FAQ

### Does yoink copy my GitHub token anywhere?

No. A Copilot profile holds only the host and login of an account. The token stays wherever Copilot itself keeps it, and yoink never copies it into a profile.

### Can I switch between github.com and a GitHub Enterprise account?

Yes, as long as both have signed in with `copilot login` on this machine. yoink matches on host and login together, so the two show up as separate profiles and switch like any other pair.

### Does a Copilot switch affect Claude Code, Codex or the gh CLI?

It changes only `last_logged_in_user` in Copilot's `config.json`. Claude Code and the other subscription tools keep their logins. yoink does not touch the `gh` CLI's own configuration.
