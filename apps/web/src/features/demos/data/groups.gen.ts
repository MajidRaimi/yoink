export const PROFILE_GROUP_TITLES = {
  claude: "Claude Code",
  external: "Providers",
  codex: "ChatGPT (Codex)",
  kimi: "Kimi Code",
  gemini: "Gemini",
  copilot: "GitHub Copilot",
} as const;

export type ProfileGroupKey = keyof typeof PROFILE_GROUP_TITLES;

export type ProfileGroupTitle = (typeof PROFILE_GROUP_TITLES)[ProfileGroupKey];
