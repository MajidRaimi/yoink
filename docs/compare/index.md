---
title: Claude Code account switchers compared
seoTitle: "Claude Code account switchers compared (2026) · Yoink"
description: "An honest comparison of claude-swap, clauth, swapdex, Claude Switcher, CCSwitcher and yoink: platforms, other tools, usage display, auto-switch, license."
nav: Overview
order: 1
checked: "2026-10-10"
related:
  - docs/guides/switch-claude-code-accounts.md
  - docs/how-it-works.md
---

# Claude Code account switchers compared

Also at [yoink.codes/compare/](https://yoink.codes/compare/).

Several open source tools switch Claude Code accounts, and they split along two lines: switchers built around Claude Code usage and rotation (claude-swap, and clauth, which also handles Codex), and tools that cover more vendors and API-key providers. yoink is in the second group. This page compares six of them from their own READMEs.

## What every switcher has to change

Claude Code keeps one login per machine, in two places: a credential blob (the `Claude Code-credentials` Keychain entry on macOS, or `~/.claude/.credentials.json` on Linux and Windows) and an `oauthAccount` identity block in `~/.claude.json`. A switcher either swaps both of those for you, or gives each account its own config directory so nothing has to be swapped. yoink's docs recommend restarting Claude Code after a switch, and [How it works](../how-it-works.md) walks through the swap that yoink does. Some switchers, such as claude-swap and CCSwitcher, document that a running session picks up the new login on its own.

## Without a switcher

You can keep accounts apart by hand: give each one its own config directory and set `CLAUDE_CONFIG_DIR` in the shell that runs it. That costs nothing to install. The price is bookkeeping: one directory per account, a shell alias per directory, and settings you have to keep in step yourself. Some of the tools below automate exactly that pattern, while others swap a single login in place.

## The tools side by side

| Tool | Kind | Platforms | Other tools' logins | API keys into other agents | Usage display | Automatic switching | License |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [claude-swap](https://github.com/realiti4/claude-swap) | Python CLI and TUI, optional macOS menu bar | Windows, macOS, Linux and WSL | No | Not documented | Yes | Yes | MIT |
| [clauth](https://github.com/uwuclxdy/clauth) | Rust CLI and TUI | Linux, macOS, Windows through Git Bash or MSYS2 | Yes (Codex) | Not documented | Yes | Yes | MIT |
| [swapdex](https://github.com/youdie006/swapdex) | Rust CLI with a shim and a local proxy | Linux, WSL, macOS | Yes (Codex, Gemini CLI, Antigravity) | Not documented | Yes | No | MIT |
| [Claude Switcher](https://github.com/Symbioose/claude-account-switcher) | macOS menu bar app | macOS 12 or later | Yes (Codex) | Not documented | Yes | Yes | MIT |
| [CCSwitcher](https://github.com/XueshiQiao/CCSwitcher) | Native SwiftUI menu bar app | macOS 14 or later | Not documented | Not documented | Yes | Not documented | Not documented |
| [yoink](https://yoink.codes/) | CLI plus a macOS menu bar app | macOS, Linux, Windows (app: macOS 12 or later) | Yes (Codex, Kimi Code, Gemini, Copilot) | Yes (13 harnesses) | No | No | MIT |

Every cell comes from the linked README on the date at the top of this page. "Not documented" means the README does not say, not that the feature is missing. Two notes the table cannot hold: swapdex describes itself as "a hint, not a quota-dodging auto-rotator", and offers proxy failover only when you configure it. Claude Switcher's automatic switching is off by default and triggers at 100% of a window.

## Pick by situation

- **You only use Claude Code and want limits handled for you.** claude-swap and clauth both show 5-hour and 7-day usage and switch on their own near a limit. clauth adds parallel isolated sessions; claude-swap adds `cswap run` for a second account in one terminal. See [yoink vs claude-swap](./claude-swap.md) and [yoink vs clauth](./clauth.md).
- **You want each account in its own directory, never copied.** swapdex keeps a permanent login directory per Claude Code or Codex account and routes requests through a local proxy.
- **You want a Mac menu bar with usage at a glance.** CCSwitcher and Claude Switcher both show usage in the menu bar; Claude Switcher also switches Codex.
- **You use several vendors, or API keys in several agents.** yoink switches Claude Code, ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins from one CLI, and writes API-key providers into 13 coding harnesses. It shows no usage and never switches on its own.

## Where CC Switch and Claude Code Router fit

[CC Switch](https://github.com/farion1231/cc-switch) often comes up in the same searches, but it solves a neighbouring problem: it is a desktop app that switches API providers across ten coding tools, with a local routing proxy, MCP, skills and prompts management, and a usage dashboard. Its README does not describe saving several Claude Code subscription logins, so it is not in the table above. [yoink vs CC Switch](./cc-switch.md) compares the provider side.

[Claude Code Router](https://github.com/musistudio/claude-code-router) is a local gateway: coding agents send requests to it, and it routes each one to a provider. Its README does not describe switching subscription logins either. [yoink vs Claude Code Router](./claude-code-router.md) covers the gateway versus native config trade.

## FAQ

### Which Claude Code account switchers run on Windows?

Of the tools above, claude-swap and yoink list native Windows support, and clauth runs on Windows through Git Bash or MSYS2. swapdex lists Linux, WSL and macOS. Claude Switcher and CCSwitcher are macOS menu bar apps.

### Which switchers show Claude Code usage limits?

claude-swap, clauth, swapdex, Claude Switcher and CCSwitcher all show usage in some form, most as 5-hour and 7-day windows. yoink does not show usage or quotas.
