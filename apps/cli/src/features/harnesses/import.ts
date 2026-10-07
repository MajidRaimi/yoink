import { errorMessage } from "../../shared/errors";
import { MODEL_SPEC_DEFAULTS } from "../profiles/model-spec";
import type { Endpoint, HarnessId, ModelSpec, Profile } from "../profiles/types";
import { HARNESS_ADAPTERS } from "./registry";
import type { HarnessAdapter, ImportedProvider } from "./types";

export type ImportCandidate = {
  id: string;
  displayName: string;
  token: string;
  endpoints: Endpoint[];
  models: ModelSpec[];
  sources: HarnessId[];
  unkeyedSources: HarnessId[];
};

export type HarnessReadFailure = {
  source: HarnessId;
  label: string;
  message: string;
};

export type ImportScan = {
  candidates: ImportCandidate[];
  failures: HarnessReadFailure[];
};

type HarnessRead = {
  providers: ImportedProvider[];
  failure: HarnessReadFailure | null;
};

type KeyedProvider = ImportedProvider & { token: string };

const primaryUrl = (provider: ImportedProvider): string => provider.endpoints[0]?.baseUrl ?? "";

const candidateKey = (provider: KeyedProvider): string => `${provider.token}\u0000${primaryUrl(provider)}`;

const mergeEndpoints = (current: Endpoint[], incoming: Endpoint[]): Endpoint[] => [
  ...current,
  ...incoming.filter((endpoint) => !current.some((existing) => existing.protocol === endpoint.protocol)),
];

const preferExplicit = <T>(current: T, incoming: T, fallback: T): T => (current !== fallback ? current : incoming);

const mergeModelSpec = (current: ModelSpec, incoming: ModelSpec): ModelSpec => ({
  id: current.id,
  name: preferExplicit(current.name, incoming.name, current.id),
  contextWindow: preferExplicit(current.contextWindow, incoming.contextWindow, MODEL_SPEC_DEFAULTS.contextWindow),
  maxOutput: preferExplicit(current.maxOutput, incoming.maxOutput, MODEL_SPEC_DEFAULTS.maxOutput),
  reasoning: current.reasoning || incoming.reasoning,
  input: [...new Set([...current.input, ...incoming.input])],
});

export const mergeModels = (current: ModelSpec[], incoming: ModelSpec[]): ModelSpec[] => [
  ...current.map((model) => {
    const twin = incoming.find((candidate) => candidate.id === model.id);
    return twin ? mergeModelSpec(model, twin) : model;
  }),
  ...incoming.filter((model) => !current.some((existing) => existing.id === model.id)),
];

const readHarness = async (adapter: HarnessAdapter): Promise<HarnessRead> => {
  try {
    if (!(await adapter.detect()).installed) return { providers: [], failure: null };
    return { providers: await adapter.readProviders(), failure: null };
  } catch (error) {
    return { providers: [], failure: { source: adapter.id, label: adapter.label, message: errorMessage(error) } };
  }
};

const hasToken = (provider: ImportedProvider): provider is KeyedProvider =>
  provider.token !== null && provider.token.length > 0;

const addSource = (sources: HarnessId[], source: HarnessId): void => {
  if (!sources.includes(source)) sources.push(source);
};

const absorb = (candidate: ImportCandidate, provider: ImportedProvider): void => {
  candidate.endpoints = mergeEndpoints(candidate.endpoints, provider.endpoints);
  candidate.models = mergeModels(candidate.models, provider.models);
  if (hasToken(provider)) addSource(candidate.sources, provider.source);
  else if (!candidate.sources.includes(provider.source)) addSource(candidate.unkeyedSources, provider.source);
};

const toCandidate = (provider: KeyedProvider): ImportCandidate => ({
  id: provider.id,
  displayName: provider.displayName,
  token: provider.token,
  endpoints: [...provider.endpoints],
  models: [...provider.models],
  sources: [provider.source],
  unkeyedSources: [],
});

const sharesEndpoint = (candidate: ImportCandidate, provider: ImportedProvider): boolean =>
  provider.endpoints.some((endpoint) => candidate.endpoints.some((existing) => existing.baseUrl === endpoint.baseUrl));

export const mergeImportedProviders = (found: ImportedProvider[]): ImportCandidate[] => {
  const merged = new Map<string, ImportCandidate>();
  for (const provider of found.filter(hasToken)) {
    const key = candidateKey(provider);
    const existing = merged.get(key);
    if (existing) absorb(existing, provider);
    else merged.set(key, toCandidate(provider));
  }
  const candidates = [...merged.values()];
  for (const provider of found.filter((entry) => !hasToken(entry))) {
    const match = candidates.find((candidate) => candidate.id === provider.id && sharesEndpoint(candidate, provider));
    if (match) absorb(match, provider);
  }
  return candidates;
};

const alreadyManaged = (candidate: ImportCandidate, profiles: Profile[]): boolean =>
  profiles.some(
    (profile) =>
      profile.type === "external" &&
      profile.token === candidate.token &&
      (profile.endpoints ?? [{ baseUrl: profile.baseUrl }]).some((endpoint) =>
        candidate.endpoints.some((incoming) => incoming.baseUrl === endpoint.baseUrl),
      ),
  );

export const filterUnmanaged = (candidates: ImportCandidate[], profiles: Profile[]): ImportCandidate[] =>
  candidates.filter((candidate) => !alreadyManaged(candidate, profiles));

export const scanHarnesses = async (
  profiles: Profile[],
  adapters: readonly HarnessAdapter[] = HARNESS_ADAPTERS,
): Promise<ImportScan> => {
  const reads = await Promise.all(adapters.map(readHarness));
  const found = reads.flatMap((read) => read.providers);
  return {
    candidates: filterUnmanaged(mergeImportedProviders(found), profiles),
    failures: reads.flatMap((read) => (read.failure ? [read.failure] : [])),
  };
};

export const describeReadFailure = (failure: HarnessReadFailure): string =>
  `Could not read ${failure.label} config: ${failure.message}`;
