# yoink documentation

yoink is a cross-platform CLI (macOS, Linux, Windows) for switching between Claude Code accounts from your terminal. It stores each login as a named profile, swaps the stored credential (the macOS Keychain entry, or `~/.claude/.credentials.json` on Linux and Windows) and the identity block in `~/.claude.json` on demand, and can also point Claude Code at external providers (Anthropic-compatible endpoints) with a managed env block. yoink ships as a single Bun-compiled binary per platform. Package: [`yoink-cli`](https://www.npmjs.com/package/yoink-cli) on npm.

## Pages

| Page | What it covers |
| --- | --- |
| [Getting started](./getting-started.md) | Install, verify the version, add your first account. |
| [Usage](./usage.md) | Every command, its aliases, and what it does. |
| [Interactive menu](./interactive-menu.md) | The keymap and behavior of the account picker. |
| [External providers](./external-providers.md) | Add an Anthropic-compatible endpoint, the model picker, and global vs. per-project scope. |
| [How it works](./how-it-works.md) | Credential storage per platform, `~/.claude.json`, the switch sequence, and the files yoink touches. |
| [Development](./development.md) | Monorepo layout, build from source, and the release flow. |
| [Contributing](./contributing.md) | How to propose changes to the repo. |

## Elsewhere

- Live site: [https://yoink.codes](https://yoink.codes)
- npm package: [`yoink-cli`](https://www.npmjs.com/package/yoink-cli)
- Repo overview: [../README.md](../README.md)
