import pc from "picocolors";
import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import {
  currentProfile,
  listProfiles,
  removeProfile,
  renameProfile,
  saveProfile,
} from "../features/profiles/service";
import { switchTo } from "../features/switch/service";
import { confirmIfClaudeRunning } from "../features/switch/confirm-running";
import { accountLabel, profileLine, switchedLine } from "../features/profiles/format";
import { introBanner } from "../features/menu/banner";
import { addAccountMenu } from "../features/menu/flows/add-account-menu";
import { editProfileFlow } from "../features/menu/flows/edit-flow";

export const handleAdd = async (): Promise<void> => {
  if (!process.stdout.isTTY) throw new YoinkError("`yoink add` needs an interactive terminal.");
  introBanner("add an account");
  await addAccountMenu();
};

export const handleEdit = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name) throw new YoinkError("Usage: yoink edit <name>");
  if (!process.stdout.isTTY) throw new YoinkError("`yoink edit` needs an interactive terminal.");
  introBanner("edit a profile");
  await editProfileFlow(name);
};

export const handleSave = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name) throw new YoinkError("Usage: yoink save <name>");
  const profile = await saveProfile(name);
  console.log(`${theme.success("✔")} Saved ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`);
};

export const handleUse = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name) throw new YoinkError("Usage: yoink use <name>");
  const active = await currentProfile();
  if (active?.name === name) {
    console.log(`${theme.active("●")} Already on ${theme.accent(name)}.`);
    return;
  }
  if (!(await confirmIfClaudeRunning())) {
    console.log(pc.dim("Switch cancelled."));
    return;
  }
  const { profile } = await switchTo(name);
  console.log(switchedLine(profile));
};

export const handleList = async (): Promise<void> => {
  const { current, profiles } = await listProfiles();
  if (profiles.length === 0) {
    console.log(pc.dim("No profiles yet. Run `yoink add` to log in, or `yoink save <name>` to snapshot the current login."));
    return;
  }
  for (const profile of profiles) {
    console.log(profileLine(profile, current === profile.name));
  }
};

export const handleCurrent = async (): Promise<void> => {
  const profile = await currentProfile();
  if (!profile) {
    console.log(pc.dim("No active profile tracked. Run `yoink list`."));
    return;
  }
  console.log(profileLine(profile, true));
};

export const handleRename = async (args: string[]): Promise<void> => {
  const from = args[0]?.trim();
  const to = args[1]?.trim();
  if (!from || !to) throw new YoinkError("Usage: yoink rename <from> <to>");
  await renameProfile(from, to);
  console.log(`${theme.success("✔")} Renamed ${theme.accent(from)} to ${theme.accent(to)}`);
};

export const handleRemove = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name) throw new YoinkError("Usage: yoink remove <name>");
  await removeProfile(name);
  console.log(`${theme.success("✔")} Removed ${theme.accent(name)}`);
};
