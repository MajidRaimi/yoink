import { readClaudeCredentials } from "../../shared/credentials";
import { readOauthAccount } from "../../shared/claude-config";
import { clearExternalEnv, GLOBAL_SETTINGS_PATH } from "../../shared/claude-settings";
import { YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { resyncProvider } from "../harnesses/sync";
import { releaseClaudeCode } from "./claude-code-release";
import { createRenameProfile, type RenameProfile } from "./rename";
import { loadStore, saveStore, type ProfileStoreRepository } from "./store";
import { releaseFromCurrentByTool, renameInCurrentByTool } from "./subscription-profile";
import type { Profile, ProfileStore } from "./types";

const snapshotLiveLogin = async (name: string): Promise<Profile> => {
  const keychain = await readClaudeCredentials();
  if (!keychain) {
    throw new YoinkError("No Claude Code login found on this machine. Run `claude` and log in first.");
  }
  const account = await readOauthAccount();
  return { type: "claude", name, keychain, account, updatedAt: nowIso() };
};

export const upsertProfile = async (profile: Profile, setCurrent: boolean): Promise<Profile> => {
  const store = await loadStore();
  store.profiles[profile.name] = profile;
  if (setCurrent) store.current = profile.name;
  await saveStore(store);
  return profile;
};

export const updateProfile = async (oldName: string, next: Profile): Promise<void> => {
  const store = await loadStore();
  if (!store.profiles[oldName]) throw new YoinkError(`No profile named "${oldName}".`);
  if (next.name !== oldName && store.profiles[next.name]) {
    throw new YoinkError(`A profile named "${next.name}" already exists.`);
  }
  delete store.profiles[oldName];
  store.profiles[next.name] = next;
  if (store.current === oldName) store.current = next.name;
  renameInCurrentByTool(store, oldName, next.name);
  await saveStore(store);
};

export const claudeSaveConflict = (profiles: readonly Profile[], name: string): string | undefined => {
  const existing = profiles.find((profile) => profile.name === name);
  if (!existing || existing.type === "claude") return undefined;
  return `A profile named "${name}" already exists for something else. Pick another name.`;
};

export const assertClaudeSaveTarget = (store: ProfileStore, name: string): void => {
  const conflict = claudeSaveConflict(Object.values(store.profiles), name);
  if (conflict) throw new YoinkError(conflict);
};

export type SaveProfile = (name: string) => Promise<Profile>;

export type SaveProfileDeps = {
  store: ProfileStoreRepository;
  snapshotLiveLogin: (name: string) => Promise<Profile>;
  clearExternalEnv: () => Promise<void>;
};

export const createSaveProfile =
  ({ store: repository, snapshotLiveLogin: snapshot, clearExternalEnv: clearEnv }: SaveProfileDeps): SaveProfile =>
  async (name) => {
    const store = await repository.loadStore();
    assertClaudeSaveTarget(store, name);
    const profile = await snapshot(name);
    if (releaseClaudeCode(store)) await clearEnv();
    store.profiles[name] = profile;
    store.current = name;
    await repository.saveStore(store);
    return profile;
  };

export const saveProfile: SaveProfile = createSaveProfile({
  store: { loadStore, saveStore },
  snapshotLiveLogin,
  clearExternalEnv: () => clearExternalEnv(GLOBAL_SETTINGS_PATH),
});

export const listProfiles = async (): Promise<{ current: string | null; profiles: Profile[] }> => {
  const store = await loadStore();
  return { current: store.current, profiles: Object.values(store.profiles) };
};

export const removeProfile = async (name: string): Promise<void> => {
  const store = await loadStore();
  if (!store.profiles[name]) throw new YoinkError(`No profile named "${name}".`);
  delete store.profiles[name];
  if (store.current === name) store.current = null;
  releaseFromCurrentByTool(store, name);
  await saveStore(store);
};

export const renameProfile: RenameProfile = createRenameProfile({
  store: { loadStore, saveStore },
  resync: resyncProvider,
});
