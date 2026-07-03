import pc from "picocolors";
import { theme } from "../../shared/theme";
import type { Profile } from "./types";

export const accountLabel = (profile: Profile): string => {
  if (profile.type === "external") return `${profile.provider} · ${profile.model}`;
  return profile.account?.emailAddress ?? "unknown account";
};

export const switchedLine = (profile: Profile): string =>
  `${theme.success("✔")} Switched to ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`;

export const profileLine = (profile: Profile, isCurrent: boolean): string => {
  const marker = isCurrent ? theme.active("●") : pc.dim("○");
  const name = isCurrent ? theme.active(pc.bold(profile.name)) : pc.bold(profile.name);
  return `${marker} ${name.padEnd(24)} ${pc.dim(accountLabel(profile))}`;
};
