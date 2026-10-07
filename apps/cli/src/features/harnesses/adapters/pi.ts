import { homedir } from "node:os";
import { join } from "node:path";
import type { ProviderProfile } from "../../profiles/types";
import { YoinkError } from "../../../shared/errors";
import { parseJsonText, readTextFile } from "../../../shared/json-file";
import type { ConnectOptions, HarnessAdapter, HarnessDetection, ImportedProvider } from "../types";
import { writeConfigFile } from "./config-file";
import { asRecord, isRecord, type ConfigRecord } from "./config-values";
import { defaultProbes, isInstalled, type DetectionProbes } from "./detection";
import { modelIdFromRef, qualifiedModelRef, refersToProvider } from "./model-mapping";
import { PI_PROTOCOLS, buildPiProviderEntry, importPiProviders } from "./pi-schema";
import { requireEndpoint } from "./require-endpoint";

export type PiPaths = {
  agentDir: string;
};

const LABEL = "pi";

export const defaultPiPaths = (): PiPaths => ({
  agentDir: process.env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent"),
});

const modelsPath = (paths: PiPaths): string => join(paths.agentDir, "models.json");
const settingsPath = (paths: PiPaths): string => join(paths.agentDir, "settings.json");

const readJsonObject = async (path: string): Promise<ConfigRecord | null> => {
  const text = await readTextFile(path);
  if (text === null) return null;
  if (text.trim().length === 0) return {};
  const parsed = parseJsonText<unknown>(path, text);
  if (!isRecord(parsed)) throw new YoinkError(`Expected a JSON object in ${path}.`);
  return parsed;
};

const writeJsonObject = (path: string, value: ConfigRecord): Promise<void> =>
  writeConfigFile(path, `${JSON.stringify(value, null, 2)}\n`);

const setDefaultModel = async (paths: PiPaths, providerId: string, modelId: string): Promise<void> => {
  const path = settingsPath(paths);
  const settings = (await readJsonObject(path)) ?? {};
  await writeJsonObject(path, {
    ...settings,
    defaultProvider: providerId,
    defaultModel: qualifiedModelRef(providerId, modelId),
  });
};

const clearDefaultModel = async (paths: PiPaths, providerId: string): Promise<void> => {
  const path = settingsPath(paths);
  const settings = await readJsonObject(path);
  if (!settings) return;
  const pointsAtProvider =
    settings.defaultProvider === providerId || refersToProvider(settings.defaultModel, providerId);
  if (!pointsAtProvider) return;
  const { defaultProvider: _provider, defaultModel: _model, ...rest } = settings;
  await writeJsonObject(path, rest);
};

const connect = async (paths: PiPaths, provider: ProviderProfile, options: ConnectOptions): Promise<void> => {
  const endpoint = requireEndpoint(provider, PI_PROTOCOLS, LABEL);
  const path = modelsPath(paths);
  const config = (await readJsonObject(path)) ?? {};
  const providers = asRecord(config.providers);
  const entry = buildPiProviderEntry(provider, endpoint, providers[provider.name]);
  await writeJsonObject(path, { ...config, providers: { ...providers, [provider.name]: entry } });
  if (options.defaultModel) await setDefaultModel(paths, provider.name, options.defaultModel);
};

const disconnect = async (paths: PiPaths, providerId: string): Promise<void> => {
  await clearDefaultModel(paths, providerId);
  const path = modelsPath(paths);
  const config = await readJsonObject(path);
  const providers = asRecord(config?.providers);
  if (!config || !(providerId in providers)) return;
  const { [providerId]: _removed, ...remaining } = providers;
  await writeJsonObject(path, { ...config, providers: remaining });
};

const readProviders = async (paths: PiPaths): Promise<ImportedProvider[]> => {
  const config = await readJsonObject(modelsPath(paths));
  return config ? importPiProviders("pi", config.providers) : [];
};

const isConnected = async (paths: PiPaths, providerId: string): Promise<boolean> => {
  const config = await readJsonObject(modelsPath(paths));
  return providerId in asRecord(config?.providers);
};

const readDefaultModel = async (paths: PiPaths, providerId: string): Promise<string | null> => {
  const settings = await readJsonObject(settingsPath(paths));
  const modelRef = settings?.defaultModel;
  const qualified = modelIdFromRef(modelRef, providerId);
  if (qualified !== null) return qualified;
  return settings?.defaultProvider === providerId && typeof modelRef === "string" ? modelRef : null;
};

const detect = async (paths: PiPaths, probes: DetectionProbes): Promise<HarnessDetection> => ({
  installed: await isInstalled(probes, ["pi"], [paths.agentDir]),
  configPath: modelsPath(paths),
});

export const createPiAdapter = (paths: PiPaths, probes: DetectionProbes = defaultProbes): HarnessAdapter => ({
  id: "pi",
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

export const piAdapter = createPiAdapter(defaultPiPaths());
