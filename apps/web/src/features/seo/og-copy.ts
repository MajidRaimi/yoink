import { site } from "@/shared/brand/site";
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
    subtitle: "Switch accounts, connect API keys to 13 coding tools, and see exactly what yoink writes.",
  },
} as const satisfies Readonly<Record<string, OgCopy>>;
