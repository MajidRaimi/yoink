# yoink documentation

yoink keeps every AI coding login and provider in one place. It is a cross-platform CLI (macOS, Linux, Windows) plus a macOS menu bar app. It switches Claude Code accounts, switches ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins inside their own tools, and connects API-key providers (OpenAI, Kimi, OpenRouter, Ollama, or any OpenAI- or Anthropic-compatible API) to 13 coding harnesses: pi, omp, opencode, codex, Claude Code, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue, and Claude Desktop. For Claude Code it swaps the stored credential (the macOS Keychain entry, or `~/.claude/.credentials.json` on Linux and Windows) and the identity block in `~/.claude.json` on demand. yoink ships as a single Bun-compiled binary per platform. Package: [`yoink-cli`](https://www.npmjs.com/package/yoink-cli) on npm.

The pages below are also published at [yoink.codes/docs](https://yoink.codes/docs/), in the same order.

## Pages

| Page | What it covers |
| --- | --- |
| [Getting started](./getting-started.md) | Install, verify the version, add your first account. |
| [Desktop app](./desktop.md) | The macOS menu bar app: install, profiles, the provider wizard, the harness checklist, settings, and updates. |
| [Interactive menu](./interactive-menu.md) | The keymap and behavior of the account picker. |
| [Subscriptions](./subscriptions.md) | Saving and switching ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins, each inside its own tool. |
| [Providers](./providers.md) | Presets, custom providers and endpoint probing, model selection, key storage, and Claude Code scope. |
| [Harnesses](./harnesses.md) | What yoink writes into each supported harness (pi, opencode, codex, Claude Code, Qwen Code, Zed, and more), backups, import, and the connect commands. |
| [How it works](./how-it-works.md) | Credential storage per platform, `~/.claude.json`, the switch sequence, subscription logins, providers, and the files yoink touches. |
| [Security](./security.md) | Atomic owner-only writes, kept symlinks, one-time backups, the seven managed keys, git-tracked configs, and keeping secrets off argv and out of JSON. |
| [Usage](./usage.md) | Every command, its aliases, and what it does. |

### In the repo only

| Page | What it covers |
| --- | --- |
| [Development](./development.md) | Monorepo layout, build from source, and the release flow. |
| [Contributing](./contributing.md) | How to propose changes to the repo. |
| [Design](./design.md) | The visual system for the yoink.codes site. |
| [Product](./product.md) | Product positioning and voice for the site. |

## Elsewhere

- Live site: [https://yoink.codes](https://yoink.codes)
- npm package: [`yoink-cli`](https://www.npmjs.com/package/yoink-cli)
- Repo overview: [../README.md](../README.md)
