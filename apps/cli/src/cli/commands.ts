import pc from "picocolors";
import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import { renameProfile } from "../features/profiles/service";
import { defaultModelSpec } from "../features/profiles/model-spec";
import type { Protocol } from "../features/profiles/types";
import { normalizeEndpointUrl } from "../features/harnesses/endpoint";
import { addProvider, type ProviderInput } from "../features/providers/service";
import { deleteProfile } from "../features/providers/removal";
import { countFailures } from "../features/harnesses/outcomes";
import { editProviderFields } from "../features/providers/field-edit";
import { accountLabel } from "../features/profiles/format";
import { introBanner } from "../features/menu/banner";
import { addAccountMenu } from "../features/menu/flows/add-account-menu";
import { editProfileFlow } from "../features/menu/flows/edit-flow";
import {
  type ExternalAddArgs,
  hasExternalEditFlags,
  isExternalAddInvocation,
  parseExternalAddArgs,
  parseExternalEditArgs,
} from "./external-flags";
import { renderFailedOutcomes } from "./render-outcomes";
import { readTokenFromStdin } from "./stdin-token";
import { isProviderAddInvocation } from "./provider-flags";
import { handleProviderAdd } from "./provider-commands";

const LEGACY_EXTERNAL_PROTOCOL: Protocol = "anthropic-messages";

const toProviderInput = (parsed: ExternalAddArgs, token: string): ProviderInput => ({
  name: parsed.name,
  displayName: parsed.provider,
  token,
  endpoints: [{ protocol: LEGACY_EXTERNAL_PROTOCOL, baseUrl: normalizeEndpointUrl(LEGACY_EXTERNAL_PROTOCOL, parsed.baseUrl) }],
  models: [defaultModelSpec(parsed.model)],
});

const handleExternalAdd = async (args: string[]): Promise<void> => {
  const parsed = parseExternalAddArgs(args);
  if (!parsed.tokenFromStdin) {
    throw new YoinkError("An API key is required. Pipe it on stdin with --token-stdin.");
  }
  const profile = await addProvider(toProviderInput(parsed, await readTokenFromStdin()));
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
