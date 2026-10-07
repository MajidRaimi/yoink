import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { YAMLSeq, isMap, isSeq, type Document } from "yaml";
import { YoinkError } from "../../../shared/errors";
import { readTextFile } from "../../../shared/json-file";
import type { Endpoint, ModelSpec, ProviderProfile } from "../../profiles/types";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { asRecord, readString, type ConfigRecord } from "./config-values";
import {
  CONTINUE_PROTOCOLS,
  buildContinueModelEntry,
  importContinueProviders,
  isOwnedEntry,
  ownedEntryName,
} from "./continue-schema";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { parseJsoncObject } from "./jsonc-document";
import { requireEndpoint } from "./require-endpoint";
import { loadYamlDocument, readYamlDocument, writeYamlDocument } from "./yaml-document";

export type ContinuePaths = {
  configDir: string;
  vscodeExtensionsDir: string;
};

const LABEL = "Continue";
const MODELS_KEY = "models";
const EXTENSION_PREFIX = "continue.continue-";
const NEW_CONFIG_HEADER: ConfigRecord = { name: "Local Config", version: "1.0.0", schema: "v1" };

type SeqItem = YAMLSeq["items"][number];

export const defaultContinuePaths = (): ContinuePaths => ({
  configDir: join(homedir(), ".continue"),
  vscodeExtensionsDir: join(homedir(), ".vscode", "extensions"),
});

const configPath = (paths: ContinuePaths): string => join(paths.configDir, "config.yaml");

const legacyConfigPath = (paths: ContinuePaths): string => join(paths.configDir, "config.json");

const usesLegacyConfig = async (paths: ContinuePaths): Promise<boolean> =>
  !(await Bun.file(configPath(paths)).exists()) && (await Bun.file(legacyConfigPath(paths)).exists());

const activeConfigPath = async (paths: ContinuePaths): Promise<string> =>
  (await usesLegacyConfig(paths)) ? legacyConfigPath(paths) : configPath(paths);

const assertNotLegacy = async (paths: ContinuePaths): Promise<void> => {
  if (!(await usesLegacyConfig(paths))) return;
  throw new YoinkError(
    `Continue is still using the legacy ${legacyConfigPath(paths)}. Creating config.yaml would hide it, so migrate first with Continue's "Convert config.json to config.yaml" action, then connect again.`,
  );
};

const legacyModelEntry = (entry: unknown): unknown => {
  const record = asRecord(entry);
  const completion = asRecord(record.completionOptions);
  return {
    ...record,
    name: readString(record.title) ?? readString(record.name),
    defaultCompletionOptions: { contextLength: record.contextLength, maxTokens: completion.maxTokens },
  };
};

const readLegacyModels = async (paths: ContinuePaths): Promise<unknown[]> => {
  const path = legacyConfigPath(paths);
  const text = await readTextFile(path);
  if (text === null) return [];
  const models = parseJsoncObject(path, text)[MODELS_KEY];
  return Array.isArray(models) ? models.map(legacyModelEntry) : [];
};

const itemJson = (item: SeqItem): unknown => (isMap(item) ? item.toJSON() : item);

const ownedBy = (item: SeqItem, providerId: string): boolean => isOwnedEntry(itemJson(item), providerId);

const itemModelId = (item: SeqItem): string | undefined => readString(asRecord(itemJson(item)).model);

const loadDocument = async (path: string): Promise<Document> => {
  const document = await loadYamlDocument(path);
  if (document.contents === null) document.contents = document.createNode({ ...NEW_CONFIG_HEADER, [MODELS_KEY]: [] });
  return document;
};

const modelsSeq = (document: Document | null): YAMLSeq | null => {
  const node = document?.get(MODELS_KEY, true);
  return isSeq(node) ? node : null;
};

const ensureModelsSeq = (document: Document): YAMLSeq => {
  const existing = modelsSeq(document);
  if (existing && existing.items.length === 0) existing.flow = false;
  if (existing) return existing;
  const created = new YAMLSeq(document.schema);
  document.set(MODELS_KEY, created);
  return created;
};

