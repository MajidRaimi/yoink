export const site = {
  name: "Yoink",
  version: "0.6.0",
  url: "https://yoink.codes",
  description:
    "Switch between Claude Code accounts from your terminal, fast. Snapshot logins into named profiles, swap them in a keystroke, and run open models through the same harness.",
  repo: "https://github.com/MajidRaimi/yoink",
  installCommand: "curl -fsSL https://yoink.codes/install.sh | bash",
  installCommandWindows: 'powershell -c "irm https://yoink.codes/install.ps1 | iex"',
  npmPackage: "yoink-cli",
  desktopVersion: "0.1.5",
  releasesUrl: "https://github.com/MajidRaimi/yoink/releases",
} as const;

export const desktopDmgUrl = (arch: "aarch64" | "x64") =>
  `https://github.com/MajidRaimi/yoink/releases/download/desktop-v${site.desktopVersion}/Yoink_${site.desktopVersion}_${arch}.dmg`;
