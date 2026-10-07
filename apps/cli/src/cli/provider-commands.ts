import pc from "picocolors";
import { YoinkError } from "../shared/errors";
import { theme } from "../shared/theme";
import { introBanner } from "../features/menu/banner";
import { manageProviderHarnesses } from "../features/menu/flows/harness-flow";
import { editProviderModels } from "../features/menu/flows/edit-external-flow";
import { importCandidatesFlow } from "../features/menu/flows/import-flow";
import { describeReadFailure, scanHarnesses } from "../features/harnesses/import";
import { disconnectTargets } from "../features/harnesses/links";
import { countFailures } from "../features/harnesses/outcomes";
import { harnessReports } from "../features/harnesses/reports";
import {
  connectHarnesses,
  disconnectHarnesses,
  harnessStatuses,
  loadProvider,
  type HarnessOutcome,
} from "../features/harnesses/sync";
import { markImportOffered } from "../features/profiles/import-flag";
import { listProfiles } from "../features/profiles/service";
import type { HarnessId, ProviderProfile } from "../features/profiles/types";
import { importAllCandidates } from "../features/providers/bulk-import";
import { lookupModelSpecs } from "../features/providers/catalog";
import { resolveProviderEndpoints } from "../features/providers/endpoint-resolution";
import { setProviderModels } from "../features/providers/model-selection";
import { addProvider } from "../features/providers/service";
import { parseHarnessList, parseProviderAddArgs, parseRawFlags, splitList } from "./provider-flags";
import { renderOutcomes } from "./render-outcomes";
import { readTokenFromStdin } from "./stdin-token";

const isInteractive = (): boolean => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const requireName = (args: readonly string[], usage: string): string => {
  const name = args[0]?.trim();
  if (!name || name.startsWith("--")) throw new YoinkError(`Usage: ${usage}`);
  return name;
};

const assertNoFailures = (failed: number): void => {
  if (failed > 0) throw new YoinkError(`${failed} harness update(s) failed.`);
};

const printOutcomes = (outcomes: HarnessOutcome[], verb: string): void => {
  renderOutcomes(outcomes, verb);
  assertNoFailures(countFailures(outcomes));
};

export const handleProviderAdd = async (args: string[]): Promise<void> => {
  const parsed = parseProviderAddArgs(args);
  if (!parsed.tokenFromStdin) throw new YoinkError("An API key is required. Pipe it on stdin with --token-stdin.");
  const token = await readTokenFromStdin();
  const { endpoints, displayName } = await resolveProviderEndpoints(parsed, token);
  const models = await lookupModelSpecs(
    parsed.models.map((id) => ({ id, name: id })),
    { affinity: { presetId: parsed.preset, baseUrls: endpoints.map((endpoint) => endpoint.baseUrl) } },
  );
  const profile = await addProvider({ name: parsed.name, displayName, token, endpoints, models, presetId: parsed.preset });
  console.log(`${theme.success("✔")} Added ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${displayName})`)}`);
  if (parsed.connect.length > 0) {
    printOutcomes(await connectHarnesses(profile.name, parsed.connect, { defaultModel: parsed.defaultModel }), "Connected");
  }
};

export const handleConnect = async (args: string[]): Promise<void> => {
  const name = requireName(args, "yoink connect <name> [--to pi,opencode] [--default <model>]");
  const { values } = parseRawFlags(args.slice(1), new Set(["--to", "--default"]), new Set());
  const targets = parseHarnessList(values.get("--to"));
  if (targets.length === 0) {
    if (!isInteractive()) throw new YoinkError("Pass --to <harness,...> when not in an interactive terminal.");
    introBanner("connect a provider");
    await manageProviderHarnesses(name);
    return;
  }
  printOutcomes(await connectHarnesses(name, targets, { defaultModel: values.get("--default") }), "Connected");
};

const defaultDisconnectTargets = async (provider: ProviderProfile): Promise<HarnessId[]> => {
  const statuses = await harnessStatuses(provider);
  const unreadable = statuses.filter((status) => status.parseError !== null);
  for (const status of unreadable) console.error(theme.warn(`${status.label}: ${status.parseError}`));
  const targets = disconnectTargets(provider, statuses);
  if (targets.length === 0 && unreadable.length > 0) {
    const ids = unreadable.map((status) => status.id).join(",");
    throw new YoinkError(`Could not check every harness config. Fix it, or pass --from ${ids} to disconnect anyway.`);
  }
  return targets;
};

export const handleDisconnect = async (args: string[]): Promise<void> => {
  const name = requireName(args, "yoink disconnect <name> [--from pi,opencode]");
  const { values } = parseRawFlags(args.slice(1), new Set(["--from"]), new Set());
  const requested = parseHarnessList(values.get("--from"));
  const provider = await loadProvider(name);
  const targets = requested.length > 0 ? requested : await defaultDisconnectTargets(provider);
  if (targets.length === 0) {
    console.log(pc.dim(`${name} is not connected to any harness.`));
    return;
  }
  printOutcomes(await disconnectHarnesses(name, targets), "Disconnected from");
};

export const handleHarnesses = async (args: string[]): Promise<void> => {
  const { switches } = parseRawFlags(args, new Set(), new Set(["--json"]));
  const reports = await harnessReports();
  if (switches.has("--json")) {
    console.log(JSON.stringify(reports, null, 2));
    return;
  }
  for (const report of reports) {
    const marker = report.installed ? theme.active("●") : pc.dim("○");
    const linked = report.providers.length > 0 ? theme.accent(report.providers.join(", ")) : pc.dim("no providers");
    const installedStatus = report.error ? theme.warn(`unreadable: ${report.error}`) : linked;
    const status = report.installed ? installedStatus : pc.dim("not installed");
    console.log(`${marker} ${pc.bold(report.label.padEnd(12))} ${status}  ${pc.dim(report.configPath)}`);
  }
};

export const handleModels = async (args: string[]): Promise<void> => {
  const name = requireName(args, "yoink models <name> [--set id,id]");
  const { values } = parseRawFlags(args.slice(1), new Set(["--set"]), new Set());
  const requested = splitList(values.get("--set"));
  if (requested.length === 0) {
    if (!isInteractive()) throw new YoinkError("Pass --set <model,...> when not in an interactive terminal.");
    introBanner("choose models");
    await editProviderModels(name);
    return;
  }
  printOutcomes(await setProviderModels(name, requested), "Re-synced");
};

export const handleImport = async (args: string[]): Promise<void> => {
  const { switches } = parseRawFlags(args, new Set(), new Set(["--yes"]));
  const { profiles } = await listProfiles();
  const { candidates, failures } = await scanHarnesses(profiles);
  for (const failure of failures) console.error(theme.warn(describeReadFailure(failure)));
  if (candidates.length === 0) {
    if (failures.length === 0) await markImportOffered();
    console.log(pc.dim("No unmanaged providers found in your harness configs."));
    return;
  }
  if (switches.has("--yes")) {
    const { results, failed } = await importAllCandidates(candidates);
    for (const { profile, outcomes } of results) {
      console.log(`${theme.success("✔")} Imported ${theme.accent(profile.name)}`);
      renderOutcomes(outcomes.filter((outcome) => !outcome.ok), "Synced");
    }
    if (failures.length === 0) await markImportOffered();
    assertNoFailures(failed);
    return;
  }
  if (!isInteractive()) throw new YoinkError("Pass --yes to import without prompting.");
  introBanner("import providers");
  await importCandidatesFlow(candidates);
};
