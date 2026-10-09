---
title: yoink vs clauth
seoTitle: "yoink vs clauth: Claude Code multi-account managers · Yoink"
description: "clauth is a deep Claude Code account manager with usage bars, auto-switch and parallel sessions. yoink is broader: five vendors' logins plus API keys."
nav: yoink vs clauth
order: 4
competitor:
  name: clauth
  url: https://github.com/uwuclxdy/clauth
  version: v0.17.0
  checked: "2026-10-10"
related:
  - docs/how-it-works.md
  - docs/subscriptions.md
---

# yoink vs clauth

Also at [yoink.codes/compare/clauth/](https://yoink.codes/compare/clauth/).

clauth is a Rust "Claude Code multi-account manager" with a TUI: it switches accounts with `clauth <name>`, shows live 5-hour and 7-day usage, falls back down a chain near a limit, and runs accounts in parallel. yoink is wider across tools: Kimi Code, Gemini and Copilot logins besides Claude Code and Codex, plus API-key providers for 13 harnesses.

## What each one swaps

Both tools keep a snapshot per account and swap it into place, so neither needs a browser sign-in on every switch. They capture different pieces of Claude Code's state.

| Piece of state | clauth | yoink |
| --- | --- | --- |
| Login token | [`~/.claude/.credentials.json`](https://github.com/uwuclxdy/clauth#how-it-works) | The `Claude Code-credentials` Keychain entry on macOS, `~/.claude/.credentials.json` on Linux and Windows ([how it works](../how-it-works.md#where-the-credential-lives)) |
| Account identity in `~/.claude.json` | Not documented | The `oauthAccount` block, restored with the token |
| `env` block of `~/.claude/settings.json` | [The whole block](https://github.com/uwuclxdy/clauth#how-it-works), per profile | Only the [seven managed keys](../security.md#seven-managed-keys-in-claude-code), when a provider is connected |
| Where snapshots live | [`~/.clauth/`](https://github.com/uwuclxdy/clauth#faq), `0600` on Unix | `~/.config/yoink/profiles.json`, `0600` |
| Several accounts at once | [`clauth start`](https://github.com/uwuclxdy/clauth#quickstart) runs `claude` against a per-profile config directory | No |

One consequence: an API endpoint is part of a clauth profile, while in yoink it is a separate provider profile. Switching yoink back to a Claude account strips the seven keys and restores the login, as [How it works](../how-it-works.md#providers) describes.

Codex works differently too. clauth runs `codex` under each profile in its own `CODEX_HOME`, with a separate rotation chain. yoink switches `auth.json` (or the `Codex Auth` Keychain entry on macOS) inside your one Codex home:

```bash
yoink save codex-work --tool codex
yoink use codex-work
```

## Feature by feature

| Feature | clauth | yoink |
| --- | --- | --- |
| Save and switch Claude Code accounts | [Yes](https://github.com/uwuclxdy/clauth#quickstart) | [Yes](../guides/switch-claude-code-accounts.md) |
| Live 5-hour and 7-day usage bars | [Yes](https://github.com/uwuclxdy/clauth#features) | No |
| Automatic switching along a fallback chain | [Yes](https://github.com/uwuclxdy/clauth#features) | No |
| Parallel sessions under different accounts | [Yes](https://github.com/uwuclxdy/clauth#features) | No |
| MCP plugin to switch or delegate from inside Claude Code | [Yes](https://github.com/uwuclxdy/clauth#claude-code-plugin) | No |
| Headless daemon with a REST API | [Yes](https://github.com/uwuclxdy/clauth#features) | No |
| Browse and resume past sessions | [Yes](https://github.com/uwuclxdy/clauth#features) | No |
| ChatGPT (Codex) logins | [Yes](https://github.com/uwuclxdy/clauth#features) | [Yes](../subscriptions.md#chatgpt-codex) |
| Kimi Code, Gemini and GitHub Copilot logins | Not documented | [Yes](../subscriptions.md#supported-tools) |
| API-key providers written into other coding agents | Not documented | [Yes](../harnesses.md#supported-harnesses), 13 harnesses |
| Windows | [Yes](https://github.com/uwuclxdy/clauth#install), through Git Bash or MSYS2 | [Yes](../getting-started.md#install), PowerShell installer |
| macOS menu bar app | Not documented | [Yes](../desktop.md) |
| Install | [`cargo install clauth` or a curl script](https://github.com/uwuclxdy/clauth#install) | [curl, PowerShell or `npm install -g yoink-cli`](../getting-started.md#install), DMG for the app |
| License | MIT | MIT |

clauth's daemon publishes a `status.json` that a menu bar app can read; its README does not ship one. yoink's menu bar app switches Claude accounts and providers only, and its other logins switch from the CLI.

## Choose clauth if

- Claude Code is your main tool and you want each account's usage in front of you.
- You want switching to happen on its own before a limit stops a long run, with weekly and spend gates.
- You run several accounts at the same time, or hand a prompt to another account from inside a session.
- You want a headless daemon you can reach over HTTPS.

## Choose yoink if

- You also switch Kimi Code, Gemini or GitHub Copilot logins, and want one command for all of them.
- You want an API key from OpenRouter, DeepSeek, Ollama or any compatible URL written into opencode, codex, Crush and the rest.
- You are on Windows without Git Bash, or want a Mac menu bar app.

## Can you use both?

Yes, if one of them owns Claude Code. Both rewrite Claude Code's live login and the `env` block of `~/.claude/settings.json`, and each keeps its own idea of the active account, so switching with one leaves the other out of date. A split that works: clauth for Claude Code accounts and usage, yoink for providers in other harnesses and the Kimi Code, Gemini and Copilot logins.

## FAQ

### Can both tools point Claude Code at a custom API endpoint?

Yes. A clauth profile can hold an API endpoint and key instead of an OAuth login. yoink adds the endpoint as a provider and writes seven managed keys into `~/.claude/settings.json`, or into `./.claude/settings.local.json` when you choose **This project only**, leaving your global setup alone.

### Can yoink run two Claude Code accounts at the same time?

No. yoink swaps one live login per machine, and yoink's docs recommend restarting Claude Code after a switch. If you set `CLAUDE_CONFIG_DIR` per shell yourself, yoink follows it, but it does not launch sessions the way `clauth start` does.
