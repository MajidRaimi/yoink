import {
  SUBSCRIPTION_TOOLS,
  type Profile,
  type ProfileStore,
  type SubscriptionProfile,
  type SubscriptionTool,
} from "./types";

type CurrentByTool = Partial<Record<SubscriptionTool, string>>;

export const isSubscriptionTool = (value: unknown): value is SubscriptionTool =>
  typeof value === "string" && (SUBSCRIPTION_TOOLS as readonly string[]).includes(value);

export const isSubscriptionProfile = (profile: Profile): profile is SubscriptionProfile =>
  isSubscriptionTool(profile.type);

const mapCurrentByTool = (
  currentByTool: CurrentByTool,
  mapName: (name: string) => string | undefined,
): CurrentByTool => {
  const next: CurrentByTool = {};
  for (const tool of SUBSCRIPTION_TOOLS) {
    const name = currentByTool[tool];
    const mapped = name === undefined ? undefined : mapName(name);
    if (mapped !== undefined) next[tool] = mapped;
  }
  return next;
};

export const renameInCurrentByTool = (store: ProfileStore, from: string, to: string): void => {
  if (!store.currentByTool) return;
  store.currentByTool = mapCurrentByTool(store.currentByTool, (name) => (name === from ? to : name));
};

export const releaseFromCurrentByTool = (store: ProfileStore, removed: string): void => {
  if (!store.currentByTool) return;
  store.currentByTool = mapCurrentByTool(store.currentByTool, (name) => (name === removed ? undefined : name));
};

export const parseCurrentByTool = (raw: unknown): CurrentByTool | undefined => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const entries = Object.entries(raw as Record<string, unknown>);
  const next: CurrentByTool = {};
  for (const [tool, name] of entries) {
    if (isSubscriptionTool(tool) && typeof name === "string" && name.length > 0) next[tool] = name;
  }
  return next;
};

const isStringRecord = (value: unknown): value is Record<string, string> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

export const normalizeSubscriptionProfile = (profile: SubscriptionProfile): SubscriptionProfile => {
  const snapshot = (profile.snapshot ?? {}) as Partial<SubscriptionProfile["snapshot"]>;
  const identity = (profile.identity ?? {}) as Partial<SubscriptionProfile["identity"]>;
  const files = isStringRecord(snapshot.files) ? snapshot.files : {};
  const normalized: SubscriptionProfile = {
    ...profile,
    snapshot: isStringRecord(snapshot.keyring) ? { files, keyring: snapshot.keyring } : { files },
    identity: { ...identity, label: typeof identity.label === "string" ? identity.label : profile.name },
  };
  return normalized;
};
