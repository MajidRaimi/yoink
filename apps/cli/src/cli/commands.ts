import pc from "picocolors";
import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import {
  currentProfile,
  listProfiles,
  removeProfile,
  renameProfile,
  saveProfile,
  updateProfile,
  upsertProfile,
} from "../features/profiles/service";
import type { ExternalProfile } from "../features/profiles/types";
import { switchTo } from "../features/switch/service";
import { applyExternalEnv, GLOBAL_SETTINGS_PATH } from "../shared/claude-settings";
import { confirmIfClaudeRunning } from "../features/switch/confirm-running";
import { accountLabel, profileLine, switchedLine } from "../features/profiles/format";
import { introBanner } from "../features/menu/banner";
import { addAccountMenu } from "../features/menu/flows/add-account-menu";
import { editProfileFlow } from "../features/menu/flows/edit-flow";
import {
  hasExternalEditFlags,
  isExternalAddInvocation,
  parseExternalAddArgs,
  parseExternalEditArgs,
} from "./external-flags";

const nowIso = (): string => new Date().toISOString();

const readTokenFromStdin = async (): Promise<string> => {
  if (process.stdin.isTTY) {
    throw new YoinkError("--token-stdin requires the API key piped on stdin, e.g. echo $KEY | yoink add ...");
  }
  const token = (await Bun.stdin.text()).trim();
  if (!token) throw new YoinkError("No token received on stdin. Pipe the API key when using --token-stdin.");
  return token;
};

const handleExternalAdd = async (args: string[]): Promise<void> => {
  const parsed = parseExternalAddArgs(args);
  if (!parsed.tokenFromStdin) {
    throw new YoinkError("An API key is required. Pipe it on stdin with --token-stdin.");
  }
  const token = await readTokenFromStdin();
  const { profiles } = await listProfiles();
  if (profiles.some((profile) => profile.name === parsed.name)) {
    throw new YoinkError(`A profile named "${parsed.name}" already exists.`);
  }
  const profile: ExternalProfile = {
    type: "external",
    name: parsed.name,
    provider: parsed.provider,
    baseUrl: parsed.baseUrl,
    token,
    model: parsed.model,
    updatedAt: nowIso(),
  };
  await upsertProfile(profile, false);
  console.log(`${theme.success("✔")} Added ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)}`);
};

const handleExternalEdit = async (name: string, args: string[]): Promise<void> => {
  const parsed = parseExternalEditArgs(args);
  const { profiles } = await listProfiles();
  const profile = profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new YoinkError(`No profile named "${name}".`);
  if (profile.type !== "external") {
    throw new YoinkError(`"${name}" is a Claude profile. Flag edits only apply to external profiles.`);
  }
  const token = parsed.tokenFromStdin ? await readTokenFromStdin() : profile.token;
  const next: ExternalProfile = {
    ...profile,
    name: parsed.name ?? profile.name,
    provider: parsed.provider ?? profile.provider,
    baseUrl: parsed.baseUrl ?? profile.baseUrl,
    model: parsed.model ?? profile.model,
    token,
    updatedAt: nowIso(),
  };
  await updateProfile(name, next);
  const { current } = await listProfiles();
  if (current === next.name) {
    await applyExternalEnv(GLOBAL_SETTINGS_PATH, {
      baseUrl: next.baseUrl,
      token: next.token,
      model: next.model,
    });
  }
  console.log(`${theme.success("✔")} Updated ${theme.accent(pc.bold(next.name))} ${pc.dim(`(${accountLabel(next)})`)}`);
};

export const handleAdd = async (args: string[]): Promise<void> => {
  if (isExternalAddInvocation(args)) {
    await handleExternalAdd(args);
    return;
  }
  if (hasExternalEditFlags(args)) {
    throw new YoinkError("Provider flags need --external, e.g. yoink add --external --name ...");
  }
  if (!process.stdout.isTTY) throw new YoinkError("`yoink add` needs an interactive terminal.");
  introBanner("add an account");
  await addAccountMenu();
};

export const handleEdit = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name || name.startsWith("--")) throw new YoinkError("Usage: yoink edit <name>");
  const flags = args.slice(1);
  if (hasExternalEditFlags(flags)) {
    await handleExternalEdit(name, flags);
    return;
  }
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
