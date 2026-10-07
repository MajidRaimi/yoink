import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import type { ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { isMissingFileError, parseJsonOrNull } from "../../../shared/fs-errors";
import { parseJsonText, readTextFile } from "../../../shared/json-file";
import { withoutV1 } from "../endpoint";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { removeOwnedConfigFile, writeOwnedConfigFile } from "./config-file";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { literalToken, toModelSpec } from "./model-mapping";
import { requireEndpoint } from "./require-endpoint";

export type ClaudeDesktopPaths = {
  configDir: string;
  appBundles: readonly string[];
};

export type ClaudeDesktopEnvironment = {
  platform: NodeJS.Platform;
  home: string;
  localAppData: string | undefined;
  xdgConfigHome: string | undefined;
};

const LABEL = "Claude Desktop";
const CONFIG_DIR_NAME = "Claude-3p";
const LIBRARY_DIR_NAME = "configLibrary";
const FILE_PREFIX = "yoink-";
const JSON_EXTENSION = ".json";
const META_FILE_NAME = "_meta.json";
const GATEWAY_PROVIDER = "gateway";
const CLAUDE_DESKTOP_PROTOCOLS: readonly Protocol[] = ["anthropic-messages"];
const MANAGED_KEYS = [
  "inferenceProvider",
  "inferenceGatewayBaseUrl",
  "inferenceGatewayApiKey",
  "inferenceModels",
] as const;

const configBaseDir = (environment: ClaudeDesktopEnvironment): string => {
  if (environment.platform === "darwin") return join(environment.home, "Library", "Application Support");
  if (environment.platform === "win32") return environment.localAppData ?? join(environment.home, "AppData", "Local");
  return environment.xdgConfigHome ?? join(environment.home, ".config");
};

export const claudeDesktopConfigDir = (environment: ClaudeDesktopEnvironment): string =>
  join(configBaseDir(environment), CONFIG_DIR_NAME);

export const defaultClaudeDesktopPaths = (): ClaudeDesktopPaths => ({
  configDir: claudeDesktopConfigDir({
    platform: process.platform,
    home: homedir(),
    localAppData: process.env.LOCALAPPDATA,
    xdgConfigHome: process.env.XDG_CONFIG_HOME,
  }),
  appBundles: ["/Applications/Claude.app"],
});

const libraryDir = (paths: ClaudeDesktopPaths): string => join(paths.configDir, LIBRARY_DIR_NAME);

const configFileName = (providerId: string): string => `${FILE_PREFIX}${providerId}${JSON_EXTENSION}`;

const configPath = (paths: ClaudeDesktopPaths, providerId: string): string =>
  join(libraryDir(paths), configFileName(providerId));

const readConfigFile = async (path: string): Promise<ConfigRecord | null> => {
  const text = await readTextFile(path);
  if (text === null || text.trim().length === 0) return null;
  return asRecord(parseJsonText<unknown>(path, text));
};

const parseModelList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  const parsed = typeof value === "string" ? parseJsonOrNull(value) : null;
  return Array.isArray(parsed) ? parsed : [];
};

const modelEntryId = (entry: unknown): string | undefined =>
  isRecord(entry) ? (readString(entry.id) ?? readString(entry.name)) : readString(entry);

const modelIds = (config: ConfigRecord): string[] =>
  parseModelList(config.inferenceModels).flatMap((entry) => {
    const id = modelEntryId(entry);
    return id ? [id] : [];
  });

const toImportedModel = (entry: unknown): ModelSpec[] => {
  const id = modelEntryId(entry);
  if (!id) return [];
  const record = asRecord(entry);
  return [toModelSpec({ id, name: record.displayName ?? record.name })];
};

const orderedModelIds = (provider: ProviderProfile, defaultModel: string | undefined): string[] => {
  const ids = provider.models.map((model) => model.id);
  return defaultModel && ids.includes(defaultModel) ? [defaultModel, ...ids.filter((id) => id !== defaultModel)] : ids;
};

