import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { BookText, Keyboard, PlugZap, Rocket, SquareTerminal, Workflow } from "lucide-react";

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
        description: "Install yoink and switch your first account.",
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
        title: "External providers",
        href: "/docs/external-providers",
        description: "Run OpenRouter, Ollama, or any Anthropic-compatible API.",
        icon: PlugZap,
      },
      {
        title: "How it works",
        href: "/docs/how-it-works",
        description: "Keychain snapshots, identity swaps, and env overrides.",
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
