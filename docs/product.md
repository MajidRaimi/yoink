# Product

## Register

brand

## Users

Developers who live in Claude Code daily. Two personas drive every page:

1. **The rate-limited power user.** Runs multiple Claude subscriptions because one plan's usage window is not enough. Hits the cap mid-session and wants to hop to a second account in seconds, from the terminal, without a browser re-login.
2. **The open-model operator.** Wants open or hosted models (Ollama local, OpenRouter, GLM, DeepSeek, Kimi) running inside the Claude Code harness. Knows what `ANTHROPIC_BASE_URL` does and wants a tool that manages those env overrides per profile and per project.

Both are terminal-native, technically fluent, and allergic to marketing fluff. They evaluate tools by reading exact commands, file paths, and mechanisms.

## Product Purpose

yoink is a macOS CLI (Bun, single compiled binary) that snapshots Claude Code logins (Keychain credential blob + `oauthAccount` identity) into named profiles and swaps them in a keystroke, and registers Anthropic-compatible external providers as switchable profiles via managed `settings.json` env blocks. The site (yoink.codes) exists to convince these two personas in under a minute that the mechanism is sound, then get them to the install command and docs. Success: visitor runs the install command.

## Brand Personality

Precise, terminal-native, quietly confident. The site should feel like a well-crafted tool, not a startup pitch: real commands, real file paths, real key names. Black surface, yellow signal, the same palette as the CLI itself (the product and its site share one theme). Humor stays dry and minimal (the name is the joke).

## Anti-references

- Generic SaaS landing pages: gradient text, glassmorphism cards everywhere, hero metrics, "supercharge your workflow" copy.
- Crypto/AI hype sites: particle backgrounds, purple-cyan gradients, animated blobs.
- Sparse minimal one-liner pages that hide the mechanism; this audience wants to see how it works.
- Anything that would look wrong next to lazygit, fzf, or the Bun docs.

## Design Principles

1. **Show the terminal, not screenshots of it.** The product is a TUI; render it in live HTML/CSS with the CLI's exact colors and keymap.
2. **Technical words are the copy.** Keychain, `oauthAccount`, `ANTHROPIC_BASE_URL`, `/v1/models`, `settings.local.json` precedence. Specificity is the persuasion.
3. **One accent, spent deliberately.** Yellow marks interaction and brand moments; everything else is alpha-layered monochrome (the RunPod surface recipe, transposed).
4. **Fast is part of the brand.** Fully static export, self-hosted fonts, motion that never blocks reading, zero runtime requests to third parties.
5. **The docs are the product tour.** Each docs page is hand-built JSX with the same components as the landing; no rendered-markdown feel.

## Accessibility & Inclusion

WCAG 2.1 AA: body text ≥4.5:1 in both themes (yellow-700 `#a16207` for accent text on light, never yellow-400 on white), large text ≥3:1, visible focus states on all interactive elements, full keyboard navigability, `prefers-reduced-motion` honored on every animation (crossfade or instant fallback), semantic landmarks and heading order, theme toggle works without View Transitions support.
