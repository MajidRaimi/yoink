import { homedir } from "node:os";
import { join } from "node:path";
import type { Document } from "yaml";
import type { ProviderProfile } from "../../profiles/types";
import { parseJsonText, readTextFile } from "../../../shared/json-file";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { firstExisting, writeConfigFile } from "./config-file";
import { asRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { literalToken, modelIdFromRef, qualifiedModelRef, refersToProvider } from "./model-mapping";
import { PI_PROTOCOLS, buildPiProviderEntry, importPiProviders } from "./pi-schema";
import { requireEndpoint } from "./require-endpoint";
import { parseYamlDocument, readYamlDocument } from "./yaml-document";
import { setYamlEntry } from "./yaml-entry";

export type OmpPaths = {
  agentDir: string;
};

const LABEL = "omp";
const ENV_VAR_NAME = /^[A-Z_][A-Z0-9_]*$/;
const DEFAULT_ROLE_PATH = ["modelRoles", "default"];

export const defaultOmpPaths = (): OmpPaths => ({
  agentDir: join(homedir(), ".omp", "agent"),
});

const primaryModelsPath = (paths: OmpPaths): string => join(paths.agentDir, "models.yml");
const alternateModelsPath = (paths: OmpPaths): string => join(paths.agentDir, "models.yaml");
const legacyModelsPath = (paths: OmpPaths): string => join(paths.agentDir, "models.json");
const configPath = (paths: OmpPaths): string => join(paths.agentDir, "config.yml");

const resolveModelsPath = async (paths: OmpPaths): Promise<string> =>
  (await firstExisting([primaryModelsPath(paths), alternateModelsPath(paths)])) ?? primaryModelsPath(paths);

const ompToken = (value: unknown): string | null => {
  const token = literalToken(value);
  return token !== null && ENV_VAR_NAME.test(token) ? null : token;
};

const readLegacyRoot = async (paths: OmpPaths): Promise<Record<string, unknown>> => {
  const path = legacyModelsPath(paths);
  const text = await readTextFile(path);
  if (text === null || text.trim().length === 0) return {};
  return asRecord(parseJsonText<unknown>(path, text));
};

const loadDocument = async (path: string): Promise<Document> =>
  (await readYamlDocument(path)) ?? parseYamlDocument(path, "");

const saveDocument = (path: string, document: Document): Promise<void> => writeConfigFile(path, String(document));

const loadModelsDocument = async (paths: OmpPaths, path: string): Promise<Document> => {
  const existing = await readYamlDocument(path);
  if (existing) return existing;
  const document = parseYamlDocument(path, "");
  const legacyRoot = await readLegacyRoot(paths);
  if (Object.keys(legacyRoot).length > 0) document.contents = document.createNode(legacyRoot);
  return document;
};

const providersFromDocument = (document: Document | null): Record<string, unknown> =>
  asRecord(asRecord(document?.toJS()).providers);

const setDefaultModel = async (paths: OmpPaths, providerId: string, modelId: string): Promise<void> => {
  const path = configPath(paths);
  const document = await loadDocument(path);
  document.setIn(DEFAULT_ROLE_PATH, qualifiedModelRef(providerId, modelId));
  await saveDocument(path, document);
};

const clearDefaultModel = async (paths: OmpPaths, providerId: string): Promise<void> => {
  const path = configPath(paths);
  const document = await readYamlDocument(path);
  if (!document || !refersToProvider(document.getIn(DEFAULT_ROLE_PATH), providerId)) return;
  document.deleteIn(DEFAULT_ROLE_PATH);
  await saveDocument(path, document);
};

const connect = async (paths: OmpPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, PI_PROTOCOLS, LABEL);
  const path = await resolveModelsPath(paths);
  const document = await loadModelsDocument(paths, path);
  const existingEntry = providersFromDocument(document)[provider.name];
  setYamlEntry(document, ["providers", provider.name], buildPiProviderEntry(provider, endpoint, existingEntry));
  await saveDocument(path, document);
  if (options.defaultModel) await setDefaultModel(paths, provider.name, options.defaultModel);
};

const disconnect = async (paths: OmpPaths, providerId: string): Promise<void> => {
  await clearDefaultModel(paths, providerId);
  const path = await resolveModelsPath(paths);
  const document = await readYamlDocument(path);
  if (!document || !(providerId in providersFromDocument(document))) return;
  document.deleteIn(["providers", providerId]);
  await saveDocument(path, document);
};

const readModelProviders = async (paths: OmpPaths): Promise<Record<string, unknown>> => {
  const path = await firstExisting([primaryModelsPath(paths), alternateModelsPath(paths)]);
  return path ? providersFromDocument(await readYamlDocument(path)) : asRecord((await readLegacyRoot(paths)).providers);
};

const readProviders = async (paths: OmpPaths): Promise<ImportedProvider[]> =>
  importPiProviders("omp", await readModelProviders(paths), ompToken);

const isConnected = async (paths: OmpPaths, providerId: string): Promise<boolean> =>
  providerId in (await readModelProviders(paths));

const readDefaultModel = async (paths: OmpPaths, providerId: string): Promise<string | null> => {
  const document = await readYamlDocument(configPath(paths));
  return modelIdFromRef(document?.getIn(DEFAULT_ROLE_PATH), providerId);
};

const detect = async (paths: OmpPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["omp"], [paths.agentDir]),
  configPath: await resolveModelsPath(paths),
});

export const createOmpAdapter = (paths: OmpPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "omp",
  label: LABEL,
  protocols: PI_PROTOCOLS,
  exclusive: false,
  detect: () => detect(paths, probes),
  readProviders: () => readProviders(paths),
  isConnected: (providerId) => isConnected(paths, providerId),
  readDefaultModel: (providerId) => readDefaultModel(paths, providerId),
  connect: (provider, options) => connect(paths, provider, options),
  disconnect: (providerId) => disconnect(paths, providerId),
});

export const ompAdapter = createOmpAdapter(defaultOmpPaths());
