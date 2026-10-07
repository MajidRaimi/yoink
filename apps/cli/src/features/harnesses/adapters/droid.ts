import { homedir } from "node:os";
import { join } from "node:path";
import type { Endpoint, ModelSpec, ProviderProfile } from "../../profiles/types";
import { YoinkError } from "../../../shared/errors";
import type { HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { writeConfigFile } from "./config-file";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { DROID_PROTOCOLS, entryModelId, importDroidModels, isOwnedEntry, toDroidEntry } from "./droid-models";
import {
  type JsoncDocument,
  loadJsoncDocument,
  removeJsoncValue,
  seedJsoncText,
  setJsoncValue,
} from "./jsonc-document";
import { requireEndpoint } from "./require-endpoint";

export type DroidPaths = {
  configDir: string;
};

const LABEL = "Droid";
const MODELS_KEY = "customModels";
const APPEND_INDEX = -1;

export const defaultDroidPaths = (): DroidPaths => ({
  configDir: join(homedir(), ".factory"),
});

const settingsPath = (paths: DroidPaths): string => join(paths.configDir, "settings.json");

const loadSettings = async (paths: DroidPaths): Promise<JsoncDocument | null> =>
  loadJsoncDocument(settingsPath(paths));

const customModelsOf = (loaded: JsoncDocument | null): unknown[] => {
  const models = loaded?.config[MODELS_KEY];
  return Array.isArray(models) ? models : [];
};

const ownedIndices = (entries: readonly unknown[], providerId: string): number[] =>
  entries.flatMap((entry, index) => (isOwnedEntry(entry, providerId) ? [index] : []));

const claimOwnedSlots = (entries: readonly unknown[], owned: readonly number[], models: readonly ModelSpec[]): Map<number, ModelSpec> => {
  const claimed = new Map<number, ModelSpec>();
  for (const model of models) {
    const slot = owned.find((index) => !claimed.has(index) && entryModelId(entries[index]) === model.id);
    if (slot !== undefined) claimed.set(slot, model);
  }
  return claimed;
};

const mergeIntoArray = (
  text: string,
  entries: readonly unknown[],
  provider: ProviderProfile,
  endpoint: Endpoint,
): string => {
  const owned = ownedIndices(entries, provider.name);
  const claimed = claimOwnedSlots(entries, owned, provider.models);
  const placed = new Set(claimed.values());
  const rewritten = [...owned].reverse().reduce((current, index) => {
    const model = claimed.get(index);
    return model
      ? setJsoncValue(current, [MODELS_KEY, index], toDroidEntry(provider, endpoint, model, entries[index]))
      : removeJsoncValue(current, [MODELS_KEY, index]);
  }, text);
  return provider.models
    .filter((model) => !placed.has(model))
    .reduce(
      (current, model) => setJsoncValue(current, [MODELS_KEY, APPEND_INDEX], toDroidEntry(provider, endpoint, model, undefined)),
      rewritten,
    );
};

const connect = async (paths: DroidPaths, provider: ProviderProfile): Promise<void> => {
  const endpoint = requireEndpoint(provider, DROID_PROTOCOLS, LABEL);
  if (provider.models.length === 0) throw new YoinkError(`${provider.name} has no models to add to ${LABEL}.`);
  const loaded = await loadSettings(paths);
  const text = seedJsoncText(loaded);
  const updated = Array.isArray(loaded?.config[MODELS_KEY])
    ? mergeIntoArray(text, customModelsOf(loaded), provider, endpoint)
    : setJsoncValue(
        text,
        [MODELS_KEY],
        provider.models.map((model) => toDroidEntry(provider, endpoint, model, undefined)),
      );
  await writeConfigFile(settingsPath(paths), updated);
};

const disconnect = async (paths: DroidPaths, providerId: string): Promise<void> => {
  const loaded = await loadSettings(paths);
  const entries = customModelsOf(loaded);
  const owned = ownedIndices(entries, providerId);
  if (!loaded || owned.length === 0) return;
  const updated =
    owned.length === entries.length
      ? removeJsoncValue(loaded.text, [MODELS_KEY])
      : [...owned].reverse().reduce((current, index) => removeJsoncValue(current, [MODELS_KEY, index]), loaded.text);
  await writeConfigFile(settingsPath(paths), updated);
};

const readProviders = async (paths: DroidPaths): Promise<ImportedProvider[]> =>
  importDroidModels(customModelsOf(await loadSettings(paths)));

const isConnected = async (paths: DroidPaths, providerId: string): Promise<boolean> =>
  ownedIndices(customModelsOf(await loadSettings(paths)), providerId).length > 0;

const detect = async (paths: DroidPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["droid"], [paths.configDir]),
  configPath: settingsPath(paths),
});

export const createDroidAdapter = (paths: DroidPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "droid",
  label: LABEL,
  protocols: DROID_PROTOCOLS,
  exclusive: false,
  experimental: false,
  setsDefaultModel: false,
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: async () => null,
  connect: (provider) => connect(paths, provider),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const droidAdapter = createDroidAdapter(defaultDroidPaths());