const buildConfig = (provider: ProviderProfile, baseUrl: string, models: string[], existing: ConfigRecord): ConfigRecord => ({
  ...omitKeys(existing, MANAGED_KEYS),
  inferenceProvider: GATEWAY_PROVIDER,
  inferenceGatewayBaseUrl: baseUrl,
  inferenceGatewayApiKey: provider.token,
  inferenceModels: models,
});

const connect = async (paths: ClaudeDesktopPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, CLAUDE_DESKTOP_PROTOCOLS, LABEL);
  const path = configPath(paths, provider.name);
  const existing = (await readConfigFile(path)) ?? {};
  const config = buildConfig(provider, withoutV1(endpoint.baseUrl), orderedModelIds(provider, options.defaultModel), existing);
  await writeOwnedConfigFile(path, `${JSON.stringify(config, null, 2)}\n`);
};

const disconnect = async (paths: ClaudeDesktopPaths, providerId: string): Promise<void> => {
  await removeOwnedConfigFile(configPath(paths, providerId));
};

const providerIdFromFile = (fileName: string): string => {
  const stem = basename(fileName, JSON_EXTENSION);
  return stem.startsWith(FILE_PREFIX) && stem.length > FILE_PREFIX.length ? stem.slice(FILE_PREFIX.length) : stem;
};

const isGatewayConfig = (config: ConfigRecord): boolean => {
  const provider = readString(config.inferenceProvider);
  return provider === undefined || provider === GATEWAY_PROVIDER;
};

const fromLibraryFile = async (paths: ClaudeDesktopPaths, fileName: string): Promise<ImportedProvider[]> => {
  const config = await readConfigFile(join(libraryDir(paths), fileName));
  const baseUrl = readString(config?.inferenceGatewayBaseUrl);
  if (!config || !baseUrl || !isGatewayConfig(config)) return [];
  const id = providerIdFromFile(fileName);
  return [
    {
      source: "claude-desktop",
      id,
      displayName: readString(config.name) ?? id,
      token: literalToken(config.inferenceGatewayApiKey),
      endpoints: [{ protocol: "anthropic-messages", baseUrl: withoutV1(baseUrl) }],
      models: parseModelList(config.inferenceModels).flatMap(toImportedModel),
    },
  ];
};

const libraryFiles = async (paths: ClaudeDesktopPaths): Promise<string[]> => {
  try {
    const names = await readdir(libraryDir(paths));
    return names.filter((name) => name.endsWith(JSON_EXTENSION) && name !== META_FILE_NAME).sort();
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }
};

const readProviders = async (paths: ClaudeDesktopPaths): Promise<ImportedProvider[]> => {
  const files = await libraryFiles(paths);
  const imported = await Promise.all(files.map((fileName) => fromLibraryFile(paths, fileName)));
  return imported.flat();
};

const isConnected = async (paths: ClaudeDesktopPaths, providerId: string): Promise<boolean> =>
  (await readConfigFile(configPath(paths, providerId))) !== null;

const readDefaultModel = async (paths: ClaudeDesktopPaths, providerId: string): Promise<string | null> => {
  const config = await readConfigFile(configPath(paths, providerId));
  return config ? (modelIds(config)[0] ?? null) : null;
};

const detect = async (paths: ClaudeDesktopPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, [], [...paths.appBundles, paths.configDir]),
  configPath: libraryDir(paths),
});

export const claudeDesktopNotice = (provider: ProviderProfile): string =>
  `Open Claude Desktop, go to Developer, Configure third-party inference, select the ${FILE_PREFIX}${provider.name} config, then relaunch Claude Desktop.`;

export const createClaudeDesktopAdapter = (
  paths: ClaudeDesktopPaths,
  probes: DetectionProbes = defaultProbes,
): HarnessAdapter => ({
  id: "claude-desktop",
  label: LABEL,
  protocols: CLAUDE_DESKTOP_PROTOCOLS,
  exclusive: false,
  experimental: true,
  setsDefaultModel: true,
  connectNotice: claudeDesktopNotice,
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const claudeDesktopAdapter = createClaudeDesktopAdapter(defaultClaudeDesktopPaths());
