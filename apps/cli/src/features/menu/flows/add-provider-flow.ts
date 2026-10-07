import { cancel, note } from "@clack/prompts";
import pc from "picocolors";
import { errorMessage } from "../../../shared/errors";
import { theme } from "../../../shared/theme";
import { promptPassword, promptSelect, promptText } from "../../../shared/prompt";
import { withSpinner } from "../../../shared/spinner";
import { requireNonEmpty, validateHttpUrl, validateProviderId } from "../../../shared/validators";
import { listProfiles } from "../../profiles/service";
import { slugify, uniqueName } from "../../profiles/naming";
import type { Endpoint } from "../../profiles/types";
import { findPreset, PROVIDER_PRESETS, type ProviderPreset } from "../../providers/presets";
import { discoverPreset } from "../../providers/preset-discovery";
import { probeProvider } from "../../providers/probe";
import { lookupModelSpecs } from "../../providers/catalog";
import { addProvider } from "../../providers/service";
import type { ProbeResult } from "../../providers/types";
import { manageProviderHarnesses } from "./harness-flow";
import { pickModelSelection } from "./pick-models-flow";

const CUSTOM_PRESET = "custom";

type ProviderSource = {
  displayName: string;
  presetId?: string;
  discover: (token: string) => Promise<ProbeResult>;
};

const choosePreset = async (): Promise<ProviderPreset | typeof CUSTOM_PRESET | null> => {
  const choice = await promptSelect({
    message: "Which provider?",
    options: [
      ...PROVIDER_PRESETS.map((preset) => ({ value: preset.id, label: theme.accent(preset.label) })),
      { value: CUSTOM_PRESET, label: theme.accent("Custom"), hint: "any OpenAI- or Anthropic-compatible API" },
    ],
  });
  if (choice === null) return null;
  return choice === CUSTOM_PRESET ? CUSTOM_PRESET : (findPreset(choice) ?? null);
};

const promptCustomDetails = async (): Promise<{ displayName: string; baseUrl: string } | null> => {
  const displayName = await promptText({ message: "Provider name", placeholder: "Fuse", validate: requireNonEmpty });
  if (displayName === null) return null;
  const baseUrl = await promptText({
    message: "Base URL",
    placeholder: "https://api.example.com/v1",
    validate: validateHttpUrl,
  });
  if (baseUrl === null) return null;
  return { displayName, baseUrl };
};

const discoverCustom = async (baseUrl: string, token: string): Promise<ProbeResult> => probeProvider({ baseUrl, token });

const withCancellingSpinner = <T,>(message: string, task: () => Promise<T>): Promise<T | null> =>
  withSpinner(message, task, cancel);

const resolveSource = async (): Promise<ProviderSource | null> => {
  const preset = await choosePreset();
  if (preset === null) return null;
  if (preset !== CUSTOM_PRESET) {
    return { displayName: preset.label, presetId: preset.id, discover: (token) => discoverPreset(preset, token) };
  }
  const custom = await promptCustomDetails();
  if (custom === null) return null;
  return { displayName: custom.displayName, discover: (token) => discoverCustom(custom.baseUrl, token) };
};

const describeEndpoints = (endpoints: Endpoint[]): string =>
  endpoints.map((endpoint) => `${theme.active(endpoint.protocol)} ${pc.dim(endpoint.baseUrl)}`).join("\n");

export const addProviderFlow = async (): Promise<void> => {
  const source = await resolveSource();
  if (source === null) return cancel("Cancelled.");

  const token = await promptPassword({ message: "API key", validate: requireNonEmpty });
  if (token === null) return cancel("Cancelled.");

  const discovery = await withCancellingSpinner("Checking the key and discovering endpoints", () => source.discover(token));
  if (discovery === null) return;
  note(describeEndpoints(discovery.endpoints), `${discovery.models.length} models found`);

  const modelIds = await pickModelSelection(discovery.models);
  if (modelIds === null || modelIds.length === 0) return cancel("Cancelled.");
  const chosen = discovery.models.filter((model) => modelIds.includes(model.id));

  const affinity = { presetId: source.presetId, baseUrls: discovery.endpoints.map((endpoint) => endpoint.baseUrl) };
  const models = await withCancellingSpinner("Looking up context windows on models.dev", () => lookupModelSpecs(chosen, { affinity }));
  if (models === null) return;

  const { profiles } = await listProfiles();
  const name = await promptText({
    message: "Profile id (used as the provider id in harness configs)",
    initialValue: uniqueName(profiles, slugify(source.displayName)),
    validate: validateProviderId,
  });
  if (name === null) return cancel("Cancelled.");

  try {
    await addProvider({
      name,
      displayName: source.displayName,
      token,
      endpoints: discovery.endpoints,
      models,
      presetId: source.presetId,
    });
  } catch (error) {
    return cancel(errorMessage(error, "Could not save the provider."));
  }
  await manageProviderHarnesses(name);
};
