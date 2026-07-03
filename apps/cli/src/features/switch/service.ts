import { readClaudeCredentials, writeClaudeCredentials } from "../../shared/credentials";
import { readOauthAccount, writeOauthAccount } from "../../shared/claude-config";
import { applyExternalEnv, clearExternalEnv, GLOBAL_SETTINGS_PATH } from "../../shared/claude-settings";
import { YoinkError } from "../../shared/errors";
import { loadStore, saveStore } from "../profiles/store";
import type { Profile, ProfileStore } from "../profiles/types";

const resnapshotActiveProfile = async (store: ProfileStore): Promise<void> => {
  if (!store.current) return;
  const active = store.profiles[store.current];
  if (!active || active.type !== "claude") return;

  const keychain = await readClaudeCredentials();
  if (!keychain || keychain === active.keychain) return;

  const liveAccount = await readOauthAccount();
  const activeEmail = active.account?.emailAddress;
  const liveEmail = liveAccount?.emailAddress;
  if (!activeEmail || !liveEmail || activeEmail !== liveEmail) return;

  active.keychain = keychain;
  active.account = liveAccount;
  active.updatedAt = new Date().toISOString();
};

export const syncCurrentProfile = async (): Promise<void> => {
  const store = await loadStore();
  await resnapshotActiveProfile(store);
  await saveStore(store);
};

export const switchTo = async (name: string): Promise<{ profile: Profile; switched: boolean }> => {
  const store = await loadStore();
  const target = store.profiles[name];
  if (!target) {
    throw new YoinkError(`No profile named "${name}". Run \`yoink list\` to see your profiles.`);
  }
  if (store.current === name) return { profile: target, switched: false };

  await resnapshotActiveProfile(store);

  if (target.type === "claude") {
    await writeClaudeCredentials(target.keychain);
    if (target.account) await writeOauthAccount(target.account);
    await clearExternalEnv(GLOBAL_SETTINGS_PATH);
  } else {
    await applyExternalEnv(GLOBAL_SETTINGS_PATH, {
      baseUrl: target.baseUrl,
      token: target.token,
      model: target.model,
    });
  }

  store.current = name;
  await saveStore(store);
  return { profile: target, switched: true };
};
