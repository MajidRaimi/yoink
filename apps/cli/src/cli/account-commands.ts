import pc from "picocolors";
import { theme } from "../shared/theme";
import { saveProfile } from "../features/profiles/service";
import { accountLabel, PROFILE_GROUP_TITLES, restartHint, switchedLine } from "../features/profiles/format";
import { groupedProfileLines } from "../features/profiles/grouped-lines";
import { accountSummaries, currentOverview, loadProfileOverview } from "../features/profiles/overview";
import type { Profile } from "../features/profiles/types";
import { saveSubscription } from "../features/subscriptions/switch";
import { useProfile } from "../features/switch/use-profile";
import { parseCurrentArgs, parseListArgs, parseSaveArgs, parseUseArgs, type SaveArgs } from "./account-flags";
import { printJson } from "./json-output";

const saveForTool = ({ name, tool }: SaveArgs): Promise<Profile> =>
  tool === "claude" ? saveProfile(name) : saveSubscription(tool, name);

export const handleSave = async (args: string[]): Promise<void> => {
  const profile = await saveForTool(parseSaveArgs(args));
  console.log(`${theme.success("✔")} Saved ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`);
};

const warnNotice = (notice: string | null): void => {
  if (notice !== null) console.error(`${theme.warn("!")} ${notice}`);
};

export const handleUse = async (args: string[]): Promise<void> => {
  const { name, force } = parseUseArgs(args);
  const outcome = await useProfile(name, { force });
  switch (outcome.kind) {
    case "already":
      console.log(`${theme.active("●")} Already on ${theme.accent(name)}.`);
      warnNotice(outcome.notice);
      return;
    case "cancelled":
      console.log(pc.dim("Switch cancelled."));
      return;
    case "switched":
      console.log(switchedLine(outcome.profile));
      console.log(pc.dim(restartHint(outcome.profile)));
      warnNotice(outcome.notice);
      return;
  }
};

export const handleList = async (args: string[]): Promise<void> => {
  const { json } = parseListArgs(args);
  const overview = await loadProfileOverview();
  if (json) {
    printJson(accountSummaries(overview));
    return;
  }
  if (overview.profiles.length === 0) {
    console.log(pc.dim("No profiles yet. Run `yoink add` to log in, or `yoink save <name>` to snapshot the current login."));
    return;
  }
  for (const line of groupedProfileLines(overview)) console.log(line);
};

export const handleCurrent = async (args: string[]): Promise<void> => {
  const { tool, json } = parseCurrentArgs(args);
  const active = currentOverview(await loadProfileOverview(), tool);
  if (json) {
    printJson(accountSummaries(active));
    return;
  }
  if (active.profiles.length === 0) {
    const scope = tool === undefined ? "profile" : `${PROFILE_GROUP_TITLES[tool]} login`;
    console.log(pc.dim(`No active ${scope} tracked. Run \`yoink list\`.`));
    return;
  }
  for (const line of groupedProfileLines(active)) console.log(line);
};
