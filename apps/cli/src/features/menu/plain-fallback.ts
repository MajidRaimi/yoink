import pc from "picocolors";
import { groupedProfileLines } from "../profiles/grouped-lines";
import type { ProfileOverview } from "../profiles/overview";

export const printPlainFallback = (overview: ProfileOverview): void => {
  if (overview.profiles.length === 0) {
    console.log(pc.dim("No profiles yet. Run `yoink add` in a terminal."));
  } else {
    for (const line of groupedProfileLines(overview)) console.log(line);
  }
  console.log(pc.dim("Interactive menu needs a terminal. Use `yoink <name>`, `yoink add`, or `yoink list`."));
};
