---
title: Frequently asked questions
seoTitle: "Yoink FAQ: AI coding accounts, providers and harnesses"
description: "Answers about yoink: switching Claude Code and Codex accounts, which providers reach which coding agents, where keys are stored, platforms and the license."
nav: FAQ
order: 1
---

# Frequently asked questions

Also at [yoink.codes/faq/](https://yoink.codes/faq/).

yoink is an open source CLI for macOS, Linux and Windows, plus a macOS menu bar app, that switches AI coding logins and connects API-key providers to 13 coding harnesses. These are the questions people ask most, each answered in a few sentences with a link to the page that covers it in full.

## About yoink

### What is yoink?

yoink keeps every AI coding login and provider in one place. It switches Claude Code accounts, switches ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins inside their own tools, and writes API keys from presets or any compatible URL into up to 13 coding harnesses, depending on the endpoints the provider speaks. See [Getting started](./getting-started.md).

### Is this the Yoink app for Mac or the yoink-cli on PyPI?

No. Yoink for AI coding (yoink.codes, `yoink-cli` on npm, github.com/MajidRaimi/yoink) switches AI coding logins and providers. The Mac drag-and-drop shelf app and the PyPI media downloader are unrelated projects that happen to share the name. Install this one with `npm install -g yoink-cli` or the [install script](./getting-started.md#install).

## Switching accounts

### How do I switch between Claude Code accounts without logging out?

Run `yoink add` once per account to save each login, then move between them with `yoink use personal` (or the shortcut `yoink work`). Each switch stores the current login back into its profile before writing the target account's credential and identity, so you stay signed in. Restart Claude Code afterward. The [Claude Code accounts guide](./guides/switch-claude-code-accounts.md) has the details.

### Where does Claude Code store its login?

On macOS, in the Keychain entry `Claude Code-credentials`. On Linux and Windows, in the plaintext file `~/.claude/.credentials.json`. The account identity lives separately, in the `oauthAccount` block of `~/.claude.json`, and a yoink profile stores both halves together. See [How it works](./how-it-works.md#where-the-credential-lives).

### Can I switch Codex, Gemini, Kimi Code or Copilot accounts too?

Yes, from the CLI. Save each login with `yoink add` or `yoink save <name> --tool <tool>`, then switch with `yoink use <name>`. Each tool switches inside its own login home only, and yoink never copies a subscription token into another tool. See [Subscriptions](./subscriptions.md).

### Does the Mac app switch Codex logins?

No. The menu bar app switches Claude Code accounts, saves the current Claude login and manages API-key providers. ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins switch from the CLI only today, with `yoink use <name>`. See [Desktop app](./desktop.md).

### Does yoink track usage or rotate accounts on limits?

No. Every switch is one you start yourself, from a `yoink use` command, the interactive menu or the menu bar app. yoink has no view of your remaining quota and never picks a different account for you when a limit arrives. The [switcher comparison](./compare/index.md) lists tools that do.

## Providers and harnesses

### How do I use one API key in several coding agents?

Add the key once with `yoink add`, pick a preset or a custom URL, choose models, and tick the harnesses. Later, `yoink connect <name> --to pi,opencode,codex` adds more. yoink writes each harness's own config file and re-syncs them all when the key or models change. See [Providers](./providers.md).

### Which harnesses are supported?

Thirteen: pi, omp, opencode, codex, Claude Code, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue and Claude Desktop. Goose, Zed and Claude Desktop are experimental, so check the notice yoink prints after connecting them. The [harness table](./harnesses.md#supported-harnesses) lists each config path.

### Can I use OpenRouter or DeepSeek in Claude Code?

Yes. Both presets have an Anthropic Messages endpoint, which is what Claude Code needs. Connecting one writes seven managed env keys into `~/.claude/settings.json`, and switching back to a Claude account strips them again. The `ollama` preset cannot be used there. See [Claude Code is exclusive](./providers.md#claude-code-is-exclusive).

### Why can't codex use my OpenRouter key?

codex reaches custom providers only through the OpenAI Responses API. The `openrouter` preset offers OpenAI Chat and Anthropic Messages, not Responses, so codex shows "needs an OpenAI Responses endpoint". The `openai` preset is the one preset codex accepts. See [codex is responses-only](./harnesses.md#codex-is-responses-only).

### Does yoink run a proxy or convert between API formats?

No. yoink edits the harness configs and then exits, leaving nothing running between your agent and the provider. Because nothing translates requests, a provider can only serve harnesses that already speak one of its protocols. Claude Code Router routes requests through a local gateway, and CC Switch can do the same in its optional Routing mode. See [yoink vs Claude Code Router](./compare/claude-code-router.md) and [yoink vs CC Switch](./compare/cc-switch.md).

### What is the difference between Kimi Code login switching and the kimi-code preset?

Login switching swaps the Kimi Code subscription files in `~/.kimi-code/credentials/` and only affects Kimi Code itself; the token never leaves that tool. The `kimi-code` preset is an API key, written into other harnesses through `https://api.kimi.com/coding/v1` (OpenAI Chat) or `https://api.kimi.com/coding` (Anthropic Messages). Compare [Subscriptions](./subscriptions.md#kimi-code) and the [preset table](./providers.md#presets).

## Security and files

### Does yoink send my keys anywhere?

Only to the provider the key belongs to, when yoink probes that endpoint or asks it for a model list. The model limits come from the public [models.dev](https://models.dev) catalog, which yoink downloads with no key attached and keeps for a day. Keys stay in `~/.config/yoink/profiles.json` and the harness configs you connect. See [Security](./security.md).

### What happens to my existing config?

Before its first edit to a harness config you already have, yoink saves the untouched file as `<file>.yoink.bak`, and later runs leave that copy alone. Every later write is atomic and owner-only, and yoink only touches the entries it owns. Claude Code's `settings.json` gets no backup, because only seven keys change. See [Backups](./harnesses.md#backups).

### Will yoink commit my key to git?

Not by accident. Before writing a key, yoink checks whether git tracks the config file it is about to change. The interactive flow names the tracked files and asks first; `yoink add --external` and `yoink connect` refuse unless you pass `--allow-tracked`. Backups inside a repo are added to `.git/info/exclude`. See [Git-tracked configs](./security.md#git-tracked-configs).

### Can I script yoink without exposing my key?

Yes. Pass `--token-stdin` to `yoink add --external`, `yoink edit` or `yoink probe` and pipe the key in, which keeps it out of both your shell history and anything that lists running processes. The `--json` output of `yoink list`, `yoink harnesses` and `yoink status` never includes a token or key. See [Keys stay off the command line](./security.md#keys-stay-off-the-command-line).

## Install and platforms

### Is yoink free, and which platforms does it support?

Yes. yoink is open source under the [MIT license](../LICENSE). There are CLI builds for Intel and Apple Silicon Macs, for x64 and arm64 Linux with either glibc or musl, and for x64 and arm64 Windows. The menu bar app needs macOS 12 or later. See [Supported platforms](./getting-started.md#supported-platforms).

### How do I install yoink?

On macOS and Linux run `curl -fsSL https://yoink.codes/install.sh | bash`. On Windows run the PowerShell installer from [Getting started](./getting-started.md#install). On any OS with Node, `npm install -g yoink-cli` works too. The Mac app is a DMG from the download page.

## Troubleshooting

### macOS keeps asking for Keychain access. What do I do?

That prompt is macOS guarding the Keychain item that holds your Claude Code login. Answer it with **Always Allow** once and later switches run quietly; picking plain Allow means you see it again next time. The menu bar app triggers the same prompt. On Linux and Windows the login is a file, so nothing asks. See [How it works](./how-it-works.md#notes).

### Why did my switch not stick?

A running tool can write its old token back on its next refresh. Quit Claude Code before switching and start it again afterward. For Codex, Kimi Code, Gemini and Copilot, yoink asks first when the tool is running, and a script must pass `--force`. See [What a switch does](./subscriptions.md#what-a-switch-does).

### Why does yoink refuse to switch my Codex login on Linux?

On Linux, yoink does not support the Secret Service keyring yet, so it refuses instead of guessing when Codex keeps its login there. Set `cli_auth_credentials_store = "file"` in `~/.codex/config.toml`, run `codex login` again so Codex writes `auth.json`, then retry the switch. See [ChatGPT (Codex)](./subscriptions.md#chatgpt-codex).

### Why does yoink refuse to manage my Gemini login?

Two setups block it: `GEMINI_FORCE_ENCRYPTED_FILE_STORAGE=true`, or a login kept in `gemini-credentials.json`. In both cases the credential is not a portable file yoink can copy out and put back, so it refuses. Unset the variable and log in again with `/auth`, so Gemini keeps the login in `oauth_creds.json`, which yoink can switch. See [Gemini](./subscriptions.md#gemini).

### Why does yoink warn about a crushrc file after connecting Crush?

When a `crushrc` file sits next to `crush.json`, it may override the provider yoink just wrote, so yoink prints a notice instead of failing. If Crush reads that file instead of `crush.json` and does not pick up the new provider, add the provider to `crushrc` too. See the [Crush notes](./harnesses.md#the-newer-harnesses).
