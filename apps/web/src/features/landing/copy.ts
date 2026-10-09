import { site } from "@/shared/brand/site";

export const HERO_COPY = {
  eyebrow: "Yoink for AI coding",
  headline: site.headline,
  subhead:
    "Yoink is an open source (MIT) CLI for macOS, Linux and Windows, plus a macOS menu bar app. It switches Claude Code accounts, swaps ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins inside their own tools, and connects API-key providers like OpenAI, OpenRouter, Kimi, DeepSeek, z.ai, Ollama or any compatible endpoint to 13 coding harnesses.",
} as const;

export const SWITCH_COPY = {
  eyebrow: "Switch",
  title: "Hit the cap? Be on another account.",
  body: "Save each Claude, Codex, Kimi, Gemini or Copilot login once. A switch re-snapshots the active login first, so a refreshed token is never lost.",
  links: [{ label: "Switch Codex, Kimi, Gemini and Copilot logins", slug: "subscriptions" }],
} as const;

export const PROVIDERS_COPY = {
  title: "One key. Thirteen harnesses.",
  body: "Add an API key once, pick its models, and tick the coding tools it should reach. yoink writes each tool's own config file.",
  steps: [
    { title: "Provider", detail: "A preset like OpenRouter or DeepSeek, or a custom base URL." },
    { title: "API key", detail: "Typed into a hidden input and stored once." },
    { title: "Models", detail: "Search the live model list and select as many as you like." },
    { title: "Harnesses", detail: "Tick the installed tools to connect and pick their default model." },
  ],
  links: [
    { label: "Provider presets and custom endpoints", slug: "providers" },
    { label: "What yoink writes into each of the 13 harnesses", slug: "harnesses" },
  ],
} as const;

export const SURFACES_COPY = {
  title: "Same profiles. Terminal or menu bar.",
  body: "The yoink CLI runs on macOS, Linux and Windows. The macOS menu bar app switches Claude accounts and adds providers from the same profiles.",
  links: [{ label: "The macOS menu bar app", slug: "desktop" }],
} as const;

export const SAFETY_COPY = {
  eyebrow: "Safety",
  title: "Touches seven keys. Leaves yours alone.",
  body: "Connecting a provider to Claude Code writes seven env keys. Switching back strips exactly those seven, and every other key stays put.",
} as const;

export const INSTALL_COPY = {
  title: "Install in one line.",
  body: "On macOS and Linux, the install script downloads the binary for your OS, verifies its SHA-256 checksum when the release ships one and installs it to /usr/local/bin or ~/.local/bin.",
} as const;

export const FINAL_COPY = {
  title: "Stop logging in and out.",
  body: "Save each login and API key once. Switch logins with Enter in the yoink menu, and connect keys from the same list.",
} as const;
