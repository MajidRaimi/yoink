import { homedir } from "node:os";
import { join } from "node:path";
import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { readTextFile } from "../../../shared/json-file";
import { normalizeEndpointUrl, sdkBaseUrl } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { firstExisting, writeConfigFile } from "./config-file";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { parseJsoncObject, removeJsoncValue, setJsoncValue } from "./jsonc-document";
import {
  literalToken,
  modelIdFromRef,
  qualifiedModelRef,
  refersToProvider,
  supportsImages,
  toModelSpec,
} from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";

export type OpencodePaths = {
  configDir: string;
  appBundles: readonly string[];
};

const LABEL = "opencode";
const SCHEMA_URL = "https://opencode.ai/config.json";
const OPENCODE_PROTOCOLS: readonly Protocol[] = ["openai-chat", "anthropic-messages", "openai-responses"];
const MANAGED_MODEL_KEYS = ["name", "tool_call", "reasoning", "limit", "modalities"] as const;
const MODEL_REF_KEYS = ["model", "small_model"] as const;

const NPM_BY_PROTOCOL: Record<Protocol, string> = {
  "openai-chat": "@ai-sdk/openai-compatible",
  "openai-responses": "@ai-sdk/openai",
  "anthropic-messages": "@ai-sdk/anthropic",
};

export const defaultOpencodePaths = (): OpencodePaths => ({
  configDir: join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "opencode"),
  appBundles: ["/Applications/OpenCode.app"],
});

const jsonPath = (paths: OpencodePaths): string => join(paths.configDir, "opencode.json");
const jsoncPath = (paths: OpencodePaths): string => join(paths.configDir, "opencode.jsonc");

const resolveConfigPath = async (paths: OpencodePaths): Promise<string> =>
  (await firstExisting([jsonPath(paths), jsoncPath(paths)])) ?? jsonPath(paths);

const protocolFromNpm = (npm: unknown): Protocol | undefined =>
  OPENCODE_PROTOCOLS.find((protocol) => NPM_BY_PROTOCOL[protocol] === npm);

const emptyConfigText = (): string => `${JSON.stringify({ $schema: SCHEMA_URL }, null, 2)}\n`;

type LoadedConfig = { path: string; text: string; config: ConfigRecord };

const loadConfig = async (paths: OpencodePaths): Promise<LoadedConfig | null> => {
  const path = await resolveConfigPath(paths);
  const text = await readTextFile(path);
  return text === null ? null : { path, text, config: parseJsoncObject(path, text) };
};

const seedText = (loaded: LoadedConfig | null): string =>
  loaded && loaded.text.trim().length > 0 ? loaded.text : emptyConfigText();

const providersOf = (loaded: LoadedConfig | null): ConfigRecord => asRecord(loaded?.config.provider);

const toOpencodeModel = (model: ModelSpec, existing: unknown): ConfigRecord => ({
  ...omitKeys(asRecord(existing), MANAGED_MODEL_KEYS),
  name: model.name,
  tool_call: true,
  reasoning: model.reasoning,
  limit: { context: model.contextWindow, output: model.maxOutput },
  ...(supportsImages(model) ? { modalities: { input: [...model.input], output: ["text"] } } : {}),
});

const buildProviderEntry = (provider: ProviderProfile, endpoint: Endpoint, existingEntry: unknown): ConfigRecord => {
  const existingModels = asRecord(asRecord(existingEntry).models);
  return {
    npm: NPM_BY_PROTOCOL[endpoint.protocol],
    name: provider.provider,
    options: { baseURL: sdkBaseUrl(endpoint), apiKey: provider.token },
    models: Object.fromEntries(
      provider.models.map((model) => [model.id, toOpencodeModel(model, existingModels[model.id])]),
    ),
  };
};

const connect = async (paths: OpencodePaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, OPENCODE_PROTOCOLS, LABEL);
  const loaded = await loadConfig(paths);
  const path = loaded?.path ?? jsonPath(paths);
  const entry = buildProviderEntry(provider, endpoint, providersOf(loaded)[provider.name]);
  const withProvider = setJsoncValue(seedText(loaded), ["provider", provider.name], entry);
  const updated = options.defaultModel
    ? setJsoncValue(withProvider, ["model"], qualifiedModelRef(provider.name, options.defaultModel))
    : withProvider;
  await writeConfigFile(path, updated);
};

const disconnect = async (paths: OpencodePaths, providerId: string): Promise<void> => {
  const loaded = await loadConfig(paths);
  if (!loaded) return;
  const hasEntry = providerId in providersOf(loaded);
  const staleModelKeys = MODEL_REF_KEYS.filter((key) => refersToProvider(loaded.config[key], providerId));
  if (!hasEntry && staleModelKeys.length === 0) return;
  const withoutEntry = hasEntry ? removeJsoncValue(loaded.text, ["provider", providerId]) : loaded.text;
  const updated = staleModelKeys.reduce((text, key) => removeJsoncValue(text, [key]), withoutEntry);
  await writeConfigFile(loaded.path, updated);
};

const fromOpencodeModel = ([id, model]: [string, unknown]): ModelSpec => {
  const record = asRecord(model);
  const limit = asRecord(record.limit);
  return toModelSpec({
    id,
    name: record.name,
    contextWindow: limit.context,
    maxOutput: limit.output,
    reasoning: record.reasoning,
    input: asRecord(record.modalities).input,
  });
};

const fromOpencodeProvider = ([id, entry]: [string, unknown]): ImportedProvider[] => {
  if (!isRecord(entry)) return [];
  const protocol = protocolFromNpm(entry.npm);
  const options = asRecord(entry.options);
  const baseUrl = readString(options.baseURL);
  if (!protocol || !baseUrl) return [];
  return [
    {
      source: "opencode",
      id,
      displayName: readString(entry.name) ?? id,
      token: literalToken(options.apiKey),
      endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) }],
      models: Object.entries(asRecord(entry.models)).map(fromOpencodeModel),
    },
  ];
};

const readProviders = async (paths: OpencodePaths): Promise<ImportedProvider[]> =>
  Object.entries(providersOf(await loadConfig(paths))).flatMap(fromOpencodeProvider);

const isConnected = async (paths: OpencodePaths, providerId: string): Promise<boolean> =>
  providerId in providersOf(await loadConfig(paths));

const readDefaultModel = async (paths: OpencodePaths, providerId: string): Promise<string | null> =>
  modelIdFromRef((await loadConfig(paths))?.config.model, providerId);

const detect = async (paths: OpencodePaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["opencode"], [paths.configDir, ...paths.appBundles]),
  configPath: await resolveConfigPath(paths),
});

export const createOpencodeAdapter = (
  paths: OpencodePaths,
  probes: DetectionProbes = defaultProbes,
): HarnessAdapter => ({
  id: "opencode",
  label: LABEL,
  protocols: OPENCODE_PROTOCOLS,
  exclusive: false,
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const opencodeAdapter = createOpencodeAdapter(defaultOpencodePaths());
