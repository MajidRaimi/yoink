import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { canonicalBaseUrl, normalizeEndpointUrl, withoutV1 } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { writeConfigFile } from "./config-file";
import { asRecord, existingModelsById, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
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
import { literalToken, supportsImages, toModelSpec } from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";

export type CrushPaths = {
  configDir: string;
  dataDir: string;
};

export type CrushEnvironment = {
  platform: NodeJS.Platform;
  home: string;
  globalConfig?: string;
  globalData?: string;
  xdgConfigHome?: string;
  xdgDataHome?: string;
  localAppData?: string;
};

const LABEL = "Crush";
const SCHEMA_URL = "https://charm.land/crush.json";
const CONFIG_FILE = "crush.json";
const CRUSHRC_FILE = "crushrc";
const CRUSH_PROTOCOLS: readonly Protocol[] = ["openai-chat", "anthropic-messages"];
const SELECTED_MODEL_KEYS = ["large", "small"] as const;
const MANAGED_PROVIDER_KEYS = ["name", "type", "base_url", "api_key", "models"] as const;
const MANAGED_MODEL_KEYS = [
  "id",
  "name",
  "cost_per_1m_in",
  "cost_per_1m_out",
  "cost_per_1m_in_cached",
  "cost_per_1m_out_cached",
  "context_window",
  "default_max_tokens",
  "can_reason",
  "supports_attachments",
] as const;

const TYPE_BY_PROTOCOL: Partial<Record<Protocol, string>> = {
  "openai-chat": "openai-compat",
  "anthropic-messages": "anthropic",
};

const APP_DIR = "crush";

const windowsAppDir = (environment: CrushEnvironment): string =>
  join(environment.localAppData ?? join(environment.home, "AppData", "Local"), APP_DIR);

export const crushConfigDirFor = (environment: CrushEnvironment): string => {
  if (environment.globalConfig) return environment.globalConfig;
  if (environment.xdgConfigHome) return join(environment.xdgConfigHome, APP_DIR);
  if (environment.platform === "win32") return windowsAppDir(environment);
  return join(environment.home, ".config", APP_DIR);
};

export const crushDataDirFor = (environment: CrushEnvironment): string => {
  if (environment.globalData) return environment.globalData;
  if (environment.xdgDataHome) return join(environment.xdgDataHome, APP_DIR);
  if (environment.platform === "win32") return windowsAppDir(environment);
  return join(environment.home, ".local", "share", APP_DIR);
};

export const crushPathsFor = (environment: CrushEnvironment): CrushPaths => ({
  configDir: crushConfigDirFor(environment),
  dataDir: crushDataDirFor(environment),
});

export const defaultCrushPaths = (): CrushPaths =>
  crushPathsFor({
    platform: process.platform,
    home: homedir(),
    globalConfig: process.env.CRUSH_GLOBAL_CONFIG,
    globalData: process.env.CRUSH_GLOBAL_DATA,
    xdgConfigHome: process.env.XDG_CONFIG_HOME,
    xdgDataHome: process.env.XDG_DATA_HOME,
    localAppData: process.env.LOCALAPPDATA,
  });

const configPath = (paths: CrushPaths): string => join(paths.configDir, CONFIG_FILE);
const dataConfigPath = (paths: CrushPaths): string => join(paths.dataDir, CONFIG_FILE);
const crushrcPath = (paths: CrushPaths): string => join(paths.configDir, CRUSHRC_FILE);

const protocolFromType = (type: unknown): Protocol | undefined =>
  CRUSH_PROTOCOLS.find((protocol) => TYPE_BY_PROTOCOL[protocol] === type);

const crushBaseUrl = (endpoint: Endpoint): string =>
  endpoint.protocol === "anthropic-messages" ? withoutV1(endpoint.baseUrl) : canonicalBaseUrl(endpoint.baseUrl);

const emptyConfigText = (): string => `${JSON.stringify({ $schema: SCHEMA_URL }, null, 2)}\n`;

const loadConfig = async (paths: CrushPaths): Promise<JsoncDocument | null> =>
  loadJsoncDocument(configPath(paths));

const providersOf = (loaded: JsoncDocument | null): ConfigRecord => asRecord(loaded?.config.providers);

const selectedModelsOf = (loaded: JsoncDocument | null): ConfigRecord => asRecord(loaded?.config.models);

const toCrushModel = (model: ModelSpec, existing: ConfigRecord | undefined): ConfigRecord => ({
  ...omitKeys(existing ?? {}, MANAGED_MODEL_KEYS),
  id: model.id,
  name: model.name,
  cost_per_1m_in: 0,
  cost_per_1m_out: 0,
  cost_per_1m_in_cached: 0,
  cost_per_1m_out_cached: 0,
  context_window: model.contextWindow,
  default_max_tokens: model.maxOutput,
  can_reason: model.reasoning,
  supports_attachments: supportsImages(model),
});

const buildProviderEntry = (provider: ProviderProfile, endpoint: Endpoint, existingEntry: unknown): ConfigRecord => {
  const existingModels = existingModelsById(existingEntry);
  return {
    ...omitKeys(asRecord(existingEntry), MANAGED_PROVIDER_KEYS),
    name: provider.provider,
    type: TYPE_BY_PROTOCOL[endpoint.protocol],
    base_url: crushBaseUrl(endpoint),
    api_key: provider.token,
    models: provider.models.map((model) => toCrushModel(model, existingModels.get(model.id))),
  };
};

const pointsAtProvider = (selected: unknown, providerId: string): boolean =>
  asRecord(selected).provider === providerId;

const connect = async (paths: CrushPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, CRUSH_PROTOCOLS, LABEL);
  const loaded = await loadConfig(paths);
  const entry = buildProviderEntry(provider, endpoint, providersOf(loaded)[provider.name]);
  const withProvider = setJsoncValue(seedJsoncText(loaded, emptyConfigText()), ["providers", provider.name], entry);
  const updated = options.defaultModel
    ? setJsoncFields(withProvider, ["models", "large"], selectedModelsOf(loaded).large, {
        model: options.defaultModel,
        provider: provider.name,
      })
    : withProvider;
  await writeConfigFile(configPath(paths), updated);
};

