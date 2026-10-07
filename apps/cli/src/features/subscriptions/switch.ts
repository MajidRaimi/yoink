import { errorMessage, YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { uniqueName } from "../profiles/naming";
import { loadStore, saveStore, type ProfileStoreRepository } from "../profiles/store";
import { isSubscriptionProfile } from "../profiles/subscription-profile";
import type {
  ProfileStore,
  SubscriptionIdentity,
  SubscriptionProfile,
  SubscriptionSnapshot,
  SubscriptionTool,
} from "../profiles/types";
import { confirmRunningInteractively, type ConfirmRunning } from "./confirm-running";
import { defaultSubscriptionName, sameIdentity } from "./identity";
import { requireBackend as requireRegisteredBackend, SUBSCRIPTION_BACKENDS } from "./registry";
import { isProcessRunning } from "../../shared/processes/process-detection";
import type { ProcessMatcher } from "../../shared/processes/types";
import type { SubscriptionBackend, SubscriptionCapture } from "./types";

export type SubscriptionServiceDeps = {
  store: ProfileStoreRepository;
  backends: readonly SubscriptionBackend[];
  isRunning: (matcher: ProcessMatcher) => Promise<boolean>;
  confirmRunning: ConfirmRunning;
  now: () => string;
};

export type SwitchSubscriptionOptions = {
  force?: boolean;
  confirmRunning?: ConfirmRunning;
};

export type SubscriptionSwitchResult = {
  profile: SubscriptionProfile;
  switched: boolean;
  notice: string | null;
};

export type AddCapture = {
  capture: SubscriptionCapture;
  existing: SubscriptionProfile | null;
  suggestedName: string;
};

export type PreserveResult =
  | { kind: "none" }
  | { kind: "refreshed"; profile: SubscriptionProfile }
  | { kind: "saved"; profile: SubscriptionProfile };

export type SubscriptionService = {
  saveSubscription: (tool: SubscriptionTool, name: string) => Promise<SubscriptionProfile>;
  switchSubscription: (name: string, options?: SwitchSubscriptionOptions) => Promise<SubscriptionSwitchResult>;
  captureForAdd: (tool: SubscriptionTool) => Promise<AddCapture | null>;
  preserveLiveLogin: (tool: SubscriptionTool) => Promise<PreserveResult>;
  syncCurrentSubscription: (tool: SubscriptionTool) => Promise<void>;
  postSwitchNotice: (tool: SubscriptionTool) => string | null;
};

export class SubscriptionSwitchRefusedError extends YoinkError {
  constructor(backend: SubscriptionBackend) {
    super(`${backend.label} is running, so the switch was skipped. Close it first, or pass --force.`);
    this.name = "SubscriptionSwitchRefusedError";
  }
}

const EMPTY_SNAPSHOT: SubscriptionSnapshot = { files: {} };

const subscriptionProfiles = (store: ProfileStore, tool: SubscriptionTool): SubscriptionProfile[] =>
  Object.values(store.profiles).filter(
    (profile): profile is SubscriptionProfile => isSubscriptionProfile(profile) && profile.type === tool,
  );

const findByIdentity = (store: ProfileStore, tool: SubscriptionTool, capture: SubscriptionCapture): SubscriptionProfile | null =>
  subscriptionProfiles(store, tool).find((profile) => sameIdentity(profile.identity, capture.identity)) ?? null;

const suggestName = (store: ProfileStore, tool: SubscriptionTool, identity: SubscriptionIdentity): string =>
  uniqueName(Object.values(store.profiles), defaultSubscriptionName(tool, identity));

const currentFor = (store: ProfileStore, tool: SubscriptionTool): SubscriptionProfile | null => {
  const name = store.currentByTool?.[tool];
  const profile = name === undefined ? undefined : store.profiles[name];
  return profile && isSubscriptionProfile(profile) && profile.type === tool ? profile : null;
};

const setCurrent = (store: ProfileStore, tool: SubscriptionTool, name: string): void => {
  store.currentByTool = { ...store.currentByTool, [tool]: name };
};

const withRollback = async (
  backend: SubscriptionBackend,
  action: () => Promise<void>,
  rollback: () => Promise<void>,
): Promise<void> => {
  try {
    await action();
  } catch (error) {
    try {
      await rollback();
    } catch (rollbackError) {
      throw new YoinkError(
        `${errorMessage(error)} Restoring the previous ${backend.label} login also failed: ${errorMessage(rollbackError)}`,
      );
    }
    throw error;
  }
};

export const createSubscriptionService = (deps: SubscriptionServiceDeps): SubscriptionService => {
  const requireBackend = (tool: SubscriptionTool): SubscriptionBackend => requireRegisteredBackend(tool, deps.backends);

  const refreshed = (profile: SubscriptionProfile, capture: SubscriptionCapture): SubscriptionProfile => ({
    ...profile,
    snapshot: capture.snapshot,
    identity: capture.identity,
    updatedAt: deps.now(),
  });

  const recaptureTarget = (store: ProfileStore, tool: SubscriptionTool, live: SubscriptionCapture): SubscriptionProfile | null => {
    const current = currentFor(store, tool);
    if (current) return sameIdentity(current.identity, live.identity) ? current : null;
    return findByIdentity(store, tool, live);
  };

  const recaptureCurrent = (store: ProfileStore, tool: SubscriptionTool, live: SubscriptionCapture | null): boolean => {
    const target = live ? recaptureTarget(store, tool, live) : null;
    if (!target || !live) return false;
    store.profiles[target.name] = refreshed(target, live);
    setCurrent(store, tool, target.name);
    return true;
  };

  const assertMayProceed = async (backend: SubscriptionBackend, options: SwitchSubscriptionOptions): Promise<void> => {
    if (options.force === true || !(await deps.isRunning(backend.processMatcher))) return;
    const confirm = options.confirmRunning ?? deps.confirmRunning;
    if (!(await confirm(backend))) throw new SubscriptionSwitchRefusedError(backend);
  };

  const requireTarget = (store: ProfileStore, name: string): SubscriptionProfile => {
    const target = store.profiles[name];
    if (!target) throw new YoinkError(`No profile named "${name}". Run \`yoink list\` to see your profiles.`);
    if (!isSubscriptionProfile(target)) throw new YoinkError(`"${name}" is not a subscription login.`);
    return target;
  };

  const captureLive = async (backend: SubscriptionBackend): Promise<SubscriptionCapture> => {
    const live = await backend.capture();
    if (!live) throw new YoinkError(`No ${backend.label} login found on this machine. Log in with ${backend.label} first.`);
    return live;
  };

  const saveSubscription = async (tool: SubscriptionTool, name: string): Promise<SubscriptionProfile> => {
    const backend = requireBackend(tool);
    const store = await deps.store.loadStore();
    const existing = store.profiles[name];
    if (existing && existing.type !== tool) {
      throw new YoinkError(`A profile named "${name}" already exists for something else. Pick another name.`);
    }
    const live = await captureLive(backend);
    const profile: SubscriptionProfile = { type: tool, name, ...live, updatedAt: deps.now() };
    store.profiles[name] = profile;
    setCurrent(store, tool, name);
    await deps.store.saveStore(store);
    return profile;
  };

  const switchSubscription = async (
    name: string,
    options: SwitchSubscriptionOptions = {},
  ): Promise<SubscriptionSwitchResult> => {
    const store = await deps.store.loadStore();
    const target = requireTarget(store, name);
    const backend = requireBackend(target.type);
    const live = await backend.capture();

    if (store.currentByTool?.[target.type] === name && live && sameIdentity(target.identity, live.identity)) {
      const profile = refreshed(target, live);
      store.profiles[name] = profile;
      await deps.store.saveStore(store);
      return { profile, switched: false, notice: backend.postSwitchNotice?.() ?? null };
    }

    await assertMayProceed(backend, options);
    recaptureCurrent(store, target.type, live);
    await withRollback(
      backend,
      async () => {
        await backend.restore(target.snapshot);
        setCurrent(store, target.type, name);
        await deps.store.saveStore(store);
      },
      () => backend.restore(live?.snapshot ?? EMPTY_SNAPSHOT),
    );
    return { profile: target, switched: true, notice: backend.postSwitchNotice?.() ?? null };
  };

  const captureForAdd = async (tool: SubscriptionTool): Promise<AddCapture | null> => {
    const backend = requireBackend(tool);
    const capture = await backend.capture();
    if (!capture) return null;
    const store = await deps.store.loadStore();
    const existing = findByIdentity(store, tool, capture);
    const suggestedName = existing?.name ?? suggestName(store, tool, capture.identity);
    return { capture, existing, suggestedName };
  };

  const preserveLiveLogin = async (tool: SubscriptionTool): Promise<PreserveResult> => {
    const backend = requireBackend(tool);
    const live = await backend.capture();
    if (!live) return { kind: "none" };
    const store = await deps.store.loadStore();
    const existing = findByIdentity(store, tool, live);
    const profile: SubscriptionProfile = existing
      ? refreshed(existing, live)
      : {
          type: tool,
          name: suggestName(store, tool, live.identity),
          ...live,
          updatedAt: deps.now(),
        };
    store.profiles[profile.name] = profile;
    setCurrent(store, tool, profile.name);
    await deps.store.saveStore(store);
    return existing ? { kind: "refreshed", profile } : { kind: "saved", profile };
  };

  const syncCurrentSubscription = async (tool: SubscriptionTool): Promise<void> => {
    const backend = requireBackend(tool);
    const store = await deps.store.loadStore();
    if (subscriptionProfiles(store, tool).length === 0) return;
    if (!recaptureCurrent(store, tool, await backend.capture())) return;
    await deps.store.saveStore(store);
  };

  const postSwitchNotice = (tool: SubscriptionTool): string | null => requireBackend(tool).postSwitchNotice?.() ?? null;

  return {
    saveSubscription,
    switchSubscription,
    captureForAdd,
    preserveLiveLogin,
    syncCurrentSubscription,
    postSwitchNotice,
  };
};

const defaultSubscriptionService = createSubscriptionService({
  store: { loadStore, saveStore },
  backends: SUBSCRIPTION_BACKENDS,
  isRunning: (matcher) => isProcessRunning(matcher),
  confirmRunning: confirmRunningInteractively,
  now: nowIso,
});

export const saveSubscription = defaultSubscriptionService.saveSubscription;
export const switchSubscription = defaultSubscriptionService.switchSubscription;
export const captureForAdd = defaultSubscriptionService.captureForAdd;
export const preserveLiveLogin = defaultSubscriptionService.preserveLiveLogin;
export const syncCurrentSubscription = defaultSubscriptionService.syncCurrentSubscription;
export const postSwitchNotice = defaultSubscriptionService.postSwitchNotice;
