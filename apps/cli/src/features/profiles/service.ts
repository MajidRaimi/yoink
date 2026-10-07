import { readClaudeCredentials } from "../../shared/credentials";
import { readOauthAccount } from "../../shared/claude-config";
import { YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { resyncProvider } from "../harnesses/sync";
import { createRenameProfile, type RenameProfile } from "./rename";
import { loadStore, saveStore } from "./store";
import type { Profile } from "./types";

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
  await saveStore(store);
};

export const saveProfile = async (name: string): Promise<Profile> => {
  const store = await loadStore();
  const profile = await snapshotLiveLogin(name);
  store.profiles[name] = profile;
  store.current = name;
  await saveStore(store);
  return profile;
};

export const listProfiles = async (): Promise<{ current: string | null; profiles: Profile[] }> => {
  const store = await loadStore();
  return { current: store.current, profiles: Object.values(store.profiles) };
};

export const currentProfile = async (): Promise<Profile | null> => {
  const store = await loadStore();
  if (!store.current) return null;
  return store.profiles[store.current] ?? null;
};

export const removeProfile = async (name: string): Promise<void> => {
  const store = await loadStore();
  if (!store.profiles[name]) throw new YoinkError(`No profile named "${name}".`);
  delete store.profiles[name];
  if (store.current === name) store.current = null;
  await saveStore(store);
};

export const renameProfile: RenameProfile = createRenameProfile({
  store: { loadStore, saveStore },
  resync: resyncProvider,
});
