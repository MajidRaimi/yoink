import { errorMessage, YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { validateProviderId } from "../../shared/validators";
import { supportsAny } from "../harnesses/endpoint";
import type { ImportCandidate } from "../harnesses/import";
import type { HarnessOutcome } from "../harnesses/sync";
import type { HarnessAdapter } from "../harnesses/types";
import { slugify } from "../profiles/naming";
import { toProviderProfile, type ProfileStoreRepository } from "../profiles/store";
import type { HarnessId, ProviderProfile } from "../profiles/types";
import { buildProviderProfile } from "./build-profile";
import { isSameProvider } from "./harness-ownership";

export type ImportResult = { profile: ProviderProfile; outcomes: HarnessOutcome[] };

export type ImportProvider = (candidate: ImportCandidate) => Promise<ImportResult>;

export type ImportProviderDeps = {
  store: ProfileStoreRepository;
  adapters: readonly HarnessAdapter[];
};

type SourcePlan = {
  adapter: HarnessAdapter;
  sourceId: string;
};

type PlannedSources = {
  plans: SourcePlan[];
  skipped: HarnessOutcome[];
};

const failure = (id: HarnessId, message: string): HarnessOutcome => ({ id, ok: false, message });

const unsupportedMessage = (adapter: HarnessAdapter): string =>
  `Left unchanged: ${adapter.label} needs one of ${adapter.protocols.join(", ")}, which this provider does not offer.`;

const resolveSourceId = async (adapter: HarnessAdapter, candidate: ImportCandidate): Promise<string> => {
  const entries = (await adapter.readProviders()).filter((entry) => isSameProvider(candidate, entry));
  return (entries.find((entry) => entry.id === candidate.id) ?? entries[0])?.id ?? candidate.id;
};

const planSource = async (
  adapters: readonly HarnessAdapter[],
  source: HarnessId,
  candidate: ImportCandidate,
): Promise<SourcePlan | HarnessOutcome> => {
  const adapter = adapters.find((entry) => entry.id === source);
  if (!adapter) return failure(source, `Unknown harness "${source}".`);
  if (!supportsAny(candidate, adapter.protocols)) return failure(source, unsupportedMessage(adapter));
  try {
    return { adapter, sourceId: await resolveSourceId(adapter, candidate) };
  } catch (error) {
    return failure(source, `Left unchanged: ${errorMessage(error)}`);
  }
};

const isPlan = (value: SourcePlan | HarnessOutcome): value is SourcePlan => "adapter" in value;

const planSources = async (adapters: readonly HarnessAdapter[], candidate: ImportCandidate): Promise<PlannedSources> => {
  const sources = candidate.sources.filter((source) => !adapters.find((adapter) => adapter.id === source)?.exclusive);
  const results = await Promise.all(sources.map((source) => planSource(adapters, source, candidate)));
  return {
    plans: results.filter(isPlan),
    skipped: results.filter((result): result is HarnessOutcome => !isPlan(result)),
  };
};

const baseName = (id: string): string => (validateProviderId(id) === undefined ? id.trim() : slugify(id));

const isNameFree = async (name: string, profileNames: ReadonlySet<string>, plans: SourcePlan[]): Promise<boolean> => {
  if (profileNames.has(name)) return false;
  for (const plan of plans) {
    if (plan.sourceId !== name && (await plan.adapter.isConnected(name))) return false;
  }
  return true;
};

const chooseName = async (id: string, profileNames: ReadonlySet<string>, plans: SourcePlan[]): Promise<string> => {
  const base = baseName(id);
  for (let suffix = 1; ; suffix++) {
    const name = suffix === 1 ? base : `${base}-${suffix}`;
    if (await isNameFree(name, profileNames, plans)) return name;
  }
};

const recordConnection = async (
  store: ProfileStoreRepository,
  name: string,
  id: HarnessId,
  defaultModel: string | undefined,
): Promise<void> => {
  const snapshot = await store.loadStore();
  const profile = snapshot.profiles[name];
  if (!profile || profile.type !== "external") throw new YoinkError(`No provider named "${name}".`);
  const provider = toProviderProfile(profile);
  const connections = { ...provider.connections, [id]: { connectedAt: nowIso(), defaultModel } };
  snapshot.profiles[name] = { ...provider, connections };
  await store.saveStore(snapshot);
};

const adoptSource = async (
  store: ProfileStoreRepository,
  provider: ProviderProfile,
  { adapter, sourceId }: SourcePlan,
): Promise<HarnessOutcome> => {
  const renamed = sourceId !== provider.name;
  try {
    const defaultModel = (await adapter.readDefaultModel(sourceId)) ?? undefined;
    await adapter.connect(provider, { defaultModel: renamed ? defaultModel : undefined });
    await recordConnection(store, provider.name, adapter.id, defaultModel);
  } catch (error) {
    return failure(adapter.id, errorMessage(error));
  }
  if (!renamed) return { id: adapter.id, ok: true };
  try {
    await adapter.disconnect(sourceId);
    return { id: adapter.id, ok: true };
  } catch (error) {
    return failure(adapter.id, `Added "${provider.name}" but kept the old "${sourceId}" entry: ${errorMessage(error)}`);
  }
};

export const createImportProvider =
  ({ store, adapters }: ImportProviderDeps): ImportProvider =>
  async (candidate) => {
    const { plans, skipped } = await planSources(adapters, candidate);
    const snapshot = await store.loadStore();
    const name = await chooseName(candidate.id, new Set(Object.keys(snapshot.profiles)), plans);
    const profile = buildProviderProfile({
      name,
      displayName: candidate.displayName,
      token: candidate.token,
      endpoints: candidate.endpoints,
      models: candidate.models,
    });
    snapshot.profiles[name] = profile;
    await store.saveStore(snapshot);
    const outcomes: HarnessOutcome[] = [...skipped];
    for (const plan of plans) outcomes.push(await adoptSource(store, profile, plan));
    const saved = (await store.loadStore()).profiles[name];
    return { profile: saved?.type === "external" ? toProviderProfile(saved) : profile, outcomes };
  };
