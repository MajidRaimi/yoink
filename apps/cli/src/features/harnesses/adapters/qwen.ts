import { homedir } from "node:os";
import { join } from "node:path";
import type { JSONPath } from "jsonc-parser";
import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { YoinkError } from "../../../shared/errors";
import { sdkBaseUrl, withoutV1 } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { writeConfigFile } from "./config-file";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import {
  type JsoncDocument,
  loadJsoncDocument,
  parseJsoncObject,
  pruneEmptyJsoncObjects,
  removeJsoncValue,
  seedJsoncText,
  setJsoncValue,
} from "./jsonc-document";
import {
  AUTH_TYPE_BY_PROTOCOL,
  QWEN_AUTH_TYPES,
  WIRE_API_BY_PROTOCOL,
  entriesOf,
  importQwenProviders,
  isOwnedBy,
  modelProvidersOf,
  ownedEnvKey,
  type QwenAuthType,
} from "./qwen-schema";
import { literalToken } from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";

export type QwenPaths = {
  configDir: string;
};

const LABEL = "Qwen Code";
const QWEN_BINARY = "qwen";
const QWEN_PROTOCOLS: readonly Protocol[] = ["openai-chat", "openai-responses", "anthropic-messages"];
const MANAGED_ENTRY_KEYS = ["id", "name", "baseUrl", "envKey", "wireApi"] as const;
const MODEL_NAME_PATH = ["model", "name"];
const SELECTED_TYPE_PATH = ["security", "auth", "selectedType"];

export const defaultQwenPaths = (): QwenPaths => ({
  configDir: process.env.QWEN_HOME ?? join(homedir(), ".qwen"),
});

const settingsPath = (paths: QwenPaths): string => join(paths.configDir, "settings.json");

const loadSettings = async (paths: QwenPaths): Promise<JsoncDocument | null> =>
  loadJsoncDocument(settingsPath(paths));

const endpointBaseUrl = (endpoint: Endpoint): string =>
  endpoint.protocol === "anthropic-messages" ? withoutV1(endpoint.baseUrl) : sdkBaseUrl(endpoint);

const toQwenEntry = (model: ModelSpec, endpoint: Endpoint, envKey: string, existing: unknown): ConfigRecord => {
  const previous = asRecord(existing);
  const wireApi = WIRE_API_BY_PROTOCOL[endpoint.protocol];
  return {
    ...omitKeys(previous, MANAGED_ENTRY_KEYS),
    id: model.id,
    name: model.name,
    baseUrl: endpointBaseUrl(endpoint),
    envKey,
    ...(wireApi ? { wireApi } : {}),
    generationConfig: { ...asRecord(previous.generationConfig), contextWindowSize: model.contextWindow },
  };
};

const entryId = (entry: unknown): string | undefined => (isRecord(entry) ? readString(entry.id) : undefined);

const assertNoForeignCollision = (
  foreign: readonly unknown[],
  provider: ProviderProfile,
  authType: QwenAuthType,
): void => {
  const foreignIds = new Set(foreign.map(entryId));
  const clash = provider.models.find((model) => foreignIds.has(model.id));
  if (!clash) return;
  throw new YoinkError(
    `${LABEL} already has a modelProviders.${authType} entry "${clash.id}" that yoink does not manage. Rename or remove it before connecting ${provider.name}.`,
  );
};

type EntryPredicate = (entry: unknown) => boolean;

const adoptableBy = (config: ConfigRecord, provider: ProviderProfile): EntryPredicate => {
  const env = asRecord(config.env);
  const modelIds = new Set(provider.models.map((model) => model.id));
  return (entry) => {
    const envKey = readString(asRecord(entry).envKey);
    const id = entryId(entry);
    return envKey !== undefined && id !== undefined && modelIds.has(id) && literalToken(env[envKey]) === provider.token;
  };
};

const mergeOwned = (current: readonly unknown[], isOurs: EntryPredicate, incoming: readonly ConfigRecord[]): unknown[] => {
  const pending = new Map(incoming.map((entry) => [String(entry.id), entry]));
  const merged = current.flatMap((entry) => {
    if (!isOurs(entry)) return [entry];
    const id = entryId(entry) ?? "";
    const replacement = pending.get(id);
    if (!replacement) return [];
    pending.delete(id);
    return [replacement];
  });
  return [...merged, ...pending.values()];
};

const nextEntries = (
  config: ConfigRecord,
  authType: QwenAuthType,
  target: QwenAuthType,
  provider: ProviderProfile,
  endpoint: Endpoint,
): unknown[] => {
  const envKey = ownedEnvKey(provider.name);
  const current = entriesOf(config, authType);
  const adoptable = adoptableBy(config, provider);
  const isOurs: EntryPredicate = (entry) => isOwnedBy(entry, envKey) || (authType === target && adoptable(entry));
  const owned = current.filter(isOurs);
  const foreign = current.filter((entry) => !isOurs(entry));
  if (authType !== target) return foreign;
  assertNoForeignCollision(foreign, provider, authType);
  const incoming = provider.models.map((model) =>
    toQwenEntry(model, endpoint, envKey, owned.find((entry) => entryId(entry) === model.id)),
  );
  return mergeOwned(current, isOurs, incoming);
};

