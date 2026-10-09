import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { site } from "@/shared/brand/site";
import type { DocSlug } from "@/shared/lib/routes";
import type { OgImageInput } from "./og";

export type OgCopy = Required<OgImageInput>;

export const PAGE_OG_COPY = {
  home: { title: site.headline, subtitle: site.description },
  download: {
    title: "Download Yoink",
    subtitle: "The menu bar app for macOS, and the yoink CLI for macOS, Linux and Windows.",
  },
  reference: {
    title: "CLI reference",
    subtitle: "Every yoink command, alias and flag, the menu keymap, and the tool, harness and preset ids.",
  },
  docs: {
    title: "Yoink docs",
    subtitle: "Switch accounts, connect one API key to 13 coding tools, and see exactly what yoink writes.",
  },
} as const satisfies Readonly<Record<string, OgCopy>>;

export const DOC_OG_FALLBACK = {
  "getting-started": {
    title: "Getting started",
    subtitle: "Install yoink, save your first login, and switch accounts in one command.",
  },
  desktop: {
    title: "Desktop app",
    subtitle: "The macOS menu bar app for Claude accounts, providers and harnesses.",
  },
  "interactive-menu": {
    title: "Interactive menu",
    subtitle: "The keyboard-driven yoink menu: move, switch, add, edit, save and delete.",
  },
  subscriptions: {
    title: "Subscriptions",
    subtitle: "Save and switch ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins.",
  },
  providers: {
    title: "Providers",
    subtitle: "Store an API key once and write it into every coding harness you connect.",
  },
  harnesses: {
    title: "Harnesses",
    subtitle: "What yoink writes into each of the 13 supported coding tools.",
  },
  "how-it-works": {
    title: "How it works",
    subtitle: "The credential store, the oauthAccount identity and the files a switch touches.",
  },
  security: {
    title: "Security",
    subtitle: "Where yoink keeps credentials, which files it writes, and what it leaves alone.",
  },
  usage: {
    title: "Usage",
    subtitle: "Every command, the shorthand for switching, and common examples.",
  },
} as const satisfies Readonly<Record<DocSlug, OgCopy>>;

export const DOCS_DIR = join(process.cwd(), "..", "..", "docs");

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

export const parseDocOgCopy = (source: string, fallback: OgCopy): OgCopy => {
  const { data } = matter(source);
  return {
    title: nonEmptyString(data.title) ?? fallback.title,
    subtitle: nonEmptyString(data.description) ?? fallback.subtitle,
  };
};

export const docOgCopy = (slug: DocSlug, docsDir: string = DOCS_DIR): OgCopy => {
  const fallback = DOC_OG_FALLBACK[slug];
  const file = join(docsDir, `${slug}.md`);
  if (!existsSync(file)) return fallback;
  return parseDocOgCopy(readFileSync(file, "utf8"), fallback);
};
