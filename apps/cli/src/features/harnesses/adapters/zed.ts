import { homedir } from "node:os";
import { join } from "node:path";
import type { JSONPath } from "jsonc-parser";
import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { canonicalBaseUrl, normalizeEndpointUrl, withoutV1 } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { writeConfigFile } from "./config-file";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import {
  type JsoncDocument,
  loadJsoncDocument,
  pruneEmptyJsoncObjects,
  removeJsoncValue,
  seedJsoncText,
  setJsoncFields,
  setJsoncValue,
} from "./jsonc-document";
import { supportsImages, toModelSpec } from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";

export type ZedPaths = {
  configDir: string;
  appBundles: readonly string[];
};

type ZedEnvironment = {
  platform: NodeJS.Platform;
  home: string;
  xdgConfigHome?: string;
  appData?: string;
};

type ProviderKind = "openai_compatible" | "anthropic_compatible";

const LABEL = "Zed";
const SETTINGS_FILE = "settings.json";
const LANGUAGE_MODELS = "language_models";
const PROVIDER_KINDS: readonly ProviderKind[] = ["openai_compatible", "anthropic_compatible"];
const ZED_PROTOCOLS: readonly Protocol[] = ["openai-chat", "openai-responses", "anthropic-messages"];
const ZED_BINARIES = ["zed", "zeditor"] as const;
const ZED_APP_BUNDLES = ["/Applications/Zed.app", "/Applications/Zed Preview.app"] as const;
const MANAGED_ENTRY_KEYS = ["api_url", "available_models"] as const;
const MANAGED_MODEL_KEYS = ["name", "display_name", "max_tokens", "max_output_tokens", "capabilities"] as const;
const DEFAULT_MODEL_PATH: JSONPath = ["agent", "default_model"];

const kindFor = (protocol: Protocol): ProviderKind =>
  protocol === "anthropic-messages" ? "anthropic_compatible" : "openai_compatible";

const entryPath = (kind: ProviderKind, providerId: string): JSONPath => [LANGUAGE_MODELS, kind, providerId];

export const zedConfigDirFor = (environment: ZedEnvironment): string => {
  if (environment.platform === "win32" && environment.appData) return join(environment.appData, "Zed");
  return join(environment.xdgConfigHome ?? join(environment.home, ".config"), "zed");
};

export const defaultZedPaths = (): ZedPaths => ({
  configDir: zedConfigDirFor({
    platform: process.platform,
    home: homedir(),
    xdgConfigHome: process.env.XDG_CONFIG_HOME,
    appData: process.env.APPDATA,
  }),
  appBundles: ZED_APP_BUNDLES,
});

export const zedApiKeyVariable = (providerId: string): string =>
  `${providerId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;

const connectNotice = (provider: ProviderProfile): string => {
  const variable = zedApiKeyVariable(provider.name);
  return `Zed does not store API keys in settings.json. Set ${variable} in your environment or paste the key in Zed's agent settings.`;
};

const settingsPath = (paths: ZedPaths): string => join(paths.configDir, SETTINGS_FILE);

const loadSettings = async (paths: ZedPaths): Promise<JsoncDocument | null> =>
  loadJsoncDocument(settingsPath(paths));

const providersOf = (config: ConfigRecord | undefined, kind: ProviderKind): ConfigRecord =>
  asRecord(asRecord(config?.[LANGUAGE_MODELS])[kind]);

const kindsHolding = (config: ConfigRecord | undefined, providerId: string): ProviderKind[] =>
  PROVIDER_KINDS.filter((kind) => providerId in providersOf(config, kind));

const capabilitiesFor = (model: ModelSpec, protocol: Protocol, existing: unknown): ConfigRecord => ({
  tools: true,
  parallel_tool_calls: false,
  prompt_cache_key: false,
  ...asRecord(existing),
  images: supportsImages(model),
  chat_completions: protocol !== "openai-responses",
});

const toZedModel = (model: ModelSpec, protocol: Protocol, existing: unknown): ConfigRecord => {
  const record = asRecord(existing);
  return {
    ...omitKeys(record, MANAGED_MODEL_KEYS),
    name: model.id,
    display_name: model.name,
    max_tokens: model.contextWindow,
    max_output_tokens: model.maxOutput,
    ...(protocol === "anthropic-messages" ? {} : { capabilities: capabilitiesFor(model, protocol, record.capabilities) }),
  };
};

const existingModelsByName = (entry: unknown): Map<string, unknown> => {
  const models = asRecord(entry).available_models;
  if (!Array.isArray(models)) return new Map();
  return new Map(models.flatMap((model) => {
    const name = readString(asRecord(model).name);
    return name ? [[name, model] as const] : [];
  }));
};

const zedApiUrl = (endpoint: Endpoint): string =>
  endpoint.protocol === "anthropic-messages" ? withoutV1(endpoint.baseUrl) : canonicalBaseUrl(endpoint.baseUrl);

const buildEntry = (provider: ProviderProfile, endpoint: Endpoint, existingEntry: unknown): ConfigRecord => {
  const existingModels = existingModelsByName(existingEntry);
  return {
    ...omitKeys(asRecord(existingEntry), MANAGED_ENTRY_KEYS),
    api_url: zedApiUrl(endpoint),
    available_models: provider.models.map((model) =>
      toZedModel(model, endpoint.protocol, existingModels.get(model.id)),
    ),
  };
};

