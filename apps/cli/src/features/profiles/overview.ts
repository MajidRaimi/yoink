import { accountLabel } from "./format";
import { loadStore } from "./store";
import { SUBSCRIPTION_TOOLS, type Profile, type ProfileStore } from "./types";

export type ProfileGroupKey = Profile["type"];

export type ProfileOverview = Pick<ProfileStore, "current" | "currentByTool"> & { profiles: Profile[] };

export type ProfileRow = { profile: Profile; isCurrent: boolean };

export type ProfileGroup = { key: ProfileGroupKey; rows: ProfileRow[] };

export type AccountSummary = { name: string; type: ProfileGroupKey; label: string; current: boolean };

export const PROFILE_GROUP_ORDER: readonly ProfileGroupKey[] = ["claude", "external", ...SUBSCRIPTION_TOOLS];

export const currentNameFor = (overview: ProfileOverview, key: ProfileGroupKey): string | null => {
  if (key === "claude" || key === "external") return overview.current;
  return overview.currentByTool?.[key] ?? null;
};

export const isCurrentProfile = (overview: ProfileOverview, profile: Profile): boolean =>
  currentNameFor(overview, profile.type) === profile.name;

export const groupProfiles = (overview: ProfileOverview): ProfileGroup[] =>
  PROFILE_GROUP_ORDER.map((key) => ({
    key,
    rows: overview.profiles
      .filter((profile) => profile.type === key)
      .map((profile) => ({ profile, isCurrent: isCurrentProfile(overview, profile) })),
  })).filter((group) => group.rows.length > 0);

export const accountSummaries = (overview: ProfileOverview): AccountSummary[] =>
  groupProfiles(overview).flatMap((group) =>
    group.rows.map(({ profile, isCurrent }) => ({
      name: profile.name,
      type: profile.type,
      label: accountLabel(profile),
      current: isCurrent,
    })),
  );

export const toProfileOverview = (store: ProfileStore): ProfileOverview => ({
  current: store.current,
  currentByTool: store.currentByTool,
  profiles: Object.values(store.profiles),
});

export const loadProfileOverview = async (): Promise<ProfileOverview> => toProfileOverview(await loadStore());

export const currentOverview = (overview: ProfileOverview, tool?: ProfileGroupKey): ProfileOverview => ({
  ...overview,
  profiles: overview.profiles.filter((profile) => {
    if (!isCurrentProfile(overview, profile)) return false;
    if (tool === undefined) return true;
    if (tool === "claude" || tool === "external") return profile.type === "claude" || profile.type === "external";
    return profile.type === tool;
  }),
});
