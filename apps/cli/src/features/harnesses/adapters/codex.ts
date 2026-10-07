import { homedir } from "node:os";
import { join } from "node:path";
import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { readTextFile } from "../../../shared/json-file";
import { normalizeEndpointUrl, sdkBaseUrl } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { writeConfigFile } from "./config-file";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { literalToken, toModelSpec } from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";
import { applyTomlEdit, readTomlObject, type TomlEdit } from "./toml-document";
import { removeRootKey, removeTableSections, setRootString, upsertTableSection, type TomlStringEntry } from "./toml-text";

export type CodexPaths = {
  codexHome: string;
};

const LABEL = "codex";
const CODEX_PROTOCOLS: readonly Protocol[] = ["openai-responses"];
const PROVIDERS_KEY = "model_providers";
const MODEL_KEY = "model";
const MODEL_PROVIDER_KEY = "model_provider";

export const defaultCodexPaths = (): CodexPaths => ({
  codexHome: process.env.CODEX_HOME ?? join(homedir(), ".codex"),
});

const configPath = (paths: CodexPaths): string => join(paths.codexHome, "config.toml");

const providerEntries = (provider: ProviderProfile, endpoint: Endpoint): TomlStringEntry[] => [
  ["name", provider.provider],
  ["base_url", sdkBaseUrl(endpoint)],
  ["wire_api", "responses"],
  ["experimental_bearer_token", provider.token],
];

const upsertProviderEdit = (providerId: string, entries: readonly TomlStringEntry[]): TomlEdit => ({
  text: (source) => upsertTableSection(source, [PROVIDERS_KEY, providerId], entries),
  object: (config) => ({
    ...config,
    [PROVIDERS_KEY]: { ...asRecord(config[PROVIDERS_KEY]), [providerId]: Object.fromEntries(entries) },
  }),
});

const setDefaultEdit = (providerId: string, modelId: string): TomlEdit => ({
  text: (source) => setRootString(setRootString(source, MODEL_KEY, modelId), MODEL_PROVIDER_KEY, providerId),
  object: (config) => ({ ...config, [MODEL_KEY]: modelId, [MODEL_PROVIDER_KEY]: providerId }),
});

const withoutProvider = (config: ConfigRecord, providerId: string): ConfigRecord => {
  const remaining = omitKeys(asRecord(config[PROVIDERS_KEY]), [providerId]);
  const rest = omitKeys(config, [PROVIDERS_KEY]);
  return Object.keys(remaining).length > 0 ? { ...rest, [PROVIDERS_KEY]: remaining } : rest;
};

const removeProviderEdit = (providerId: string): TomlEdit => ({
  text: (source) => removeTableSections(source, [PROVIDERS_KEY, providerId]),
  object: (config) => withoutProvider(config, providerId),
});

const clearDefaultEdit: TomlEdit = {
  text: (source) => removeRootKey(removeRootKey(source, MODEL_KEY), MODEL_PROVIDER_KEY),
  object: (config) => omitKeys(config, [MODEL_KEY, MODEL_PROVIDER_KEY]),
};

const applyEdits = (path: string, source: string, edits: readonly TomlEdit[]): string =>
  edits.reduce((text, edit) => applyTomlEdit(path, text, edit), source);

const connect = async (paths: CodexPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, CODEX_PROTOCOLS, LABEL);
  const path = configPath(paths);
  const source = (await readTextFile(path)) ?? "";
  const edits = [
    upsertProviderEdit(provider.name, providerEntries(provider, endpoint)),
    ...(options.defaultModel ? [setDefaultEdit(provider.name, options.defaultModel)] : []),
  ];
  await writeConfigFile(path, applyEdits(path, source, edits));
};

const disconnect = async (paths: CodexPaths, providerId: string): Promise<void> => {
  const path = configPath(paths);
  const source = await readTextFile(path);
  if (source === null) return;
  const config = await readTomlObject(path);
  const hasEntry = providerId in asRecord(config?.[PROVIDERS_KEY]);
  const pointsAtProvider = config?.[MODEL_PROVIDER_KEY] === providerId;
  if (!hasEntry && !pointsAtProvider) return;
  const edits = [
    ...(pointsAtProvider ? [clearDefaultEdit] : []),
    ...(hasEntry ? [removeProviderEdit(providerId)] : []),
  ];
  await writeConfigFile(path, applyEdits(path, source, edits));
};

const protocolFromWireApi = (wireApi: unknown): Protocol => (wireApi === "chat" ? "openai-chat" : "openai-responses");

const defaultModelFor = (config: ConfigRecord, providerId: string): ModelSpec[] => {
  const modelId = readString(config[MODEL_KEY]);
  return modelId && config[MODEL_PROVIDER_KEY] === providerId ? [toModelSpec({ id: modelId })] : [];
};

const fromCodexProvider = (config: ConfigRecord, [id, entry]: [string, unknown]): ImportedProvider[] => {
  if (!isRecord(entry)) return [];
  const baseUrl = readString(entry.base_url);
  if (!baseUrl) return [];
  const protocol = protocolFromWireApi(entry.wire_api);
  return [
    {
      source: "codex",
      id,
      displayName: readString(entry.name) ?? id,
      token: literalToken(entry.experimental_bearer_token),
      endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) }],
      models: defaultModelFor(config, id),
    },
  ];
};

const readProviders = async (paths: CodexPaths): Promise<ImportedProvider[]> => {
  const config = await readTomlObject(configPath(paths));
  if (!config) return [];
  return Object.entries(asRecord(config[PROVIDERS_KEY])).flatMap((pair) => fromCodexProvider(config, pair));
};

const isConnected = async (paths: CodexPaths, providerId: string): Promise<boolean> => {
  const config = await readTomlObject(configPath(paths));
  return providerId in asRecord(config?.[PROVIDERS_KEY]);
};

const readDefaultModel = async (paths: CodexPaths, providerId: string): Promise<string | null> => {
  const config = await readTomlObject(configPath(paths));
  return config?.[MODEL_PROVIDER_KEY] === providerId ? (readString(config[MODEL_KEY]) ?? null) : null;
};

const detect = async (paths: CodexPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["codex"], [paths.codexHome]),
  configPath: configPath(paths),
});

export const createCodexAdapter = (paths: CodexPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "codex",
  label: LABEL,
  protocols: CODEX_PROTOCOLS,
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

export const codexAdapter = createCodexAdapter(defaultCodexPaths());
