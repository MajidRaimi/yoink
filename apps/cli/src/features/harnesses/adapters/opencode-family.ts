import { join } from "node:path";
import type { Endpoint, HarnessId, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { readTextFile } from "../../../shared/json-file";
import { normalizeEndpointUrl, sdkBaseUrl } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { firstExisting, writeConfigFile } from "./config-file";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { isInstalled, type DetectionProbes } from "./detection";
import { parseJsoncObject, pruneEmptyJsoncObjects, removeJsoncValue, setJsoncValue } from "./jsonc-document";
import {
  literalToken,
  modelIdFromRef,
  qualifiedModelRef,
  refersToProvider,
  supportsImages,
  toModelSpec,
} from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";

export type OpencodeFamilySpec = {
  id: HarnessId;
  label: string;
  binaries: readonly string[];
  fileBase: string;
  emptyConfigText: string;
};

export type OpencodeFamilyPaths = {
  configDir: string;
  appBundles: readonly string[];
};

type FamilyContext = { spec: OpencodeFamilySpec; paths: OpencodeFamilyPaths };

type LoadedConfig = { path: string; text: string; config: ConfigRecord };

export const OPENCODE_FAMILY_PROTOCOLS: readonly Protocol[] = ["openai-chat", "anthropic-messages", "openai-responses"];
const MANAGED_MODEL_KEYS = ["name", "tool_call", "reasoning", "limit", "modalities"] as const;
const MODEL_REF_KEYS = ["model", "small_model"] as const;

const NPM_BY_PROTOCOL: Record<Protocol, string> = {
  "openai-chat": "@ai-sdk/openai-compatible",
  "openai-responses": "@ai-sdk/openai",
  "anthropic-messages": "@ai-sdk/anthropic",
};

const jsonPath = ({ spec, paths }: FamilyContext): string => join(paths.configDir, `${spec.fileBase}.json`);
const jsoncPath = ({ spec, paths }: FamilyContext): string => join(paths.configDir, `${spec.fileBase}.jsonc`);

const resolveConfigPath = async (context: FamilyContext): Promise<string> =>
  (await firstExisting([jsonPath(context), jsoncPath(context)])) ?? jsonPath(context);

const protocolFromNpm = (npm: unknown): Protocol | undefined =>
  OPENCODE_FAMILY_PROTOCOLS.find((protocol) => NPM_BY_PROTOCOL[protocol] === npm);

const loadConfig = async (context: FamilyContext): Promise<LoadedConfig | null> => {
  const path = await resolveConfigPath(context);
  const text = await readTextFile(path);
  return text === null ? null : { path, text, config: parseJsoncObject(path, text) };
};

const seedText = (context: FamilyContext, loaded: LoadedConfig | null): string =>
  loaded && loaded.text.trim().length > 0 ? loaded.text : context.spec.emptyConfigText;

const providersOf = (loaded: LoadedConfig | null): ConfigRecord => asRecord(loaded?.config.provider);

const toFamilyModel = (model: ModelSpec, existing: unknown): ConfigRecord => ({
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
      provider.models.map((model) => [model.id, toFamilyModel(model, existingModels[model.id])]),
    ),
  };
};

const connect = async (context: FamilyContext, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, OPENCODE_FAMILY_PROTOCOLS, context.spec.label);
  const loaded = await loadConfig(context);
  const path = loaded?.path ?? jsonPath(context);
  const entry = buildProviderEntry(provider, endpoint, providersOf(loaded)[provider.name]);
  const withProvider = setJsoncValue(seedText(context, loaded), ["provider", provider.name], entry);
  const updated = options.defaultModel
    ? setJsoncValue(withProvider, ["model"], qualifiedModelRef(provider.name, options.defaultModel))
    : withProvider;
  await writeConfigFile(path, updated);
};

const disconnect = async (context: FamilyContext, providerId: string): Promise<void> => {
  const loaded = await loadConfig(context);
  if (!loaded) return;
  const hasEntry = providerId in providersOf(loaded);
  const staleModelKeys = MODEL_REF_KEYS.filter((key) => refersToProvider(loaded.config[key], providerId));
  if (!hasEntry && staleModelKeys.length === 0) return;
  const withoutEntry = hasEntry ? removeJsoncValue(loaded.text, ["provider", providerId]) : loaded.text;
  const updated = staleModelKeys.reduce((text, key) => removeJsoncValue(text, [key]), withoutEntry);
  await writeConfigFile(loaded.path, pruneEmptyJsoncObjects(updated, [["provider"]]));
};

const fromFamilyModel = ([id, model]: [string, unknown]): ModelSpec => {
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

const fromFamilyProvider =
  (source: HarnessId) =>
  ([id, entry]: [string, unknown]): ImportedProvider[] => {
    if (!isRecord(entry)) return [];
    const protocol = protocolFromNpm(entry.npm);
    const options = asRecord(entry.options);
    const baseUrl = readString(options.baseURL);
    if (!protocol || !baseUrl) return [];
    return [
      {
        source,
        id,
        displayName: readString(entry.name) ?? id,
        token: literalToken(options.apiKey),
        endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) }],
        models: Object.entries(asRecord(entry.models)).map(fromFamilyModel),
      },
    ];
  };

const readProviders = async (context: FamilyContext): Promise<ImportedProvider[]> =>
  Object.entries(providersOf(await loadConfig(context))).flatMap(fromFamilyProvider(context.spec.id));

const isConnected = async (context: FamilyContext, providerId: string): Promise<boolean> =>
  providerId in providersOf(await loadConfig(context));

const readDefaultModel = async (context: FamilyContext, providerId: string): Promise<string | null> =>
  modelIdFromRef((await loadConfig(context))?.config.model, providerId);

const detect = async (context: FamilyContext, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, context.spec.binaries, [context.paths.configDir, ...context.paths.appBundles]),
  configPath: await resolveConfigPath(context),
});

export const createOpencodeFamilyAdapter = (
  spec: OpencodeFamilySpec,
  paths: OpencodeFamilyPaths,
  probes: DetectionProbes,
): HarnessAdapter => {
  const context: FamilyContext = { spec, paths };
  return {
    id: spec.id,
    label: spec.label,
    protocols: OPENCODE_FAMILY_PROTOCOLS,
    exclusive: false,
    experimental: false,
    setsDefaultModel: true,
    detect: () => detect(context, probes),
    readProviders: () => readProviders(context),
    isConnected: (providerId) => isConnected(context, providerId),
    readDefaultModel: (providerId) => readDefaultModel(context, providerId),
    connect: (provider, options) => connect(context, provider, options),
    disconnect: (providerId) => disconnect(context, providerId),
  };
};
