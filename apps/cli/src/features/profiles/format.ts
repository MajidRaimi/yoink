import pc from "picocolors";
import { theme } from "../../shared/theme";
import type { ExternalProfile, Profile } from "./types";

export const PROFILE_GROUP_TITLES: Readonly<Record<Profile["type"], string>> = {
  claude: "Claude Code",
  external: "Providers",
  codex: "ChatGPT (Codex)",
  kimi: "Kimi Code",
  gemini: "Gemini",
  copilot: "GitHub Copilot",
};

const externalLabel = (profile: ExternalProfile): string => {
  const models = profile.models ?? [];
  if (models.length <= 1) return `${profile.provider} · ${models[0]?.id ?? profile.model}`;
  const harnesses = Object.keys(profile.connections ?? {});
  const linked = harnesses.length > 0 ? ` · ${harnesses.join(", ")}` : "";
  return `${profile.provider} · ${models.length} models${linked}`;
};

export const accountLabel = (profile: Profile): string => {
  if (profile.type === "external") return externalLabel(profile);
  if (profile.type === "claude") return profile.account?.emailAddress ?? "unknown account";
  const plan = profile.identity.plan;
  return plan ? `${profile.identity.label} · ${plan}` : profile.identity.label;
};

export const switchedLine = (profile: Profile): string =>
  `${theme.success("✔")} Switched to ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`;

export const profileLine = (profile: Profile, isCurrent: boolean): string => {
  const marker = isCurrent ? theme.active("●") : pc.dim("○");
  const name = isCurrent ? theme.active(pc.bold(profile.name)) : pc.bold(profile.name);
  return `${marker} ${name.padEnd(24)} ${pc.dim(accountLabel(profile))}`;
};

export const groupHeading = (key: Profile["type"]): string => pc.bold(PROFILE_GROUP_TITLES[key]);
