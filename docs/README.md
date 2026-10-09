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

### Guides, harnesses, providers and comparisons

These pages live in subfolders of `docs/` and are published at their own URLs on yoink.codes. Each one starts with a link to its published copy.

| Page | Published at | What it covers |
| --- | --- | --- |
| [Switch between Claude Code accounts](./guides/switch-claude-code-accounts.md) | `/guides/switch-claude-code-accounts/` | Saving work and personal Claude Code logins and switching without logging out. |
| [Use any provider in pi](./harnesses/pi.md) | `/harnesses/pi/` | What yoink writes into pi's `models.json` and `settings.json`. |
| [Use OpenRouter in your coding agents](./providers/openrouter.md) | `/providers/openrouter/` | The `openrouter` preset: endpoints, the agents it reaches, and Claude Code. |
| [Claude Code account switchers compared](./compare/index.md) | `/compare/` | claude-swap, clauth, swapdex, Claude Switcher, CCSwitcher and yoink side by side. |
| [yoink vs claude-swap](./compare/claude-swap.md) | `/compare/claude-swap/` | Where each tool fits, feature by feature. |
| [Frequently asked questions](./faq.md) | `/faq/` | Short answers about accounts, providers, files, platforms and troubleshooting. |

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
