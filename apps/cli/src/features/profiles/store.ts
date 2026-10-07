import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { writeFileAtomic } from "../../shared/atomic-write";
import { readTrimmedString } from "../../shared/guards";
import { readJsonFile } from "../../shared/json-file";
import { PROFILES_PATH } from "../../shared/paths";
import { normalizeEndpointUrl, withoutV1 } from "../harnesses/endpoint";
import { defaultModelSpec } from "./model-spec";
import { selectedDefaultModel } from "./default-model";
import { uniqueName } from "./naming";
import { isSubscriptionProfile, normalizeSubscriptionProfile, parseCurrentByTool } from "./subscription-profile";
import {
  STORE_SCHEMA_VERSION,
  SUBSCRIPTION_STORE_SCHEMA_VERSION,
  type CurrentByTool,
  type Endpoint,
  type ExternalProfile,
  type Profile,
  type ProfileStore,
  type ProviderProfile,
  type SharedProfile,
  type SubscriptionProfile,
  type SubscriptionStore,
} from "./types";

type RawProfiles = Record<string, Record<string, unknown>>;

type RawStore = {
  current?: string | null;
  importOffered?: boolean;
  currentByTool?: unknown;
  profiles?: RawProfiles;
};

type RawSubscriptionStore = {
  currentByTool?: unknown;
  profiles?: RawProfiles;
};

type PersistedSharedStore = Omit<ProfileStore, "currentByTool" | "profiles"> & {
  profiles: Record<string, SharedProfile>;
};

export const SUBSCRIPTIONS_FILE_NAME = "subscriptions.json";

export type ProfileStoreRepository = {
  loadStore: () => Promise<ProfileStore>;
  saveStore: (store: ProfileStore) => Promise<void>;
};

const emptyStore = (): ProfileStore => ({ schemaVersion: STORE_SCHEMA_VERSION, current: null, profiles: {} });

export const isProviderProfile = (profile: Profile): profile is ProviderProfile =>
  profile.type === "external" &&
  Array.isArray(profile.endpoints) &&
  Array.isArray(profile.models) &&
  typeof profile.connections === "object" &&
  profile.connections !== null;

const legacyEndpoints = (profile: ExternalProfile): Endpoint[] =>
  profile.baseUrl ? [{ protocol: "anthropic-messages", baseUrl: withoutV1(profile.baseUrl) }] : [];

export const toProviderProfile = (profile: ExternalProfile): ProviderProfile => ({
  ...profile,
  endpoints: profile.endpoints ?? legacyEndpoints(profile),
  models: profile.models ?? (profile.model ? [defaultModelSpec(profile.model)] : []),
  connections: profile.connections ?? {},
});

const withClaudeCodeConnection = (profile: ProviderProfile): ProviderProfile => ({
  ...profile,
  connections: {
    ...profile.connections,
    "claude-code": { connectedAt: profile.updatedAt, defaultModel: profile.model },
  },
});

const hasModel = (profile: ProviderProfile, id: string): boolean => profile.models.some((model) => model.id === id);

const legacyModel = (profile: ProviderProfile): string =>
  selectedDefaultModel(profile, "claude-code") ??
  (hasModel(profile, profile.model) ? profile.model : profile.models[0]?.id) ??
  profile.model;

export const syncLegacyFields = (profile: ProviderProfile): ProviderProfile => {
  const anthropic = profile.endpoints.find((endpoint) => endpoint.protocol === "anthropic-messages");
  const baseUrl = anthropic?.baseUrl ?? profile.endpoints[0]?.baseUrl ?? profile.baseUrl;
  return { ...profile, baseUrl, model: legacyModel(profile) };
};

export type LegacyEdits = {
  baseUrl?: string;
  model?: string;
};

const sameLegacyUrl = (left: string, right: string): boolean => withoutV1(left) === withoutV1(right);

const legacyUrlSourceIndex = (endpoints: Endpoint[]): number => {
  const anthropicIndex = endpoints.findIndex((endpoint) => endpoint.protocol === "anthropic-messages");
  return anthropicIndex === -1 ? 0 : anthropicIndex;
};