const disconnect = async (paths: CrushPaths, providerId: string): Promise<void> => {
  const loaded = await loadConfig(paths);
  if (!loaded) return;
  const hasEntry = providerId in providersOf(loaded);
  const selected = selectedModelsOf(loaded);
  const staleKeys = SELECTED_MODEL_KEYS.filter((key) => pointsAtProvider(selected[key], providerId));
  if (!hasEntry && staleKeys.length === 0) return;
  const withoutEntry = hasEntry ? removeJsoncValue(loaded.text, ["providers", providerId]) : loaded.text;
  const updated = staleKeys.reduce((text, key) => removeJsoncValue(text, ["models", key]), withoutEntry);
  await writeConfigFile(configPath(paths), pruneEmptyJsoncObjects(updated, [["providers"], ["models"]]));
};

const fromCrushModel = (model: unknown): ModelSpec[] => {
  if (!isRecord(model)) return [];
  const id = readString(model.id);
  if (!id) return [];
  return [
    toModelSpec({
      id,
      name: model.name,
      contextWindow: model.context_window,
      maxOutput: model.default_max_tokens,
      reasoning: model.can_reason,
      input: model.supports_attachments === true ? ["text", "image"] : undefined,
    }),
  ];
};

const fromCrushProvider = ([id, entry]: [string, unknown]): ImportedProvider[] => {
  if (!isRecord(entry)) return [];
  const protocol = protocolFromType(entry.type);
  const baseUrl = readString(entry.base_url);
  if (!protocol || !baseUrl) return [];
  const models = Array.isArray(entry.models) ? entry.models : [];
  return [
    {
      source: "crush",
      id,
      displayName: readString(entry.name) ?? id,
      token: literalToken(entry.api_key),
      endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) }],
      models: models.flatMap(fromCrushModel),
    },
  ];
};

const readProviders = async (paths: CrushPaths): Promise<ImportedProvider[]> =>
  Object.entries(providersOf(await loadConfig(paths))).flatMap(fromCrushProvider);

const isConnected = async (paths: CrushPaths, providerId: string): Promise<boolean> =>
  providerId in providersOf(await loadConfig(paths));

const readDefaultModel = async (paths: CrushPaths, providerId: string): Promise<string | null> => {
  const large = asRecord(selectedModelsOf(await loadConfig(paths)).large);
  return large.provider === providerId ? (readString(large.model) ?? null) : null;
};

const detect = async (paths: CrushPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["crush"], [paths.configDir]),
  configPath: configPath(paths),
});

const crushrcNotice = (paths: CrushPaths, provider: ProviderProfile): string | undefined =>
  existsSync(crushrcPath(paths))
    ? `A crushrc file exists at ${crushrcPath(paths)}. If Crush reads it instead of ${CONFIG_FILE}, add ${provider.provider} there too.`
    : undefined;

const readSelectedLargeSync = (path: string): ConfigRecord => {
  if (!existsSync(path)) return {};
  const parsed: unknown = parse(readFileSync(path, "utf8"), [], { allowTrailingComma: true });
  return asRecord(asRecord(asRecord(parsed).models).large);
};

const dataOverrideNotice = (paths: CrushPaths, provider: ProviderProfile): string | undefined => {
  const chosen = readSelectedLargeSync(configPath(paths));
  const model = readString(chosen.model);
  if (chosen.provider !== provider.name || !model) return undefined;
  const override = readSelectedLargeSync(dataConfigPath(paths));
  const overrideProvider = readString(override.provider);
  if (!overrideProvider || overrideProvider === provider.name) return undefined;
  return `Added ${provider.provider} to Crush, but ${dataConfigPath(paths)} keeps the model chosen in the Crush UI (${overrideProvider}/${readString(override.model) ?? "unknown"}). Pick ${provider.name}/${model} in Crush (ctrl+m) to use it.`;
};

const connectNotice = (paths: CrushPaths, provider: ProviderProfile): string | undefined => {
  const notices = [crushrcNotice(paths, provider), dataOverrideNotice(paths, provider)].filter(
    (notice): notice is string => notice !== undefined,
  );
  return notices.length > 0 ? notices.join(" ") : undefined;
};

export const createCrushAdapter = (paths: CrushPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "crush",
  label: LABEL,
  protocols: CRUSH_PROTOCOLS,
  exclusive: false,
  experimental: false,
  setsDefaultModel: true,
  connectNotice: (provider) => connectNotice(paths, provider),
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const crushAdapter = createCrushAdapter(defaultCrushPaths());
