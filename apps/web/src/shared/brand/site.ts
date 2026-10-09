import type { DesktopReleaseInfo } from "@/shared/contract";
import release from "./release.gen.json";

export const site = {
  name: "Yoink",
  version: "0.6.5",
  url: "https://yoink.codes",
  title: "Yoink: switch AI coding accounts and providers",
  headline: "Every AI coding login and provider, in one place.",
  description:
    "Switch Claude, Codex, Kimi, Gemini and Copilot logins, and connect API keys to 13 coding tools.",
  author: "Majid Raimi",
  authorUrl: "https://github.com/MajidRaimi",
  repo: "https://github.com/MajidRaimi/yoink",
  releasesUrl: "https://github.com/MajidRaimi/yoink/releases",
  issuesUrl: "https://github.com/MajidRaimi/yoink/issues",
  npmPackage: "yoink-cli",
  npmUrl: "https://www.npmjs.com/package/yoink-cli",
  installCommand: "curl -fsSL https://yoink.codes/install.sh | bash",
  installCommandWindows: 'powershell -c "irm https://yoink.codes/install.ps1 | iex"',
  installCommandNpm: "npm install -g yoink-cli",
} as const;

export const desktopRelease: DesktopReleaseInfo = release.desktop;
