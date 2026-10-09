import { theme } from "../../shared/theme";
import { accountLabel, PROFILE_GROUP_TITLES } from "../profiles/format";
import { groupProfiles, type ProfileOverview } from "../profiles/overview";
import type { ListOption } from "./action-list";

export const toListOptions = (overview: ProfileOverview): ListOption[] => {
  const groups = groupProfiles(overview);
  const labelGroups = groups.length > 1;
  return groups.flatMap((group) =>
    group.rows.map(({ profile, isCurrent }) => ({
      name: profile.name,
      label: isCurrent ? theme.active(profile.name) : profile.name,
      hint: accountLabel(profile),
      isCurrent,
      group: labelGroups ? PROFILE_GROUP_TITLES[group.key] : undefined,
      enterLabel: profile.type === "external" ? "connect" : "switch",
    })),
  );
};
