import { groupHeading, profileLine } from "./format";
import { groupProfiles, type ProfileOverview } from "./overview";

export const groupedProfileLines = (overview: ProfileOverview): string[] => {
  const groups = groupProfiles(overview);
  const showHeadings = groups.length > 1;
  return groups.flatMap((group, index) => {
    const rows = group.rows.map(({ profile, isCurrent }) => profileLine(profile, isCurrent));
    if (!showHeadings) return rows;
    const spacer = index === 0 ? [] : [""];
    return [...spacer, groupHeading(group.key), ...rows];
  });
};