const pointsAtProvider = (config: ConfigRecord, providerId: string): boolean =>
  readString(asRecord(asRecord(config.agent).default_model).provider) === providerId;

const emptiedContainers = (kinds: readonly ProviderKind[], clearsDefault: boolean): JSONPath[] => [
  ...kinds.map((kind) => [LANGUAGE_MODELS, kind]),
  ...(kinds.length > 0 ? [[LANGUAGE_MODELS]] : []),
  ...(clearsDefault ? [["agent"]] : []),
];

const removeProviderEntries = (text: string, kinds: readonly ProviderKind[], providerId: string): string =>
  kinds.reduce((current, kind) => removeJsoncValue(current, entryPath(kind, providerId)), text);

const connect = async (paths: ZedPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, ZED_PROTOCOLS, LABEL);
  const loaded = await loadSettings(paths);
  const kind = kindFor(endpoint.protocol);
  const staleKinds = kindsHolding(loaded?.config, provider.name).filter((held) => held !== kind);
  const existingEntry = providersOf(loaded?.config, kind)[provider.name];
  const withoutStale = pruneEmptyJsoncObjects(
    removeProviderEntries(seedJsoncText(loaded), staleKinds, provider.name),
    staleKinds.map((stale) => [LANGUAGE_MODELS, stale]),
  );
  const withEntry = setJsoncValue(withoutStale, entryPath(kind, provider.name), buildEntry(provider, endpoint, existingEntry));
  const updated = options.defaultModel
    ? setJsoncFields(withEntry, DEFAULT_MODEL_PATH, asRecord(loaded?.config.agent).default_model, {
        provider: provider.name,
        model: options.defaultModel,
      })
    : withEntry;
  await writeConfigFile(settingsPath(paths), updated);
};

const disconnect = async (paths: ZedPaths, providerId: string): Promise<void> => {
  const loaded = await loadSettings(paths);
  if (!loaded) return;
  const heldKinds = kindsHolding(loaded.config, providerId);
  const clearsDefault = pointsAtProvider(loaded.config, providerId);
  if (heldKinds.length === 0 && !clearsDefault) return;
  const withoutEntries = removeProviderEntries(loaded.text, heldKinds, providerId);
  const withoutDefault = clearsDefault ? removeJsoncValue(withoutEntries, DEFAULT_MODEL_PATH) : withoutEntries;
  await writeConfigFile(loaded.path, pruneEmptyJsoncObjects(withoutDefault, emptiedContainers(heldKinds, clearsDefault)));
};

const protocolOf = (kind: ProviderKind, models: readonly unknown[]): Protocol => {
  if (kind === "anthropic_compatible") return "anthropic-messages";
  const usesResponses = models.length > 0 && models.every((model) => asRecord(asRecord(model).capabilities).chat_completions === false);
  return usesResponses ? "openai-responses" : "openai-chat";
};

const fromZedModel = (model: unknown): ModelSpec[] => {
  const record = asRecord(model);
  const id = readString(record.name);
  if (!id) return [];
  const images = asRecord(record.capabilities).images === true;
  return [
    toModelSpec({
      id,
      name: record.display_name,
      contextWindow: record.max_tokens,
      maxOutput: record.max_output_tokens,
      input: images ? ["text", "image"] : undefined,
    }),
  ];
};

const fromZedEntry = (kind: ProviderKind, [id, entry]: [string, unknown]): ImportedProvider[] => {
  if (!isRecord(entry)) return [];
  const apiUrl = readString(entry.api_url);
  if (!apiUrl) return [];
  const models = Array.isArray(entry.available_models) ? entry.available_models : [];
  const protocol = protocolOf(kind, models);
  return [
    {
      source: "zed",
      id,
      displayName: id,
      token: null,
      endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, apiUrl) }],
      models: models.flatMap(fromZedModel),
    },
  ];
};

const readProviders = async (paths: ZedPaths): Promise<ImportedProvider[]> => {
  const config = (await loadSettings(paths))?.config;
  return PROVIDER_KINDS.flatMap((kind) =>
    Object.entries(providersOf(config, kind)).flatMap((pair) => fromZedEntry(kind, pair)),
  );
};

const isConnected = async (paths: ZedPaths, providerId: string): Promise<boolean> =>
  kindsHolding((await loadSettings(paths))?.config, providerId).length > 0;

const readDefaultModel = async (paths: ZedPaths, providerId: string): Promise<string | null> => {
  const config = (await loadSettings(paths))?.config;
  if (!config || !pointsAtProvider(config, providerId)) return null;
  return readString(asRecord(asRecord(config.agent).default_model).model) ?? null;
};

const detect = async (paths: ZedPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ZED_BINARIES, [paths.configDir, ...paths.appBundles]),
  configPath: settingsPath(paths),
});

export const createZedAdapter = (paths: ZedPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "zed",
  label: LABEL,
  protocols: ZED_PROTOCOLS,
  exclusive: false,
  experimental: true,
  setsDefaultModel: true,
  connectNotice,
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const zedAdapter = createZedAdapter(defaultZedPaths());
