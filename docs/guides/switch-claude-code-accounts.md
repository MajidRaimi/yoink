---
title: Switch between Claude Code accounts
seoTitle: "Switch Claude Code accounts without logging out · Yoink CLI"
description: "Keep a work and a personal Claude Code account and switch in one command. yoink swaps the Keychain entry or .credentials.json and the oauthAccount block."
nav: Switch Claude Code accounts
order: 1
related:
  - docs/how-it-works.md
  - docs/desktop.md
  - docs/compare/index.md
---

# Switch between Claude Code accounts

Also at [yoink.codes/guides/switch-claude-code-accounts/](https://yoink.codes/guides/switch-claude-code-accounts/).

To switch between Claude Code accounts without logging out, save each login once with `yoink add`, then run `yoink work` or `yoink use personal`. yoink re-saves the live login, writes the target credential into the Keychain or `~/.claude/.credentials.json`, and restores its `oauthAccount` block in `~/.claude.json`. Restart Claude Code afterward.

## The short answer

```bash
yoink add
yoink list
yoink work
yoink use personal
yoink current
```

`yoink work` and `yoink use work` do the same thing: any argument yoink does not recognize is treated as a profile name. `yoink current` prints the active profile for each tool (add `--tool claude` for Claude Code alone), and `yoink list` shows every saved profile with the active one marked.

## What identifies a Claude Code login

A Claude Code login has two halves, and a switch has to move both of them:

| Half | Where it lives |
| --- | --- |
| The credential blob | The macOS Keychain entry `Claude Code-credentials`, or `~/.claude/.credentials.json` on Linux and Windows |
| The identity | The `oauthAccount` block in `~/.claude.json` |

A yoink profile stores the pair, so restoring it gives Claude Code a complete login rather than a token that disagrees with the account shown in `~/.claude.json`. Profiles live in `~/.config/yoink/profiles.json`, which yoink keeps owner-only (`chmod 600`). [How it works](../how-it-works.md#what-a-profile-is) has the full picture.

## Save each account once

Run `yoink add` in an interactive terminal and pick the Claude account option. yoink first saves the login that is live right now (if no profile holds it yet), then runs `claude auth login --claudeai` so you can sign in to the next account in the browser. When the sign-in finishes, yoink captures the new login, suggests a profile name based on the account email, and asks whether to add another.

A common setup is `work` for your company plan and `personal` for your own. If the login did not change after the sign-in, yoink says so and saves nothing, so you cannot end up with two profiles for one account by accident.

Already signed in and only want a snapshot of the current account? `yoink save temp` captures the live Claude Code login under the name `temp`.

## Switch from the terminal or the menu bar

From the terminal, `yoink <name>` switches directly, and plain `yoink` opens the [interactive menu](../interactive-menu.md), where Enter switches to the highlighted account. On a Mac, the [menu bar app](../desktop.md) lists the same profiles, because it runs its own copy of the CLI against the same `profiles.json`.

On macOS the first switch triggers a Keychain permission prompt. Choose **Always Allow** so yoink is not asked again on every switch. The write itself goes through `security -i`, with the command sent on stdin and the credential hex-encoded, so the token never shows up in the arguments of a running process.

## Why the active login is re-saved first

Claude Code refreshes its token in the background, so the copy in your profile can go stale while you work. Before every switch, yoink reads the live credential back out and stores it in the active profile. It only does this when the live `oauthAccount` email (and account id, when both sides have one) matches that profile, so a login that belongs to another account is never written into the wrong profile. If writing the new identity fails halfway, yoink puts the previous live login back.

## Switching while Claude Code is running

A running session can write its old token back on its next refresh, which would undo the switch. When Claude Code is running, `yoink use` asks before switching, with "no" as the default. In a script with no terminal attached, it prints a warning and switches anyway, so quit Claude Code first and start it again after the switch.

## Doing it by hand with CLAUDE_CONFIG_DIR

Some people skip a switcher and give each account its own config directory, setting `CLAUDE_CONFIG_DIR` per shell. yoink does not manage those directories for you, but it respects the variable: when `CLAUDE_CONFIG_DIR` is set, yoink reads and writes `.claude.json` and `settings.json` inside it, matching Claude Code. On Linux and Windows it also reads and writes `.credentials.json` there. On macOS the credential stays in the single `Claude Code-credentials` Keychain entry whatever the variable says, so per-directory setups on a Mac still share one stored login. The [comparison of Claude Code account switchers](../compare/index.md) covers the other tools that take each approach.

## FAQ

### Do I need to log out of Claude Code to switch accounts?

No. yoink replaces the stored credential and the `oauthAccount` block directly, so there is no logout and no browser sign-in on a switch. You only sign in once per account, during `yoink add`.

### Will a refreshed token be lost when I switch?

No. The switch re-saves the live credential into the active profile first, as long as the live login belongs to that profile's account. The newer token is what you get back the next time you switch to it.

### Does yoink switch accounts automatically when I hit a rate limit?

No. yoink switches only when you run a command or press Enter in the menu. It does not watch usage, show quotas, or rotate accounts on its own.
