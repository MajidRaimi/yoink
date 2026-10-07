import { mkdir, rm, stat, utimes, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { writeFileAtomic } from "../../shared/atomic-write";
import { isRecord } from "../../shared/guards";
import { YOINK_DIR } from "../../shared/paths";
import { MODEL_SPEC_DEFAULTS } from "../profiles/model-spec";
import type { ModelInput, ModelSpec } from "../profiles/types";
import type { Fetcher, ProviderModel } from "./types";

const CATALOG_URL = "https://models.dev/api.json";
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
const CATALOG_TIMEOUT_MS = 10000;
const STALE_CATALOG_TIMEOUT_MS = 3000;
const RETRY_BACKOFF_MS = 60 * 60 * 1000;
const SUPPORTED_INPUTS: readonly ModelInput[] = ["text", "image"];

export const DEFAULT_CATALOG_CACHE_PATH = join(YOINK_DIR, "cache", "models-dev.json");

export type CatalogData = Record<string, unknown>;

export type CatalogEntry = {
  id: string;
  name: string;
  contextWindow: number | null;
  maxOutput: number | null;
  reasoning: boolean;
  input: ModelInput[];
};

export type CatalogAffinity = {
  presetId?: string;
  baseUrls?: readonly string[];
};

export type CatalogOptions = {
  fetcher?: Fetcher;
  cachePath?: string;
  now?: () => number;
  affinity?: CatalogAffinity;
};

type SourcedEntry = {
  entry: CatalogEntry;
  providerKey: string;
  apiHost: string | null;
};

type CatalogIndex = Map<string, SourcedEntry[]>;

type AffinityMatcher = (candidate: SourcedEntry) => boolean;

const positiveNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

const isModelInput = (value: unknown): value is ModelInput =>
  SUPPORTED_INPUTS.some((input) => input === value);

const parseInputs = (modalities: unknown): ModelInput[] => {
  const raw = isRecord(modalities) && Array.isArray(modalities.input) ? modalities.input : [];
  const inputs = raw.filter(isModelInput);
  return inputs.includes("text") ? inputs : ["text", ...inputs];
};

const toCatalogEntry = (key: string, raw: unknown): CatalogEntry | null => {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : key;
  const limit = isRecord(raw.limit) ? raw.limit : {};
  return {
    id,
    name: typeof raw.name === "string" && raw.name.length > 0 ? raw.name : id,
    contextWindow: positiveNumber(limit.context),
    maxOutput: positiveNumber(limit.output),
    reasoning: raw.reasoning === true,
    input: parseInputs(raw.modalities),
  };
};

const providerEntries = (provider: unknown): CatalogEntry[] => {
  if (!isRecord(provider) || !isRecord(provider.models)) return [];
  return Object.entries(provider.models)
    .map(([key, raw]) => toCatalogEntry(key, raw))
    .filter((entry): entry is CatalogEntry => entry !== null);
};

const hostOf = (url: unknown): string | null => {
  if (typeof url !== "string") return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const domainLabel = (host: string): string | null => {
  const labels = host.split(".");
  return labels.length >= 2 ? (labels[labels.length - 2] ?? null) : null;
};

const sourcedEntries = (catalog: CatalogData | null): SourcedEntry[] =>
  catalog === null
    ? []
    : Object.entries(catalog).flatMap(([providerKey, provider]) => {
        const apiHost = isRecord(provider) ? hostOf(provider.api) : null;
        return providerEntries(provider).map((entry) => ({ entry, providerKey: providerKey.toLowerCase(), apiHost }));
      });

const bareId = (id: string): string => (id.split("/").pop() ?? id).toLowerCase();

const buildIndex = (candidates: SourcedEntry[]): CatalogIndex => {
  const index: CatalogIndex = new Map();
  for (const candidate of candidates) {
    const key = bareId(candidate.entry.id);
    const bucket = index.get(key);
    if (bucket) bucket.push(candidate);
    else index.set(key, [candidate]);
  }
  return index;
};

const affinityMatcher = (affinity: CatalogAffinity = {}): AffinityMatcher => {
  const hosts = (affinity.baseUrls ?? []).map(hostOf).filter((host): host is string => host !== null);
  const keys = new Set(
    [affinity.presetId?.toLowerCase(), ...hosts.map(domainLabel)].filter(
      (key): key is string => typeof key === "string" && key.length > 0,
    ),
  );
  const hostSet = new Set(hosts);
  return (candidate) => keys.has(candidate.providerKey) || (candidate.apiHost !== null && hostSet.has(candidate.apiHost));
};

const completeness = (entry: CatalogEntry): number =>
  (entry.contextWindow === null ? 0 : 1) + (entry.maxOutput === null ? 0 : 1);

type RankedCandidate = { candidate: SourcedEntry; tier: number };

const tierOf = (candidate: SourcedEntry, exact: boolean, isAffine: AffinityMatcher): number =>
  (exact ? 0 : 2) + (isAffine(candidate) ? 0 : 1);

const outranks = (challenger: RankedCandidate, incumbent: RankedCandidate): boolean => {
  const challengerScore = completeness(challenger.candidate.entry);
  const incumbentScore = completeness(incumbent.candidate.entry);
  const challengerHasLimits = challengerScore > 0;
  const incumbentHasLimits = incumbentScore > 0;
  if (challengerHasLimits !== incumbentHasLimits) return challengerHasLimits;
  if (challenger.tier !== incumbent.tier) return challenger.tier < incumbent.tier;
  return challengerScore > incumbentScore;
};

const bestRanked = (ranked: RankedCandidate[]): RankedCandidate | undefined =>
  ranked.reduce<RankedCandidate | undefined>(
    (best, current) => (best === undefined || outranks(current, best) ? current : best),
    undefined,
  );

const findEntry = (index: CatalogIndex, id: string, isAffine: AffinityMatcher): CatalogEntry | undefined => {
  const ranked = (index.get(bareId(id)) ?? []).map((candidate) => ({
    candidate,
    tier: tierOf(candidate, candidate.entry.id === id, isAffine),
  }));
  return bestRanked(ranked)?.candidate.entry;
};

const toModelSpec = (model: ProviderModel, entry: CatalogEntry | undefined): ModelSpec => ({
  id: model.id,
  name: model.name !== model.id ? model.name : (entry?.name ?? model.name),
  contextWindow: entry?.contextWindow ?? MODEL_SPEC_DEFAULTS.contextWindow,
  maxOutput: entry?.maxOutput ?? MODEL_SPEC_DEFAULTS.maxOutput,
  reasoning: entry?.reasoning ?? MODEL_SPEC_DEFAULTS.reasoning,
  input: entry ? [...entry.input] : [...MODEL_SPEC_DEFAULTS.input],
});

export const matchModelSpecs = (
  models: ProviderModel[],
  catalog: CatalogData | null,
  affinity: CatalogAffinity = {},
): ModelSpec[] => {
  const index = buildIndex(sourcedEntries(catalog));
  const isAffine = affinityMatcher(affinity);
  return models.map((model) => toModelSpec(model, findEntry(index, model.id, isAffine)));
};

const parseCatalog = (text: string): CatalogData | null => {
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const cacheAgeMs = async (path: string, now: number): Promise<number | null> => {
  try {
    return now - (await stat(path)).mtimeMs;
  } catch {
    return null;
  }
};

const readCache = async (path: string): Promise<CatalogData | null> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return parseCatalog(await file.text());
};

const writeCache = async (path: string, text: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFileAtomic(path, text, 0o600);
};

export const retryMarkerPath = (cachePath: string): string => `${cachePath}.attempted`;

const recordFailedAttempt = async (cachePath: string, now: number): Promise<void> => {
  const marker = retryMarkerPath(cachePath);
  const at = new Date(now);
  try {
    await writeFile(marker, "", { mode: 0o600 });
    await utimes(marker, at, at);
  } catch {
    return;
  }
};

const downloadCatalog = async (
  fetcher: Fetcher,
  timeoutMs: number,
): Promise<{ text: string; data: CatalogData } | null> => {
  try {
    const response = await fetcher(CATALOG_URL, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) return null;
    const text = await response.text();
    const data = parseCatalog(text);
    return data ? { text, data } : null;
  } catch {
    return null;
  }
};

export const loadCatalog = async (options: CatalogOptions = {}): Promise<CatalogData | null> => {
  const cachePath = options.cachePath ?? DEFAULT_CATALOG_CACHE_PATH;
  const now = (options.now ?? Date.now)();
  const age = await cacheAgeMs(cachePath, now);
  const cached = age === null ? null : await readCache(cachePath);
  if (cached && age !== null && age < CATALOG_TTL_MS) return cached;
  if (cached) {
    const sinceAttempt = await cacheAgeMs(retryMarkerPath(cachePath), now);
    if (sinceAttempt !== null && sinceAttempt >= 0 && sinceAttempt < RETRY_BACKOFF_MS) return cached;
  }
  const timeoutMs = cached ? STALE_CATALOG_TIMEOUT_MS : CATALOG_TIMEOUT_MS;
  const downloaded = await downloadCatalog(options.fetcher ?? fetch, timeoutMs);
  if (!downloaded) {
    if (cached) await recordFailedAttempt(cachePath, now);
    return cached;
  }
  await writeCache(cachePath, downloaded.text);
  await rm(retryMarkerPath(cachePath), { force: true });
  return downloaded.data;
};

export const lookupModelSpecs = async (models: ProviderModel[], options: CatalogOptions = {}): Promise<ModelSpec[]> =>
  matchModelSpecs(models, await loadCatalog(options), options.affinity);
