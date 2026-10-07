import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import type { ProviderProfile } from "../../profiles/types";
import { isMissingFileError } from "../../../shared/fs-errors";
import { parseJsonText, readJsonFile } from "../../../shared/json-file";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { removeOwnedConfigFile, writeOwnedConfigFile } from "./config-file";
import { asRecord, readString, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import {
  GOOSE_PROTOCOLS,
  buildGooseProvider,
  gooseApiKeyEnv,
  gooseProviderName,
  importGooseProvider,
} from "./goose-schema";
import { requireEndpoint } from "./require-endpoint";
import { loadYamlDocument, readYamlDocument, writeYamlDocument } from "./yaml-document";

export type GoosePaths = {
  configDir: string;
};

const LABEL = "Goose";
const PROVIDER_KEY = "GOOSE_PROVIDER";
const MODEL_KEY = "GOOSE_MODEL";
const DISABLE_KEYRING_KEY = "GOOSE_DISABLE_KEYRING";
const CUSTOM_PROVIDERS_DIR = "custom_providers";
const TRUTHY_VALUES = ["true", "1", "yes", "on"];
const MAC_APP_PATH = "/Applications/Goose.app";

const platformConfigDir = (): string => {
  if (process.platform === "win32" && process.env.APPDATA) return join(process.env.APPDATA, "Block", "goose", "config");
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "goose");
};

export const defaultGoosePaths = (): GoosePaths => ({
  configDir: process.env.GOOSE_PATH_ROOT ? join(process.env.GOOSE_PATH_ROOT, "config") : platformConfigDir(),
});

const configPath = (paths: GoosePaths): string => join(paths.configDir, "config.yaml");
const secretsPath = (paths: GoosePaths): string => join(paths.configDir, "secrets.yaml");
const customProvidersDir = (paths: GoosePaths): string => join(paths.configDir, CUSTOM_PROVIDERS_DIR);
const customProviderPath = (paths: GoosePaths, providerId: string): string =>
  join(customProvidersDir(paths), `${gooseProviderName(providerId)}.json`);

const isTruthy = (value: unknown): boolean =>
  value === true || (value !== false && value !== null && TRUTHY_VALUES.includes(String(value).trim().toLowerCase()));

const keyringDisabledIn = (config: unknown): boolean =>
  isTruthy(process.env[DISABLE_KEYRING_KEY]) || isTruthy(asRecord(config)[DISABLE_KEYRING_KEY]);

const keyringDisabledSync = (paths: GoosePaths): boolean => {
  try {
    return keyringDisabledIn(parse(readFileSync(configPath(paths), "utf8")));
  } catch {
    return keyringDisabledIn(null);
  }
};

const readYamlRecord = async (path: string): Promise<ConfigRecord> => asRecord((await readYamlDocument(path))?.toJS());

const storeSecret = async (paths: GoosePaths, name: string, token: string): Promise<void> => {
  const path = secretsPath(paths);
  const document = await loadYamlDocument(path);
  if (document.get(name) === token) return;
  document.set(name, token);
  await writeYamlDocument(path, document);
};

const removeSecret = async (paths: GoosePaths, name: string): Promise<void> => {
  const path = secretsPath(paths);
  const document = await readYamlDocument(path);
  if (!document?.has(name)) return;
  document.delete(name);
  await writeYamlDocument(path, document);
};

const setDefaultModel = async (paths: GoosePaths, providerId: string, modelId: string): Promise<void> => {
  const path = configPath(paths);
  const document = await loadYamlDocument(path);
  document.set(PROVIDER_KEY, gooseProviderName(providerId));
  document.set(MODEL_KEY, modelId);
  await writeYamlDocument(path, document);
};

const clearDefaultModel = async (paths: GoosePaths, providerId: string): Promise<void> => {
  const path = configPath(paths);
  const document = await readYamlDocument(path);
  if (!document || document.get(PROVIDER_KEY) !== gooseProviderName(providerId)) return;
  document.delete(PROVIDER_KEY);
  document.delete(MODEL_KEY);
  await writeYamlDocument(path, document);
};

const connect = async (paths: GoosePaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, GOOSE_PROTOCOLS, LABEL);
  const path = customProviderPath(paths, provider.name);
  const existing = await readJsonFile<unknown>(path);
  const entry = buildGooseProvider(provider, endpoint, existing);
  await writeOwnedConfigFile(path, `${JSON.stringify(entry, null, 2)}\n`);
  if (keyringDisabledIn(await readYamlRecord(configPath(paths)))) {
    await storeSecret(paths, gooseApiKeyEnv(provider.name), provider.token);
  }
  if (options.defaultModel) await setDefaultModel(paths, provider.name, options.defaultModel);
};

const disconnect = async (paths: GoosePaths, providerId: string): Promise<void> => {
  await clearDefaultModel(paths, providerId);
  await removeSecret(paths, gooseApiKeyEnv(providerId));
  await removeOwnedConfigFile(customProviderPath(paths, providerId));
};

const customProviderFiles = async (paths: GoosePaths): Promise<string[]> => {
  try {
    const names = await readdir(customProvidersDir(paths));
    return names.filter((name) => name.endsWith(".json")).sort();
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }
};

const readCustomProvider = async (
  paths: GoosePaths,
  fileName: string,
  secrets: ConfigRecord,
): Promise<ImportedProvider[]> => {
  const path = join(customProvidersDir(paths), fileName);
  const text = await Bun.file(path).text();
  if (text.trim().length === 0) return [];
  const imported = importGooseProvider(parseJsonText<unknown>(path, text), secrets, fileName.replace(/\.json$/, ""));
  return imported ? [imported] : [];
};

const readProviders = async (paths: GoosePaths): Promise<ImportedProvider[]> => {
  const secrets = await readYamlRecord(secretsPath(paths));
  const files = await customProviderFiles(paths);
  const providers = await Promise.all(files.map((fileName) => readCustomProvider(paths, fileName, secrets)));
  return providers.flat();
};

const isConnected = (paths: GoosePaths, providerId: string): Promise<boolean> =>
  Bun.file(customProviderPath(paths, providerId)).exists();

const readDefaultModel = async (paths: GoosePaths, providerId: string): Promise<string | null> => {
  const config = await readYamlRecord(configPath(paths));
  if (config[PROVIDER_KEY] !== gooseProviderName(providerId)) return null;
  return readString(config[MODEL_KEY]) ?? null;
};

const connectNotice = (paths: GoosePaths, provider: ProviderProfile): string | undefined => {
  if (keyringDisabledSync(paths)) return undefined;
  const envName = gooseApiKeyEnv(provider.name);
  return `Goose reads the ${provider.provider} key from ${envName}. Export ${envName} in your shell, or enter the key once in Goose (goose configure) to store it in the keyring.`;
};

const detect = async (paths: GoosePaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["goose"], [paths.configDir, MAC_APP_PATH]),
  configPath: configPath(paths),
});

export const createGooseAdapter = (paths: GoosePaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "goose",
  label: LABEL,
  protocols: GOOSE_PROTOCOLS,
  exclusive: false,
  experimental: true,
  setsDefaultModel: true,
  connectNotice: (provider) => connectNotice(paths, provider),
  detect: () => detect(paths, probes),
  writeTargets: async (provider) => [configPath(paths), secretsPath(paths), customProviderPath(paths, provider.name)],
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const gooseAdapter = createGooseAdapter(defaultGoosePaths());
