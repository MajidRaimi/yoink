import pc from "picocolors";
import { theme } from "../shared/theme";

export const printHelp = (): void => {
  console.log(`${pc.bold("yoink")} ${pc.dim("· switch Claude Code accounts")}

${pc.bold("USAGE")}
  yoink                 Open the interactive account menu
  yoink ${theme.accent("<name>")}          Switch straight to a saved profile
  yoink add             Add an account (Claude sign-in or an external provider)
  yoink edit ${theme.accent("<name>")}     Edit a profile (name, or provider/URL/key/model)
  yoink save ${theme.accent("<name>")}     Snapshot your current login as a profile
  yoink use ${theme.accent("<name>")}      Switch to a saved profile
  yoink list            List all saved profiles
  yoink current         Show the active profile
  yoink rename ${theme.accent("<a> <b>")}  Rename a profile
  yoink remove ${theme.accent("<name>")}   Delete a profile
  yoink help            Show this help
  yoink version         Show the version`);
};