const mergeIntoItem = (document: Document, item: SeqItem, entry: ConfigRecord): SeqItem => {
  if (!isMap(item)) return document.createNode(entry);
  const current = asRecord(item.toJSON());
  for (const [key, value] of Object.entries(entry)) {
    if (!isDeepStrictEqual(current[key], value)) item.set(key, document.createNode(value));
  }
  return item;
};

const buildItems = (
  document: Document,
  provider: ProviderProfile,
  endpoint: Endpoint,
  previous: readonly SeqItem[],
): SeqItem[] =>
  provider.models.map((model: ModelSpec) => {
    const entry = buildContinueModelEntry(provider, endpoint, model);
    const name = ownedEntryName(provider.name, model);
    const match = previous.find((item) => readString(asRecord(itemJson(item)).name) === name);
    return match ? mergeIntoItem(document, match, entry) : document.createNode(entry);
  });

const moveToTop = (items: readonly SeqItem[], providerId: string, modelId: string): SeqItem[] => {
  const index = items.findIndex((item) => ownedBy(item, providerId) && itemModelId(item) === modelId);
  if (index <= 0) return [...items];
  const target = items[index] as SeqItem;
  return [target, ...items.slice(0, index), ...items.slice(index + 1)];
};

const connect = async (paths: ContinuePaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, CONTINUE_PROTOCOLS, LABEL);
  await assertNotLegacy(paths);
  const path = configPath(paths);
  const document = await loadDocument(path);
  const seq = ensureModelsSeq(document);
  const previous = seq.items.filter((item) => ownedBy(item, provider.name));
  const firstOwned = seq.items.findIndex((item) => ownedBy(item, provider.name));
  const others = seq.items.filter((item) => !ownedBy(item, provider.name));
  const insertAt = firstOwned === -1 ? others.length : firstOwned;
  const ours = buildItems(document, provider, endpoint, previous);
  const merged = [...others.slice(0, insertAt), ...ours, ...others.slice(insertAt)];
  seq.items = options.defaultModel ? moveToTop(merged, provider.name, options.defaultModel) : merged;
  await writeYamlDocument(path, document);
};

const disconnect = async (paths: ContinuePaths, providerId: string): Promise<void> => {
  const path = configPath(paths);
  const document = await readYamlDocument(path);
  const seq = modelsSeq(document);
  if (!document || !seq || !seq.items.some((item) => ownedBy(item, providerId))) return;
  seq.items = seq.items.filter((item) => !ownedBy(item, providerId));
  await writeYamlDocument(path, document);
};

const readModelItems = async (paths: ContinuePaths): Promise<SeqItem[]> =>
  modelsSeq(await readYamlDocument(configPath(paths)))?.items ?? [];

const readProviders = async (paths: ContinuePaths): Promise<ImportedProvider[]> =>
  importContinueProviders(
    (await usesLegacyConfig(paths)) ? await readLegacyModels(paths) : (await readModelItems(paths)).map(itemJson),
  );

const isConnected = async (paths: ContinuePaths, providerId: string): Promise<boolean> =>
  (await readModelItems(paths)).some((item) => ownedBy(item, providerId));

const readDefaultModel = async (paths: ContinuePaths, providerId: string): Promise<string | null> => {
  const [first] = await readModelItems(paths);
  return first !== undefined && ownedBy(first, providerId) ? (itemModelId(first) ?? null) : null;
};

const hasVsCodeExtension = async (extensionsDir: string): Promise<boolean> => {
  const entries = await readdir(extensionsDir).catch((): string[] => []);
  return entries.some((entry) => entry.startsWith(EXTENSION_PREFIX));
};

const detect = async (paths: ContinuePaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed:
    (await isInstalled(probes, ["cn"], [paths.configDir])) || (await hasVsCodeExtension(paths.vscodeExtensionsDir)),
  configPath: await activeConfigPath(paths),
});

export const createContinueAdapter = (paths: ContinuePaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "continue",
  label: LABEL,
  protocols: CONTINUE_PROTOCOLS,
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

export const continueAdapter = createContinueAdapter(defaultContinuePaths());
