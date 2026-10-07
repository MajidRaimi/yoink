import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { BookText, KeyRound, Keyboard, Layers, PlugZap, Rocket, SquareTerminal, Workflow } from "lucide-react";

export type DocLink = {
  title: string;
  href: Route;
  description: string;
  icon: LucideIcon;
};

export type DocSection = {
  name: string;
  items: DocLink[];
};

export const docsSections: DocSection[] = [
  {
    name: "Guides",
    items: [
      {
        title: "Getting started",
        href: "/docs/getting-started",
        description: "Install Yoink and switch your first account.",
        icon: Rocket,
      },
      {
        title: "Usage",
        href: "/docs/usage",
        description: "Every command and how the workflows fit together.",
        icon: SquareTerminal,
      },
      {
        title: "Interactive menu",
        href: "/docs/interactive-menu",
        description: "The keyboard-driven account list and its keymap.",
        icon: Keyboard,
      },
      {
        title: "Providers",
        href: "/docs/providers",
        description: "Add an API key once: OpenAI, Kimi, OpenRouter, Ollama, or any compatible API.",
        icon: PlugZap,
      },
      {
        title: "Harnesses",
        href: "/docs/harnesses",
        description: "What Yoink writes into pi, opencode, codex, Claude Code, Qwen Code, Zed, and more.",
        icon: Layers,
      },
      {
        title: "Subscriptions",
        href: "/docs/subscriptions",
        description: "Switch ChatGPT (Codex), Kimi Code, Gemini, and GitHub Copilot logins.",
        icon: KeyRound,
      },
      {
        title: "How it works",
        href: "/docs/how-it-works",
        description: "Credential snapshots, identity swaps, and env overrides.",
        icon: Workflow,
      },
    ],
  },
  {
    name: "Reference",
    items: [
      {
        title: "CLI reference",
        href: "/reference",
        description: "Commands, aliases, arguments, and the menu keymap.",
        icon: BookText,
      },
    ],
  },
];

export const docsFlat: DocLink[] = docsSections.flatMap((section) => section.items);

export const navLinks: ReadonlyArray<{ label: string; href: Route }> = [
  { label: "Docs", href: "/docs/getting-started" },
  { label: "Reference", href: "/reference" },
];
