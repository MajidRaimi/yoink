import pc from "picocolors";
import { theme } from "../../shared/theme";
import { accountLabel } from "../profiles/format";
import type { Profile } from "../profiles/types";

export const printPlainFallback = (current: string | null, profiles: Profile[]): void => {
  if (profiles.length === 0) {
    console.log(pc.dim("No profiles yet. Run `yoink add` in a terminal."));
  } else {
    for (const profile of profiles) {
      const marker = current === profile.name ? theme.active("●") : pc.dim("○");
      console.log(`${marker} ${pc.bold(profile.name.padEnd(20))} ${pc.dim(accountLabel(profile))}`);
    }
  }
  console.log(pc.dim("Interactive menu needs a terminal. Use `yoink <name>`, `yoink add`, or `yoink list`."));
};
