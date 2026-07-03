export const site = {
  name: "yoink",
  version: "0.6.0",
  url: "https://yoink.codes",
  description:
    "Switch between Claude Code accounts from your terminal, fast. Snapshot logins into named profiles, swap them in a keystroke, and run open models through the same harness.",
  repo: "https://github.com/MajidRaimi/yoink",
  installCommand: "curl -fsSL https://yoink.codes/install.sh | bash",
  installCommandWindows: 'powershell -c "irm https://yoink.codes/install.ps1 | iex"',
  npmPackage: "yoink-cli",
} as const;