const withRetargetedEndpoint = (endpoints: Endpoint[], rawUrl: string): Endpoint[] => {
  if (endpoints.length === 0) return [{ protocol: "anthropic-messages", baseUrl: withoutV1(rawUrl) }];
  const sourceIndex = legacyUrlSourceIndex(endpoints);
  return endpoints.map((endpoint, index) =>
    index === sourceIndex ? { protocol: endpoint.protocol, baseUrl: normalizeEndpointUrl(endpoint.protocol, rawUrl) } : endpoint,
  );
};

const withLegacyBaseUrl = (profile: ProviderProfile, rawUrl: string): ProviderProfile => {
  const endpoints = withRetargetedEndpoint(profile.endpoints, rawUrl);
  return { ...profile, endpoints, baseUrl: endpoints[legacyUrlSourceIndex(endpoints)]?.baseUrl ?? withoutV1(rawUrl) };
};

const withLegacyModel = (profile: ProviderProfile, id: string): ProviderProfile => {
  const claudeCode = profile.connections["claude-code"];
  return {
    ...profile,
    model: id,
    models: hasModel(profile, id) ? profile.models : [...profile.models, defaultModelSpec(id)],
    connections: claudeCode ? { ...profile.connections, "claude-code": { ...claudeCode, defaultModel: id } } : profile.connections,
  };
};

const changedUrl = (current: ProviderProfile, edit: string | undefined): string | undefined =>
  edit !== undefined && !sameLegacyUrl(edit, current.baseUrl) ? edit : undefined;

const changedModel = (current: ProviderProfile, edit: string | undefined): string | undefined =>
  edit !== undefined && edit !== current.model ? edit : undefined;

export const applyLegacyEdits = (profile: ProviderProfile, edits: LegacyEdits): ProviderProfile => {
  const current = syncLegacyFields(profile);
  const baseUrl = changedUrl(current, edits.baseUrl);
  const model = changedModel(current, edits.model);
  const withUrl = baseUrl === undefined ? profile : withLegacyBaseUrl(profile, baseUrl);
  return model === undefined ? withUrl : withLegacyModel(withUrl, model);
};

const withOutOfBandLegacyEdits = (profile: ExternalProfile, migrated: ProviderProfile): ProviderProfile =>
  applyLegacyEdits(migrated, { baseUrl: readTrimmedString(profile.baseUrl), model: readTrimmedString(profile.model) });

const migrateExternal = (profile: ExternalProfile, isCurrent: boolean): ProviderProfile => {
  const migrated = toProviderProfile(profile);
  if (profile.endpoints !== undefined) return withOutOfBandLegacyEdits(profile, migrated);
  return isCurrent && !migrated.connections["claude-code"] ? withClaudeCodeConnection(migrated) : migrated;
};

const normalizeProfile = (entry: Record<string, unknown>, isCurrent: boolean): Profile => {
  const profile = (entry.type ? entry : { ...entry, type: "claude" }) as Profile;
  if (isSubscriptionProfile(profile)) return normalizeSubscriptionProfile(profile);
  return profile.type === "external" ? migrateExternal(profile, isCurrent) : profile;
};

const toPersistedProfile = (profile: SharedProfile): SharedProfile =>
  isProviderProfile(profile) ? syncLegacyFields(profile) : profile;

const toPersistedSharedStore = (store: ProfileStore): PersistedSharedStore => {
  const persisted: PersistedSharedStore = { schemaVersion: STORE_SCHEMA_VERSION, current: store.current, profiles: {} };
  if (store.importOffered !== undefined) persisted.importOffered = store.importOffered;
  for (const [name, profile] of Object.entries(store.profiles)) {
    if (!isSubscriptionProfile(profile)) persisted.profiles[name] = toPersistedProfile(profile);
  }
  return persisted;
};