const writeEntries = (text: string, config: ConfigRecord, authType: QwenAuthType, entries: unknown[]): string => {
  const path = ["modelProviders", authType];
  if (entries.length > 0) return setJsoncValue(text, path, entries);
  return authType in modelProvidersOf(config) ? removeJsoncValue(text, path) : text;
};

const setNested = (text: string, config: ConfigRecord, path: readonly string[], value: string): string => {
  const [head, ...rest] = path;
  if (head === undefined) return text;
  const parent = config[head];
  if (parent === undefined || isRecord(parent)) return setJsoncValue(text, [...path], value);
  const nested = rest.reduceRight<unknown>((inner, key) => ({ [key]: inner }), value);
  return setJsoncValue(text, [head], nested);
};

const setDefault = (text: string, config: ConfigRecord, modelId: string, authType: QwenAuthType): string =>
  setNested(setNested(text, config, MODEL_NAME_PATH, modelId), config, SELECTED_TYPE_PATH, authType);

const connect = async (paths: QwenPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, QWEN_PROTOCOLS, LABEL);
  const target = AUTH_TYPE_BY_PROTOCOL[endpoint.protocol];
  const loaded = await loadSettings(paths);
  const config = loaded?.config ?? {};
  const withEntries = QWEN_AUTH_TYPES.reduce(
    (text, authType) => writeEntries(text, config, authType, nextEntries(config, authType, target, provider, endpoint)),
    seedJsoncText(loaded),
  );
  const withKey = setJsoncValue(withEntries, ["env", ownedEnvKey(provider.name)], provider.token);
  const updated = options.defaultModel
    ? setDefault(withKey, parseJsoncObject(settingsPath(paths), withKey), options.defaultModel, target)
    : withKey;
  await writeConfigFile(settingsPath(paths), updated);
};

const selectedAuthType = (config: ConfigRecord): QwenAuthType | undefined => {
  const selected = asRecord(asRecord(config.security).auth).selectedType;
  return QWEN_AUTH_TYPES.find((authType) => authType === selected);
};

const ownedDefaultModel = (config: ConfigRecord, providerId: string): string | null => {
  const authType = selectedAuthType(config);
  const modelId = readString(asRecord(config.model).name);
  if (!authType || !modelId) return null;
  const envKey = ownedEnvKey(providerId);
  const owned = entriesOf(config, authType).some((entry) => entryId(entry) === modelId && isOwnedBy(entry, envKey));
  return owned ? modelId : null;
};

const hasOwnedEntries = (config: ConfigRecord, providerId: string): boolean => {
  const envKey = ownedEnvKey(providerId);
  return QWEN_AUTH_TYPES.some((authType) => entriesOf(config, authType).some((entry) => isOwnedBy(entry, envKey)));
};

const PRUNABLE_PATHS: readonly JSONPath[] = [
  ["security", "auth"],
  ["security"],
  ["model"],
  ["modelProviders"],
  ["env"],
];

const disconnect = async (paths: QwenPaths, providerId: string): Promise<void> => {
  const loaded = await loadSettings(paths);
  if (!loaded) return;
  const { config } = loaded;
  const envKey = ownedEnvKey(providerId);
  const hasKey = envKey in asRecord(config.env);
  const pointsHere = ownedDefaultModel(config, providerId) !== null;
  if (!hasOwnedEntries(config, providerId) && !hasKey) return;
  const withoutEntries = QWEN_AUTH_TYPES.reduce(
    (text, authType) =>
      writeEntries(text, config, authType, entriesOf(config, authType).filter((entry) => !isOwnedBy(entry, envKey))),
    loaded.text,
  );
  const withoutKey = hasKey ? removeJsoncValue(withoutEntries, ["env", envKey]) : withoutEntries;
  const withoutDefault = pointsHere
    ? removeJsoncValue(removeJsoncValue(withoutKey, MODEL_NAME_PATH), SELECTED_TYPE_PATH)
    : withoutKey;
  const path = settingsPath(paths);
  await writeConfigFile(path, pruneEmptyJsoncObjects(withoutDefault, PRUNABLE_PATHS));
};

const readProviders = async (paths: QwenPaths): Promise<ImportedProvider[]> => {
  const loaded = await loadSettings(paths);
  return loaded ? importQwenProviders(loaded.config) : [];
};

const isConnected = async (paths: QwenPaths, providerId: string): Promise<boolean> =>
  hasOwnedEntries((await loadSettings(paths))?.config ?? {}, providerId);

const readDefaultModel = async (paths: QwenPaths, providerId: string): Promise<string | null> =>
  ownedDefaultModel((await loadSettings(paths))?.config ?? {}, providerId);

const detect = async (paths: QwenPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, [QWEN_BINARY], [paths.configDir]),
  configPath: settingsPath(paths),
});

export const createQwenAdapter = (paths: QwenPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "qwen",
  label: LABEL,
  protocols: QWEN_PROTOCOLS,
  exclusive: false,
  experimental: false,
  setsDefaultModel: true,
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const qwenAdapter = createQwenAdapter(defaultQwenPaths());
