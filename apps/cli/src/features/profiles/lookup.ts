import type { ClaudeProfile, Profile } from "./types";

export const findClaudeProfileByEmail = (
  profiles: Profile[],
  email: string | null,
): ClaudeProfile | undefined => {
  if (!email) return undefined;
  return profiles.find(
    (profile): profile is ClaudeProfile =>
      profile.type === "claude" && profile.account?.emailAddress === email,
  );
};

export const hasProfileForEmail = (profiles: Profile[], email: string | null): boolean =>
  findClaudeProfileByEmail(profiles, email) !== undefined;
