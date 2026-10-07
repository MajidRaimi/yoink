import pc from "picocolors";
import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import { nowIso } from "../shared/time";
import { listProfiles, renameProfile, upsertProfile } from "../features/profiles/service";
import type { ExternalProfile } from "../features/profiles/types";
import { deleteProfile } from "../features/providers/removal";
import { countFailures } from "../features/harnesses/outcomes";
import { validateProviderId } from "../shared/validators";
import { editProviderFields } from "../features/providers/field-edit";
import { accountLabel } from "../features/profiles/format";
import { introBanner } from "../features/menu/banner";
import { addAccountMenu } from "../features/menu/flows/add-account-menu";
import { editProfileFlow } from "../features/menu/flows/edit-flow";
import {
  hasExternalEditFlags,
  isExternalAddInvocation,
  parseExternalAddArgs,
  parseExternalEditArgs,
} from "./external-flags";
import { renderFailedOutcomes } from "./render-outcomes";
import { readTokenFromStdin } from "./stdin-token";
import { isProviderAddInvocation } from "./provider-flags";
import { handleProviderAdd } from "./provider-commands";

const assertValidProviderName = (name: string): void => {
  const error = validateProviderId(name);
  if (error) throw new YoinkError(`Invalid provider name "${name}": ${error}.`);
};

const handleExternalAdd = async (args: string[]): Promise<void> => {
  const parsed = parseExternalAddArgs(args);
  assertValidProviderName(parsed.name);
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
  const token = parsed.tokenFromStdin ? await readTokenFromStdin() : undefined;
  const { provider, outcomes } = await editProviderFields(name, {
    name: parsed.name,
    displayName: parsed.provider,
    token,
    baseUrl: parsed.baseUrl,
    model: parsed.model,
  });
  renderFailedOutcomes(outcomes, "Synced");
  console.log(`${theme.success("✔")} Updated ${theme.accent(pc.bold(provider.name))} ${pc.dim(`(${accountLabel(provider)})`)}`);
};

export const handleAdd = async (args: string[]): Promise<void> => {
  if (isProviderAddInvocation(args)) {
    await handleProviderAdd(args);
    return;
  }
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

export const handleRename = async (args: string[]): Promise<void> => {
  const from = args[0]?.trim();
  const to = args[1]?.trim();
  if (!from || !to) throw new YoinkError("Usage: yoink rename <from> <to>");
  renderFailedOutcomes(await renameProfile(from, to), "Synced");
  console.log(`${theme.success("✔")} Renamed ${theme.accent(from)} to ${theme.accent(to)}`);
};

export const handleRemove = async (args: string[]): Promise<void> => {
  const name = args[0]?.trim();
  if (!name) throw new YoinkError("Usage: yoink remove <name>");
  const outcomes = await deleteProfile(name);
  renderFailedOutcomes(outcomes, "Disconnected");
  const failed = countFailures(outcomes);
  if (failed > 0) {
    throw new YoinkError(
      `Kept "${name}" because ${failed} harness(es) could not be disconnected. Fix the errors above and run \`yoink remove ${name}\` again.`,
    );
  }
  console.log(`${theme.success("✔")} Removed ${theme.accent(name)}`);
};
