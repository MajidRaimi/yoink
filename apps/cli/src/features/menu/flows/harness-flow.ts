import { cancel, note, outro } from "@clack/prompts";
import pc from "picocolors";
import { homedir } from "node:os";
import { theme } from "../../../shared/theme";
import { promptConfirm, promptMultiSelect, promptSelect } from "../../../shared/prompt";
import { applyExternalEnv, GLOBAL_SETTINGS_PATH, localSettingsPath } from "../../../shared/claude-settings";
import { isTrackedAndNotIgnored } from "../../../shared/git-status";
import { pickEndpoint } from "../../harnesses/endpoint";
import { linkedHarnessIds } from "../../harnesses/links";
import {
  connectHarnesses,
  disconnectHarnesses,
  harnessStatuses,
  loadProvider,
  type HarnessStatus,
} from "../../harnesses/sync";
import type { HarnessId, ProviderProfile } from "../../profiles/types";
import { experimentalTag } from "../../harnesses/experimental-tag";
import { protectLocalSecret } from "./protect-local-secret";
import { reportOutcomes } from "./report-outcomes";

const KEEP_DEFAULT = "__keep__";
const GLOBAL_SCOPE = "global";
const LOCAL_SCOPE = "local";

const tildify = (path: string): string => {
  const home = homedir();
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
};

const unavailableReason = (status: HarnessStatus): string | undefined => {
  if (!status.installed) return "not installed";
  if (status.parseError !== null) return `config unreadable: ${status.parseError}`;
  if (!status.compatible) return status.id === "codex" ? "needs an OpenAI Responses endpoint" : "no compatible endpoint";
  return undefined;
};

const statusOption = (status: HarnessStatus) => {
  const reason = unavailableReason(status);
  return {
    value: status.id,
    label: `${status.label}${experimentalTag(status.experimental)}`,
    hint: reason ?? tildify(status.configPath),
    disabled: reason !== undefined,
  };
};

const chooseDefaultModel = async (
  provider: ProviderProfile,
  harnessLabels: string[],
  required: boolean,
): Promise<string | undefined | null> => {
  const options = [
    ...(required ? [] : [{ value: KEEP_DEFAULT, label: pc.dim("Keep each harness's current default") }]),
    ...provider.models.map((model) => ({ value: model.id, label: model.id, hint: model.name !== model.id ? model.name : undefined })),
  ];
  const choice = await promptSelect({
    message: `Default model in ${harnessLabels.join(", ")}`,
    options,
    initialValue: required ? provider.models[0]?.id : KEEP_DEFAULT,
  });
  if (choice === null) return null;
  return choice === KEEP_DEFAULT ? undefined : choice;
};

const chooseClaudeScope = async (): Promise<string | null> =>
  promptSelect({
    message: "Apply to Claude Code where?",
    options: [
      { value: GLOBAL_SCOPE, label: theme.accent("Globally"), hint: "switches Claude Code to this provider" },
      { value: LOCAL_SCOPE, label: theme.accent("This project only"), hint: "writes ./.claude/settings.local.json" },
    ],
  });

const applyClaudeLocally = async (provider: ProviderProfile, model: string): Promise<boolean> => {
  const endpoint = pickEndpoint(provider, ["anthropic-messages"]);
  if (!endpoint) return false;
  const cwd = process.cwd();
  if (!(await protectLocalSecret(cwd))) return false;
  await applyExternalEnv(localSettingsPath(cwd), { baseUrl: endpoint.baseUrl, token: provider.token, model });
  return true;
};

const confirmGlobalClaudeWrite = async (): Promise<boolean> => {
  if (!(await isTrackedAndNotIgnored(GLOBAL_SETTINGS_PATH))) return true;
  const proceed = await promptConfirm({
    message: theme.warn(
      "~/.claude/settings.json is tracked in a git repo on this machine, so your API key could be committed. Continue?",
    ),
    initialValue: false,
  });
  return proceed === true;
};

const describe = (provider: ProviderProfile): string =>
  `${provider.provider} · ${provider.endpoints.map((endpoint) => endpoint.protocol).join(", ")} · ${provider.models.length} models`;

const chooseSharedDefaultModel = async (
  provider: ProviderProfile,
  ids: readonly HarnessId[],
  statuses: ReadonlyMap<HarnessId, HarnessStatus>,
): Promise<string | undefined | null> => {
  const targets = ids.flatMap((id) => {
    const status = statuses.get(id);
    return status?.setsDefaultModel ? [status.label] : [];
  });
  return targets.length === 0 ? undefined : chooseDefaultModel(provider, targets, false);
};

const connectAdded = async (
  provider: ProviderProfile,
  added: HarnessId[],
  statuses: ReadonlyMap<HarnessId, HarnessStatus>,
): Promise<boolean> => {
  const others = added.filter((id) => id !== "claude-code");
  if (added.includes("claude-code")) {
    const scope = await chooseClaudeScope();
    if (scope === null) return false;
    const model = await chooseDefaultModel(provider, ["Claude Code"], true);
    if (model === null || model === undefined) return false;
    if (scope === LOCAL_SCOPE) {
      if (await applyClaudeLocally(provider, model)) note("Wrote ./.claude/settings.local.json", "Claude Code");
    } else if (await confirmGlobalClaudeWrite()) {
      reportOutcomes(await connectHarnesses(provider.name, ["claude-code"], { defaultModel: model }), "Connected");
    }
  }
  if (others.length === 0) return true;
  const defaultModel = await chooseSharedDefaultModel(provider, others, statuses);
  if (defaultModel === null) return false;
  reportOutcomes(await connectHarnesses(provider.name, others, { defaultModel }), "Connected");
  return true;
};

export const manageProviderHarnesses = async (name: string): Promise<void> => {
  const provider = await loadProvider(name);
  const statuses = await harnessStatuses(provider);
  const statusById = new Map(statuses.map((status) => [status.id, status]));
  const connected = linkedHarnessIds(provider, statuses);

  const selected = await promptMultiSelect<HarnessId>({
    message: `${theme.accent(provider.name)} ${pc.dim(describe(provider))}\n  Connect to which harnesses?`,
    options: statuses.map(statusOption),
    initialValues: connected,
    required: false,
  });
  if (selected === null) {
    cancel("No changes.");
    return;
  }

  const added = selected.filter((id) => !connected.includes(id));
  const removed = connected.filter((id) => !selected.includes(id));
  if (added.length === 0 && removed.length === 0) {
    outro("No changes.");
    return;
  }

  if (removed.length > 0) reportOutcomes(await disconnectHarnesses(name, removed), "Disconnected from");
  if (added.length > 0 && !(await connectAdded(provider, added, statusById))) {
    cancel("Stopped before connecting.");
    return;
  }
  outro("Done. Restart running harnesses to pick up the change.");
};
