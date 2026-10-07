import { errorMessage, YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { loadStore, saveStore, toProviderProfile, type ProfileStoreRepository } from "../profiles/store";
import type { Connection, Connections, HarnessId, ProviderProfile } from "../profiles/types";
import { supportsAny } from "./endpoint";
import { HARNESS_ADAPTERS } from "./registry";
import type { HarnessAdapter } from "./types";

export type HarnessStatus = {
  id: HarnessId;
  label: string;
  installed: boolean;
  configPath: string;
  compatible: boolean;
  connected: boolean;
  parseError: string | null;
  exclusive: boolean;
};

export type ConnectionProbe = {
  connected: boolean;
  error: string | null;
};

export type HarnessOutcome = { id: HarnessId; ok: true } | { id: HarnessId; ok: false; message: string };

export type ConnectRequest = {
  defaultModel?: string;
};

export type HarnessSyncDeps = {
  adapters: readonly HarnessAdapter[];
  store: ProfileStoreRepository;
};

export type HarnessSync = {
  loadProvider: (name: string) => Promise<ProviderProfile>;
  harnessStatuses: (provider: ProviderProfile) => Promise<HarnessStatus[]>;
  connectHarnesses: (name: string, ids: readonly HarnessId[], request: ConnectRequest) => Promise<HarnessOutcome[]>;
  disconnectHarnesses: (name: string, ids: readonly HarnessId[]) => Promise<HarnessOutcome[]>;
  connectedHarnessIds: (provider: ProviderProfile) => Promise<HarnessId[]>;
  resyncProvider: (provider: ProviderProfile, previousName?: string) => Promise<HarnessOutcome[]>;
};

const hasModel = (provider: ProviderProfile, id: string): boolean =>
  provider.models.some((model) => model.id === id);

const selectedModel = (provider: ProviderProfile, id: string | null | undefined): string | undefined =>
  id && hasModel(provider, id) ? id : undefined;

const assertSelectedModel = (provider: ProviderProfile, model: string | undefined): void => {
  if (model === undefined || hasModel(provider, model)) return;
  const available = provider.models.map((candidate) => candidate.id).join(", ");
  throw new YoinkError(`"${model}" is not one of the models selected for "${provider.name}". Choose one of: ${available}.`);
};

const connectionRecord = (connectedAt: string, defaultModel: string | undefined): Connection =>
  defaultModel ? { connectedAt, defaultModel } : { connectedAt };

const runForHarness = async (id: HarnessId, action: () => Promise<void>): Promise<HarnessOutcome> => {
  try {
    await action();
    return { id, ok: true };
  } catch (error) {
    return { id, ok: false, message: errorMessage(error) };
  }
};

export const probeConnection = async (adapter: HarnessAdapter, providerId: string): Promise<ConnectionProbe> => {
  try {
    return { connected: await adapter.isConnected(providerId), error: null };
  } catch (error) {
    return { connected: false, error: errorMessage(error) };
  }
};

const readLiveDefault = async (adapter: HarnessAdapter, providerIds: readonly string[]): Promise<string | null> => {
  for (const providerId of providerIds) {
    const model = await adapter.readDefaultModel(providerId).catch(() => null);
    if (model !== null) return model;
  }
  return null;
};

const resyncDefaultModel = (provider: ProviderProfile, id: HarnessId, live: string | null): string | undefined => {
  const recorded = provider.connections[id]?.defaultModel;
  const fallback = live !== null || recorded !== undefined ? provider.models[0]?.id : undefined;
  return selectedModel(provider, live) ?? selectedModel(provider, recorded) ?? fallback;
};

export const createHarnessSync = ({ adapters, store }: HarnessSyncDeps): HarnessSync => {
  const requireAdapter = (id: HarnessId): HarnessAdapter => {
    const adapter = adapters.find((candidate) => candidate.id === id);
    if (!adapter) throw new YoinkError(`Unknown harness "${id}".`);
    return adapter;
  };

  const loadProvider = async (name: string): Promise<ProviderProfile> => {
    const profile = (await store.loadStore()).profiles[name];
    if (!profile) throw new YoinkError(`No profile named "${name}".`);
    if (profile.type !== "external") throw new YoinkError(`"${name}" is a Claude account, not a provider.`);
    return toProviderProfile(profile);
  };

  const updateConnections = async (name: string, mutate: (connections: Connections) => void): Promise<void> => {
    const snapshot = await store.loadStore();
    const profile = snapshot.profiles[name];
    if (!profile || profile.type !== "external") return;
    const provider = toProviderProfile(profile);
    mutate(provider.connections);
    snapshot.profiles[name] = provider;
    await store.saveStore(snapshot);
  };

  const harnessStatus = async (adapter: HarnessAdapter, provider: ProviderProfile): Promise<HarnessStatus> => {
    const detection = await adapter.detect();
    const probe = await probeConnection(adapter, provider.name);
    return {
      id: adapter.id,
      label: adapter.label,
      installed: detection.installed,
      configPath: detection.configPath,
      compatible: supportsAny(provider, adapter.protocols),
      connected: probe.connected,
      parseError: probe.error,
      exclusive: adapter.exclusive,
    };
  };

  const harnessStatuses = (provider: ProviderProfile): Promise<HarnessStatus[]> =>
    Promise.all(adapters.map((adapter) => harnessStatus(adapter, provider)));

  const connectHarnesses = async (
    name: string,
    ids: readonly HarnessId[],
    request: ConnectRequest,
  ): Promise<HarnessOutcome[]> => {
    assertSelectedModel(await loadProvider(name), request.defaultModel);
    const outcomes: HarnessOutcome[] = [];
    for (const id of ids) {
      const provider = await loadProvider(name);
      const outcome = await runForHarness(id, () => requireAdapter(id).connect(provider, request));
      if (outcome.ok) {
        await updateConnections(name, (connections) => {
          const defaultModel = request.defaultModel ?? selectedModel(provider, connections[id]?.defaultModel);
          connections[id] = connectionRecord(nowIso(), defaultModel);
        });
      }
      outcomes.push(outcome);
    }
    return outcomes;
  };

  const disconnectHarnesses = async (name: string, ids: readonly HarnessId[]): Promise<HarnessOutcome[]> => {
    const outcomes: HarnessOutcome[] = [];
    for (const id of ids) {
      const outcome = await runForHarness(id, () => requireAdapter(id).disconnect(name));
      if (outcome.ok) {
        await updateConnections(name, (connections) => {
          delete connections[id];
        });
      }
      outcomes.push(outcome);
    }
    return outcomes;
  };

  const connectedHarnessIds = async (provider: ProviderProfile): Promise<HarnessId[]> => {
    const statuses = await harnessStatuses(provider);
    return statuses.filter((status) => status.connected).map((status) => status.id);
  };

  const liveExclusiveIds = async (provider: ProviderProfile): Promise<HarnessId[]> => {
    const exclusive = adapters.filter((adapter) => adapter.exclusive);
    const connected = await Promise.all(
      exclusive.map((adapter) => adapter.isConnected(provider.name).catch(() => false)),
    );
    return exclusive.filter((_adapter, index) => connected[index]).map((adapter) => adapter.id);
  };

  const resyncTargets = async (provider: ProviderProfile): Promise<HarnessId[]> => {
    const recorded = Object.keys(provider.connections) as HarnessId[];
    return [...new Set([...recorded, ...(await liveExclusiveIds(provider))])];
  };

  const resyncHarness = async (
    provider: ProviderProfile,
    id: HarnessId,
    renamedFrom: string | undefined,
  ): Promise<HarnessOutcome[]> => {
    const adapter = requireAdapter(id);
    const live = await readLiveDefault(adapter, renamedFrom ? [renamedFrom, provider.name] : [provider.name]);
    const outcomes: HarnessOutcome[] = [];
    if (renamedFrom) {
      const removal = await runForHarness(id, () => adapter.disconnect(renamedFrom));
      if (!removal.ok) outcomes.push(removal);
    }
    if (adapter.exclusive && !(await adapter.isConnected(provider.name))) return outcomes;
    const defaultModel = resyncDefaultModel(provider, id, live);
    const outcome = await runForHarness(id, () => adapter.connect(provider, { defaultModel }));
    if (outcome.ok) {
      await updateConnections(provider.name, (connections) => {
        connections[id] = connectionRecord(connections[id]?.connectedAt ?? nowIso(), defaultModel);
      });
    }
    return [...outcomes, outcome];
  };

  const resyncProvider = async (provider: ProviderProfile, previousName?: string): Promise<HarnessOutcome[]> => {
    const renamedFrom = previousName && previousName !== provider.name ? previousName : undefined;
    const outcomes: HarnessOutcome[] = [];
    for (const id of await resyncTargets(provider)) {
      outcomes.push(...(await resyncHarness(provider, id, renamedFrom)));
    }
    return outcomes;
  };

  return {
    loadProvider,
    harnessStatuses,
    connectHarnesses,
    disconnectHarnesses,
    connectedHarnessIds,
    resyncProvider,
  };
};

const defaultHarnessSync = createHarnessSync({ adapters: HARNESS_ADAPTERS, store: { loadStore, saveStore } });

export const loadProvider = defaultHarnessSync.loadProvider;
export const harnessStatuses = defaultHarnessSync.harnessStatuses;
export const connectHarnesses = defaultHarnessSync.connectHarnesses;
export const disconnectHarnesses = defaultHarnessSync.disconnectHarnesses;
export const connectedHarnessIds = defaultHarnessSync.connectedHarnessIds;
export const resyncProvider = defaultHarnessSync.resyncProvider;