const toSubscriptionStore = (store: ProfileStore): SubscriptionStore => {
  const profiles: Record<string, SubscriptionProfile> = {};
  for (const [name, profile] of Object.entries(store.profiles)) {
    if (isSubscriptionProfile(profile)) profiles[name] = profile;
  }
  return { schemaVersion: SUBSCRIPTION_STORE_SCHEMA_VERSION, currentByTool: store.currentByTool ?? {}, profiles };
};

const isEmptySubscriptionStore = (store: SubscriptionStore): boolean =>
  Object.keys(store.profiles).length === 0 && Object.keys(store.currentByTool).length === 0;

const parseProfiles = (rawProfiles: RawProfiles | undefined, current: string | null): Record<string, Profile> => {
  const profiles: Record<string, Profile> = {};
  for (const [name, entry] of Object.entries(rawProfiles ?? {})) {
    profiles[name] = normalizeProfile(entry, name === current);
  }
  return profiles;
};

const subscriptionSlot = (profiles: Record<string, Profile>, name: string): string => {
  const existing = profiles[name];
  return existing === undefined || isSubscriptionProfile(existing) ? name : uniqueName(Object.values(profiles), name);
};

const mergeSubscriptions = (
  profiles: Record<string, Profile>,
  currentByTool: CurrentByTool | undefined,
  rawProfiles: RawProfiles | undefined,
): CurrentByTool | undefined => {
  const nextCurrentByTool = currentByTool === undefined ? undefined : { ...currentByTool };
  for (const [name, entry] of Object.entries(rawProfiles ?? {})) {
    const profile = normalizeProfile(entry, false);
    if (!isSubscriptionProfile(profile)) continue;
    const slot = subscriptionSlot(profiles, name);
    profiles[slot] = slot === name ? profile : { ...profile, name: slot };
    if (slot !== name && nextCurrentByTool?.[profile.type] === name) nextCurrentByTool[profile.type] = slot;
  }
  return nextCurrentByTool;
};

const parseStore = (raw: RawStore, rawSubscriptions: RawSubscriptionStore | null): ProfileStore => {
  const current = raw.current ?? null;
  const profiles = parseProfiles(raw.profiles, current);
  const currentByTool = mergeSubscriptions(
    profiles,
    parseCurrentByTool(rawSubscriptions?.currentByTool ?? raw.currentByTool),
    rawSubscriptions?.profiles,
  );
  const store: ProfileStore = { schemaVersion: STORE_SCHEMA_VERSION, current, profiles };
  if (raw.importOffered !== undefined) store.importOffered = raw.importOffered;
  if (currentByTool !== undefined) store.currentByTool = currentByTool;
  return store;
};

const writeSubscriptionStore = async (path: string, store: SubscriptionStore): Promise<void> => {
  if (isEmptySubscriptionStore(store)) {
    await rm(path, { force: true });
    return;
  }
  await writeFileAtomic(path, JSON.stringify(store, null, 2), 0o600);
};

export const subscriptionsPathFor = (profilesPath: string): string =>
  join(dirname(profilesPath), SUBSCRIPTIONS_FILE_NAME);

export const createProfileStore = (
  path: string,
  subscriptionsPath: string = subscriptionsPathFor(path),
): ProfileStoreRepository => ({
  loadStore: async (): Promise<ProfileStore> => {
    const raw = await readJsonFile<RawStore>(path);
    const rawSubscriptions = await readJsonFile<RawSubscriptionStore>(subscriptionsPath);
    return raw === null && rawSubscriptions === null ? emptyStore() : parseStore(raw ?? {}, rawSubscriptions);
  },
  saveStore: async (store: ProfileStore): Promise<void> => {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await mkdir(dirname(subscriptionsPath), { recursive: true, mode: 0o700 });
    await writeSubscriptionStore(subscriptionsPath, toSubscriptionStore(store));
    await writeFileAtomic(path, JSON.stringify(toPersistedSharedStore(store), null, 2), 0o600);
  },
});

const defaultProfileStore = createProfileStore(PROFILES_PATH);

export const loadStore = defaultProfileStore.loadStore;
export const saveStore = defaultProfileStore.saveStore;
