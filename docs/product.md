# Product

Positioning, audience and voice for yoink and its site (yoink.codes, `apps/web`). This page stays in the repo and is not published on the site.

## Register

Brand, for an engineering audience.

## Purpose

Every AI coding login and provider, in one place.

yoink is an open source CLI for macOS, Linux and Windows, with a menu bar app for macOS. It does two jobs:

- **Switch subscription logins.** Save each Claude Code account once, plus ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins, then switch with Enter in the `yoink` menu. A switch re-snapshots the active login first, so a refreshed token is never lost.
- **Connect API-key providers.** Add a provider once (a preset or any OpenAI- or Anthropic-compatible base URL), pick its models, and tick the coding tools it should reach. yoink writes each tool's own config file across 13 harnesses: Claude Code, pi, omp, opencode, codex, Qwen Code, Kilo Code, Droid, Crush, Goose, Zed, Continue and Claude Desktop.

The site exists to show this mechanism working in under a minute, then get the visitor to install it. Success is a visitor who downloads the Mac app or runs the install one-liner, then reads the docs.

## Audience

Developers who live in coding agents every day. They are terminal-native, technically fluent and evaluate a tool by reading its exact commands, file paths and keys. Three situations bring them here:

1. **The rate-limited power user.** Runs more than one subscription because one plan's usage window is not enough. Hits the cap mid-session and wants to be on another account in seconds, without a browser re-login.
2. **The multi-provider operator.** Has API keys for OpenRouter, DeepSeek, a local Ollama or similar, and wants the same key and models available in several harnesses without editing each tool's config by hand.
3. **The Mac user who prefers a click.** Wants Claude account switching and provider setup from the menu bar instead of a terminal.

## The three acts

The landing page and the docs navigation tell the same story in three acts.

1. **Switch accounts.** "Hit the cap? Be on another account." Save each login once and switch with Enter. Covered by [Interactive menu](./interactive-menu.md) and [Subscriptions](./subscriptions.md).
2. **Bring any provider to any tool.** "One key. Thirteen harnesses." The add wizard walks preset, key, model search and harness checklist. Covered by [Providers](./providers.md) and [Harnesses](./harnesses.md).
3. **Terminal or menu bar.** "Same profiles. Terminal or menu bar." The CLI and the macOS app share `~/.config/yoink/profiles.json`. Covered by [Getting started](./getting-started.md) and [Desktop app](./desktop.md).

The menu bar app switches Claude accounts, saves the current login, adds providers, ticks harnesses, opens the login terminal and holds settings. It does not switch ChatGPT, Kimi, Gemini or Copilot logins, so no copy about the app may say it does. Those switch from the CLI only.

## Voice

- Second person, present tense. "Save each login once." not "Users can save logins."
- Name the mechanism. Paths, keys and commands go in mono: `~/.claude/settings.json`, `ANTHROPIC_BASE_URL`, `yoink add`, the `Claude Code-credentials` Keychain entry.
- Numbers are only counts of real things (13 harnesses, seven managed keys) or figures fetched at build time (npm downloads, GitHub stars, latest release). A figure whose fetch fails is left out, never estimated.
- Short declaratives. Dry humor at most; the name is the joke.
- One label per CTA intent across the whole site, the README and the app:

  | Intent | Label |
  | --- | --- |
  | Get the macOS app | Download for Mac |
  | Get the CLI | Install the CLI |
  | Go to documentation | Read the docs |
  | Go to the repo | Star on GitHub |

- No em or en dashes anywhere. Use periods, commas, colons or parentheses.

### Banned phrases

These fail `bun run --cwd apps/web check:slop` in site source, `README.md` and the prose of `docs/*.md`:

```text
supercharge
seamless
effortless
unleash
empower
magic
not just X, it's Y
say goodbye to
simply
just works
trusted by thousands
```

Also avoid hype verbs that promise to transform a workflow, invented stat rows, and testimonials.

## Principles

1. **The product shows itself.** Every act on the landing page is a live, keyboard-driven demo: a real React state machine fed by data generated from the CLI source (`HARNESS_ADAPTERS`, `PROVIDER_PRESETS`, `SUBSCRIPTION_BACKENDS`, `PROFILE_GROUP_TITLES`). No screenshots of terminals, no div mockups with invented rows. If the CLI changes, `bun run --cwd apps/web gen:data` changes the demos with it.
2. **The docs are rendered from `docs/*.md`.** There is one source. The site renders these files at build time, and GitHub renders the same files. Never copy docs into JSX.
3. **Technical words are the copy.** Keychain, `oauthAccount`, `/v1/models`, `settings.local.json`, the seven managed keys. Specificity is the persuasion.
4. **One accent, spent deliberately.** Yellow marks the primary action, the active row and the brand mark. Everything else is alpha-layered monochrome.
5. **Every claim traces to docs.** A sentence on the site, in the README or in the npm description must be supported by a page in `docs/` or by the source. If it is not documented, document it first or cut it.
6. **Fast is part of the brand.** Static export, self-hosted fonts, demos that render their final frame on the server, and motion that never blocks reading.

## Anti-references

- Generic SaaS landing pages: gradient text, glass cards, hero metric rows, hype copy.
- AI and crypto hype sites: particle or 3D backgrounds, purple and cyan gradients, animated blobs.
- Sparse one-liner pages that hide the mechanism. This audience wants to see how it works.
- Feature grids of identical cards with pastel icon tiles.
- Anything that would look out of place next to lazygit, fzf or the Bun docs.

## Accessibility and inclusion

WCAG 2.1 AA in both themes. Every demo works from the keyboard and by touch, announces its result in a live region, and stays interactive with reduced motion. The design targets live in [Design](./design.md).
