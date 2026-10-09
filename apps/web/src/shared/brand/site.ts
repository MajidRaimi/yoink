import type { DesktopReleaseInfo } from "@/shared/contract";
import release from "./release.gen.json";

export const site = {
  name: "Yoink",
  qualifiedName: "Yoink for AI coding",
  version: release.cli,
  url: "https://yoink.codes",
  title: "Yoink, the AI coding account and provider switcher",
  titleSuffix: "Yoink CLI",
  metaDescription:
    "Switch Claude Code accounts and Codex, Kimi, Gemini or Copilot logins, and connect API-key providers to 13 coding agents. MIT CLI for macOS, Linux, Windows.",
  headline: "Every AI coding login and provider, in one place.",
  description:
    "Switch Claude, Codex, Kimi, Gemini and Copilot logins, and connect API-key providers to 13 coding harnesses.",
  author: "Majid Raimi",
  authorUrl: "https://github.com/MajidRaimi",
  repo: "https://github.com/MajidRaimi/yoink",
  releasesUrl: "https://github.com/MajidRaimi/yoink/releases",
  issuesUrl: "https://github.com/MajidRaimi/yoink/issues",
  licenseUrl: "https://opensource.org/licenses/MIT",
  npmPackage: "yoink-cli",
  npmUrl: "https://www.npmjs.com/package/yoink-cli",
  installCommand: "curl -fsSL https://yoink.codes/install.sh | bash",
  installCommandWindows: 'powershell -c "irm https://yoink.codes/install.ps1 | iex"',
  installCommandNpm: "npm install -g yoink-cli",
  verification: {
    google: "",
    bing: "",
  },
} as const;

export const desktopRelease: DesktopReleaseInfo = release.desktop;
