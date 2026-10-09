import type { ProfileGroupData, ProfileGroupKey } from "@/shared/contract";

export const PROFILE_GROUP_TITLES = {
  claude: "Claude Code",
  external: "Providers",
  codex: "ChatGPT (Codex)",
  kimi: "Kimi Code",
  gemini: "Gemini",
  copilot: "GitHub Copilot",
} as const satisfies ProfileGroupData;

export type ProfileGroupTitle = (typeof PROFILE_GROUP_TITLES)[ProfileGroupKey];
