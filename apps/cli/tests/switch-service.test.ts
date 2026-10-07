import { afterEach, beforeEach, expect, test } from "bun:test";
import { join } from "node:path";
import { claudeCodeModel } from "../src/features/profiles/default-model";
import { applyLegacyEdits, createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import type { ClaudeProfile, ExternalProfile, ProviderProfile } from "../src/features/profiles/types";
import { createSwitchService, type SwitchDependencies } from "../src/features/switch/service";
import type { OauthAccount } from "../src/shared/claude-config";
import type { ExternalEnvInput } from "../src/shared/claude-settings";
import { kimiModel, makeProvider, makeTempDir, removeTempDir, visionModel } from "./support/provider-fixture";

type FakeClaude = {
  keychain: string | null;
  account: OauthAccount | null;
  env: ExternalEnvInput | null;
  failCredentialWrite: boolean;
  failOauthWrite: boolean;
};

let dir: string;
let path: string;
let repository: ProfileStoreRepository;
let live: FakeClaude;

const accountA: OauthAccount = { emailAddress: "a@example.com", accountUuid: "uuid-a" };
const accountB: OauthAccount = { emailAddress: "b@example.com", accountUuid: "uuid-b" };

const claudeProfile = (name: string, keychain: string, account: OauthAccount): ClaudeProfile => ({
  type: "claude",
  name,
  keychain,
  account,
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const legacyExternal: ExternalProfile = {
  type: "external",
  name: "foo",
  provider: "Foo",
  baseUrl: "https://old.example.com",
  token: "sk-test-foo",
  model: "m1",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const deps = (): SwitchDependencies => ({
  store: repository,
  readCredentials: async () => live.keychain,
  writeCredentials: async (blob) => {
    if (live.failCredentialWrite) throw new Error("keychain locked");
    live.keychain = blob;
  },
  readOauthAccount: async () => live.account,
  writeOauthAccount: async (account) => {
    if (live.failOauthWrite) throw new Error("disk full");
    live.account = account;
  },
  applyExternalEnv: async (input) => {
    live.env = input;
  },
  clearExternalEnv: async () => {
    live.env = null;
  },
});

const writeRaw = async (value: unknown): Promise<void> => {
  await Bun.write(path, JSON.stringify(value));
};

const savedProvider = async (name: string): Promise<ProviderProfile> =>
  (await repository.loadStore()).profiles[name] as ProviderProfile;

beforeEach(async () => {
  dir = await makeTempDir();
  path = join(dir, "profiles.json");
  repository = createProfileStore(path);
  live = { keychain: "blob-a", account: accountA, env: null, failCredentialWrite: false, failOauthWrite: false };
});

afterEach(async () => {
  await removeTempDir(dir);
});

test("claudeCodeModel prefers a selected Claude Code default, then the legacy model, then the first model", () => {
  const provider = makeProvider({ model: visionModel.id });
  expect(claudeCodeModel(provider)).toBe(visionModel.id);
  expect(claudeCodeModel({ ...provider, connections: { "claude-code": { connectedAt: "t", defaultModel: kimiModel.id } } })).toBe(
    kimiModel.id,
  );
  expect(claudeCodeModel({ ...provider, connections: { "claude-code": { connectedAt: "t", defaultModel: "gone" } } })).toBe(
    visionModel.id,
  );
  expect(claudeCodeModel({ ...provider, model: "gone" })).toBe(kimiModel.id);
});

test("use sends the model chosen by a legacy edit on a profile with no Claude Code connection", async () => {
  await writeRaw({ current: null, profiles: { foo: legacyExternal } });
  const store = await repository.loadStore();
  store.profiles.foo = applyLegacyEdits(store.profiles.foo as ProviderProfile, { model: "m2" });
  await repository.saveStore(store);

  await createSwitchService(deps()).switchTo("foo");

  expect(live.env?.model).toBe("m2");
  expect((await savedProvider("foo")).model).toBe("m2");
});

test("use records a Claude Code connection on the target and releases it from the previous provider", async () => {
  const bar = makeProvider({ name: "bar", connections: {} });
  const foo = makeProvider({ name: "foo", connections: {} });
  await repository.saveStore({ current: null, profiles: { foo, bar } });
  const service = createSwitchService(deps());

  await service.switchTo("foo");
  const connected = await savedProvider("foo");
  expect(connected.connections["claude-code"]?.defaultModel).toBe(kimiModel.id);
  expect(live.env).toEqual({ baseUrl: "https://api.fuse.test", token: "sk-test-fuse", model: kimiModel.id });

  await service.switchTo("bar");
  expect((await savedProvider("foo")).connections["claude-code"]).toBeUndefined();
  expect((await savedProvider("bar")).connections["claude-code"]).toBeDefined();
});

test("switching to a Claude account releases the Claude Code connection of the previous provider", async () => {
  const foo = makeProvider({ name: "foo", connections: { "claude-code": { connectedAt: "t" }, pi: { connectedAt: "t" } } });
  await repository.saveStore({ current: "foo", profiles: { foo, a: claudeProfile("a", "blob-a", accountA) } });

  await createSwitchService(deps()).switchTo("a");

  const released = await savedProvider("foo");
  expect(released.connections).toEqual({ pi: { connectedAt: "t" } });
  expect((await repository.loadStore()).current).toBe("a");
});

test("switching Claude accounts writes credentials before the account metadata", async () => {
  await repository.saveStore({
    current: "a",
    profiles: { a: claudeProfile("a", "blob-a", accountA), b: claudeProfile("b", "blob-b", accountB) },
  });
  live.failCredentialWrite = true;

  await expect(createSwitchService(deps()).switchTo("b")).rejects.toThrow("keychain locked");

  expect(live.account).toEqual(accountA);
  expect((await repository.loadStore()).current).toBe("a");
});

test("a failed account metadata write restores the previous credentials", async () => {
  await repository.saveStore({
    current: "a",
    profiles: { a: claudeProfile("a", "blob-a", accountA), b: claudeProfile("b", "blob-b", accountB) },
  });
  live.failOauthWrite = true;

  await expect(createSwitchService(deps()).switchTo("b")).rejects.toThrow("disk full");

  expect(live.keychain).toBe("blob-a");
  expect(live.account).toEqual(accountA);
  expect((await repository.loadStore()).current).toBe("a");
});

test("a failed store save restores both the previous credentials and account", async () => {
  await repository.saveStore({
    current: "a",
    profiles: { a: claudeProfile("a", "blob-a", accountA), b: claudeProfile("b", "blob-b", accountB) },
  });
  const failingStore: ProfileStoreRepository = {
    loadStore: repository.loadStore,
    saveStore: async () => {
      throw new Error("store write failed");
    },
  };

  await expect(createSwitchService({ ...deps(), store: failingStore }).switchTo("b")).rejects.toThrow("store write failed");

  expect(live.keychain).toBe("blob-a");
  expect(live.account).toEqual(accountA);
});

test("switching Claude accounts updates credentials, account and current profile", async () => {
  await repository.saveStore({
    current: "a",
    profiles: { a: claudeProfile("a", "blob-a", accountA), b: claudeProfile("b", "blob-b", accountB) },
  });
  live.env = { baseUrl: "https://x", token: "t", model: "m" };

  const result = await createSwitchService(deps()).switchTo("b");

  expect(result.switched).toBe(true);
  expect(live.keychain).toBe("blob-b");
  expect(live.account).toEqual(accountB);
  expect(live.env).toBeNull();
  expect((await repository.loadStore()).current).toBe("b");
});
