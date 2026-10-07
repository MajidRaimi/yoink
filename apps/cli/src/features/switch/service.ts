import { readClaudeCredentials, writeClaudeCredentials } from "../../shared/credentials";
import { readOauthAccount, writeOauthAccount, type OauthAccount } from "../../shared/claude-config";
import { applyExternalEnv, clearExternalEnv, GLOBAL_SETTINGS_PATH, type ExternalEnvInput } from "../../shared/claude-settings";
import { errorMessage, YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { releaseClaudeCode } from "../profiles/claude-code-release";
import { claudeCodeModel } from "../profiles/default-model";
import { loadStore, saveStore, toProviderProfile, type ProfileStoreRepository } from "../profiles/store";
import { isSubscriptionProfile } from "../profiles/subscription-profile";
import type {
  ClaudeProfile,
  ExternalProfile,
  Profile,
  ProfileStore,
  ProviderProfile,
  SubscriptionProfile,
} from "../profiles/types";

export type SwitchDependencies = {
  store: ProfileStoreRepository;
  readCredentials: () => Promise<string | null>;
  writeCredentials: (blob: string) => Promise<void>;
  readOauthAccount: () => Promise<OauthAccount | null>;
  writeOauthAccount: (account: OauthAccount) => Promise<void>;
  applyExternalEnv: (input: ExternalEnvInput) => Promise<void>;
  clearExternalEnv: () => Promise<void>;
};

export type SwitchResult = { profile: Profile; switched: boolean };

export type SwitchService = {
  assertSwitchable: (name: string) => Promise<void>;
  syncCurrentProfile: () => Promise<void>;
  switchTo: (name: string) => Promise<SwitchResult>;
};

type LiveLogin = { keychain: string | null; account: OauthAccount | null };

const accountUuid = (account: OauthAccount | null): string | undefined =>
  typeof account?.accountUuid === "string" ? account.accountUuid : undefined;

const isSameAccount = (active: OauthAccount | null, live: OauthAccount | null): boolean => {
  const activeEmail = active?.emailAddress;
  const liveEmail = live?.emailAddress;
  if (!activeEmail || !liveEmail || activeEmail !== liveEmail) return false;
  const activeUuid = accountUuid(active);
  const liveUuid = accountUuid(live);
  return activeUuid === undefined || liveUuid === undefined || activeUuid === liveUuid;
};

const claudeCodeEnvFor = (target: ExternalProfile): ExternalEnvInput => {
  const provider = toProviderProfile(target);
  const endpoint = provider.endpoints.find((candidate) => candidate.protocol === "anthropic-messages");
  if (!endpoint) {
    throw new YoinkError(
      `"${target.name}" has no Anthropic-compatible endpoint, so Claude Code can't use it. Run \`yoink connect ${target.name}\` to add it to other harnesses.`,
    );
  }
  return { baseUrl: endpoint.baseUrl, token: target.token, model: claudeCodeModel(provider) };
};

const notClaudeCodeProfile = (profile: SubscriptionProfile): YoinkError =>
  new YoinkError(`"${profile.name}" is a ${profile.type} login, not a Claude Code account.`);

const withClaudeCodeConnection = (target: ExternalProfile): ProviderProfile => {
  const provider = toProviderProfile(target);
  return {
    ...provider,
    connections: {
      ...provider.connections,
      "claude-code": { connectedAt: nowIso(), defaultModel: claudeCodeModel(provider) },
    },
  };
};

const withRollback = async (action: () => Promise<void>, rollback: () => Promise<void>): Promise<void> => {
  try {
    await action();
  } catch (error) {
    try {
      await rollback();
    } catch (rollbackError) {
      throw new YoinkError(
        `${errorMessage(error)} Restoring the previous Claude Code login also failed: ${errorMessage(rollbackError)}`,
      );
    }
    throw error;
  }
};

export const createSwitchService = (deps: SwitchDependencies): SwitchService => {
  const resnapshotActiveProfile = async (store: ProfileStore): Promise<void> => {
    if (!store.current) return;
    const active = store.profiles[store.current];
    if (!active || active.type !== "claude") return;

    const keychain = await deps.readCredentials();
    if (!keychain || keychain === active.keychain) return;

    const liveAccount = await deps.readOauthAccount();
    if (!isSameAccount(active.account, liveAccount)) return;

    active.keychain = keychain;
    active.account = liveAccount;
    active.updatedAt = nowIso();
  };

  const readLiveLogin = async (): Promise<LiveLogin> => ({
    keychain: await deps.readCredentials(),
    account: await deps.readOauthAccount(),
  });

  const restoreLiveLogin = async (login: LiveLogin): Promise<void> => {
    if (login.keychain !== null) await deps.writeCredentials(login.keychain);
    if (login.account !== null) await deps.writeOauthAccount(login.account);
  };

  const activateClaude = async (store: ProfileStore, target: ClaudeProfile): Promise<void> => {
    const previous = await readLiveLogin();
    await deps.writeCredentials(target.keychain);
    await withRollback(async () => {
      if (target.account) await deps.writeOauthAccount(target.account);
      await deps.clearExternalEnv();
      await deps.store.saveStore(store);
    }, () => restoreLiveLogin(previous));
  };

  const activateExternal = async (store: ProfileStore, target: ExternalProfile): Promise<void> => {
    await deps.applyExternalEnv(claudeCodeEnvFor(target));
    store.profiles[target.name] = withClaudeCodeConnection(target);
    await deps.store.saveStore(store);
  };

  const assertSwitchable = async (name: string): Promise<void> => {
    const target = (await deps.store.loadStore()).profiles[name];
    if (target && isSubscriptionProfile(target)) throw notClaudeCodeProfile(target);
    if (target?.type === "external") claudeCodeEnvFor(target);
  };

  const syncCurrentProfile = async (): Promise<void> => {
    const store = await deps.store.loadStore();
    await resnapshotActiveProfile(store);
    await deps.store.saveStore(store);
  };

  const switchTo = async (name: string): Promise<SwitchResult> => {
    const store = await deps.store.loadStore();
    const target = store.profiles[name];
    if (!target) {
      throw new YoinkError(`No profile named "${name}". Run \`yoink list\` to see your profiles.`);
    }
    if (isSubscriptionProfile(target)) throw notClaudeCodeProfile(target);
    if (store.current === name) return { profile: target, switched: false };

    await resnapshotActiveProfile(store);
    releaseClaudeCode(store);
    store.current = name;

    if (target.type === "claude") await activateClaude(store, target);
    else await activateExternal(store, target);

    return { profile: store.profiles[name] ?? target, switched: true };
  };

  return { assertSwitchable, syncCurrentProfile, switchTo };
};

const defaultSwitchService = createSwitchService({
  store: { loadStore, saveStore },
  readCredentials: readClaudeCredentials,
  writeCredentials: writeClaudeCredentials,
  readOauthAccount,
  writeOauthAccount,
  applyExternalEnv: (input) => applyExternalEnv(GLOBAL_SETTINGS_PATH, input),
  clearExternalEnv: () => clearExternalEnv(GLOBAL_SETTINGS_PATH),
});

export const assertSwitchable = defaultSwitchService.assertSwitchable;
export const syncCurrentProfile = defaultSwitchService.syncCurrentProfile;
export const switchTo = defaultSwitchService.switchTo;
