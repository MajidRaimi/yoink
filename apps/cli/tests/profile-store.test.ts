import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyLegacyEdits,
  createProfileStore,
  isProviderProfile,
  subscriptionsPathFor,
  toProviderProfile,
} from "../src/features/profiles/store";
import type { ExternalProfile, ProviderProfile, SubscriptionProfile } from "../src/features/profiles/types";
import { ConfigParseError } from "../src/shared/errors";

let dir: string;
let path: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "yoink-store-"));
  path = join(dir, "nested", "profiles.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const legacyExternal: ExternalProfile = {
  type: "external",
  name: "router",
  provider: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  model: "moonshotai/kimi-k2",
  token: "sk-or",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const subscriptionsPath = (): string => subscriptionsPathFor(path);

const writeRaw = async (value: unknown): Promise<void> => {
  await Bun.write(path, JSON.stringify(value));
};

test("loadStore returns an empty v2 store when the file is missing", async () => {
  expect(await createProfileStore(path).loadStore()).toEqual({ schemaVersion: 2, current: null, profiles: {} });
});

test("loadStore raises ConfigParseError on corrupt JSON", async () => {
  await Bun.write(path, "{ not json");
  await expect(createProfileStore(path).loadStore()).rejects.toBeInstanceOf(ConfigParseError);
});

test("loadStore treats profiles without a type as Claude accounts", async () => {
  await writeRaw({ current: "work", profiles: { work: { name: "work", keychain: "{}", account: null, updatedAt: "t" } } });
  const store = await createProfileStore(path).loadStore();
  expect(store.profiles.work?.type).toBe("claude");
});

test("loadStore migrates a current legacy external profile and connects it to Claude Code", async () => {
  await writeRaw({ current: "router", profiles: { router: legacyExternal } });
  const profile = (await createProfileStore(path).loadStore()).profiles.router;
  if (!profile || !isProviderProfile(profile)) throw new Error("expected a provider profile");
  expect(profile.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://openrouter.ai/api" }]);
  expect(profile.models).toEqual([
    { id: "moonshotai/kimi-k2", name: "moonshotai/kimi-k2", contextWindow: 128000, maxOutput: 32000, reasoning: false, input: ["text"] },
  ]);
  expect(profile.connections).toEqual({
    "claude-code": { connectedAt: legacyExternal.updatedAt, defaultModel: "moonshotai/kimi-k2" },
  });
});

test("loadStore leaves non-current legacy profiles unconnected", async () => {
  await writeRaw({ current: null, profiles: { router: legacyExternal } });
  const profile = (await createProfileStore(path).loadStore()).profiles.router as ProviderProfile;
  expect(profile.connections).toEqual({});
});

test("toProviderProfile keeps existing v2 data untouched", () => {
  const v2: ProviderProfile = {
    ...legacyExternal,
    endpoints: [{ protocol: "openai-chat", baseUrl: "https://openrouter.ai/api/v1" }],
    models: [],
    connections: { pi: { connectedAt: "t" } },
  };
  expect(toProviderProfile(v2)).toEqual(v2);
});

test("saveStore writes schemaVersion 2, mode 0600 and syncs legacy fields", async () => {
  const repository = createProfileStore(path);
  const provider: ProviderProfile = {
    ...legacyExternal,
    baseUrl: "stale",
    model: "stale",
    endpoints: [
      { protocol: "openai-chat", baseUrl: "https://api.kimi.com/coding/v1" },
      { protocol: "anthropic-messages", baseUrl: "https://api.kimi.com/coding" },
    ],
    models: [toProviderProfile({ ...legacyExternal, model: "kimi-for-coding" }).models[0]!],
    connections: {},
  };
  await repository.saveStore({ current: null, importOffered: true, profiles: { router: provider } });
  const saved = (await Bun.file(path).json()) as { schemaVersion: number; importOffered: boolean; profiles: Record<string, ExternalProfile> };
  expect(saved.schemaVersion).toBe(2);
  expect(saved.importOffered).toBe(true);
  expect(saved.profiles.router?.baseUrl).toBe("https://api.kimi.com/coding");
  expect(saved.profiles.router?.model).toBe("kimi-for-coding");
  if (process.platform !== "win32") expect((await stat(path)).mode & 0o777).toBe(0o600);
  expect((await repository.loadStore()).importOffered).toBe(true);
});

test("saveStore prefers the Claude Code default model for the legacy model field", async () => {
  const repository = createProfileStore(path);
  await writeRaw({ current: "router", profiles: { router: legacyExternal } });
  const store = await repository.loadStore();
  const profile = store.profiles.router as ProviderProfile;
  store.profiles.router = { ...profile, models: [...profile.models, { ...profile.models[0]!, id: "other" }] };
  await repository.saveStore(store);
  const saved = (await Bun.file(path).json()) as { profiles: Record<string, ExternalProfile> };
  expect(saved.profiles.router?.model).toBe("moonshotai/kimi-k2");
});

test("applyLegacyEdits moves a legacy base URL and model edit into endpoints and models", async () => {
  const repository = createProfileStore(path);
  await writeRaw({ current: "router", profiles: { router: legacyExternal } });
  const store = await repository.loadStore();
  const edited = applyLegacyEdits(store.profiles.router as ProviderProfile, {
    baseUrl: "https://new.example.com/v1",
    model: "new-model",
  });
  store.profiles.router = edited;
  await repository.saveStore(store);
  const saved = (await Bun.file(path).json()) as { profiles: Record<string, ProviderProfile> };
  expect(saved.profiles.router?.baseUrl).toBe("https://new.example.com");
  expect(saved.profiles.router?.model).toBe("new-model");
  expect(saved.profiles.router?.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://new.example.com" }]);
  expect(saved.profiles.router?.connections["claude-code"]?.defaultModel).toBe("new-model");
});

const openAiOnly: ProviderProfile = {
  ...legacyExternal,
  name: "oa",
  baseUrl: "https://o.example.com/v1",
  model: "gpt-x",
  endpoints: [{ protocol: "openai-chat", baseUrl: "https://o.example.com/v1" }],
  models: [toProviderProfile({ ...legacyExternal, model: "gpt-x" }).models[0]!],
  connections: { pi: { connectedAt: "t" } },
};

test("applyLegacyEdits ignores a base URL and model that match the derived legacy fields", () => {
  const edited = applyLegacyEdits(openAiOnly, { baseUrl: "https://o.example.com/v1/", model: "gpt-x" });
  expect(edited.endpoints).toEqual(openAiOnly.endpoints);
  expect(edited.models).toEqual(openAiOnly.models);
  expect(edited.connections).toEqual(openAiOnly.connections);
});

test("applyLegacyEdits retargets the OpenAI endpoint instead of inventing an Anthropic one", () => {
  const edited = applyLegacyEdits(openAiOnly, { baseUrl: "https://n.example.com" });
  expect(edited.endpoints).toEqual([{ protocol: "openai-chat", baseUrl: "https://n.example.com" }]);
  expect(edited.baseUrl).toBe("https://n.example.com");
});

test("applyLegacyEdits updates only the Anthropic endpoint when one exists", () => {
  const mixed: ProviderProfile = {
    ...openAiOnly,
    endpoints: [
      { protocol: "openai-chat", baseUrl: "https://o.example.com/v1" },
      { protocol: "anthropic-messages", baseUrl: "https://o.example.com/anthropic" },
    ],
  };
  const edited = applyLegacyEdits(mixed, { baseUrl: "https://n.example.com/anthropic/v1" });
  expect(edited.endpoints).toEqual([
    { protocol: "openai-chat", baseUrl: "https://o.example.com/v1" },
    { protocol: "anthropic-messages", baseUrl: "https://n.example.com/anthropic" },
  ]);
});

test("a desktop rename that resends the shown base URL and model keeps the profile unswitchable to Claude Code", async () => {
  const repository = createProfileStore(path);
  await repository.saveStore({ current: null, profiles: { oa: openAiOnly } });
  const loaded = (await repository.loadStore()).profiles.oa as ProviderProfile;
  const edited = applyLegacyEdits({ ...loaded, name: "renamed" }, { baseUrl: loaded.baseUrl, model: loaded.model });
  await repository.saveStore({ current: null, profiles: { renamed: edited } });
  const saved = (await Bun.file(path).json()) as { profiles: Record<string, ProviderProfile> };
  expect(saved.profiles.renamed?.endpoints).toEqual(openAiOnly.endpoints);
  expect(saved.profiles.renamed?.endpoints.some((endpoint) => endpoint.protocol === "anthropic-messages")).toBe(false);
});

test("loadStore leaves an in-sync migrated profile unchanged", async () => {
  const repository = createProfileStore(path);
  await repository.saveStore({ current: null, profiles: { oa: openAiOnly } });
  const loaded = (await repository.loadStore()).profiles.oa as ProviderProfile;
  expect(loaded.endpoints).toEqual(openAiOnly.endpoints);
  expect(loaded.models).toEqual(openAiOnly.models);
});

test("loadStore applies legacy base URL and model edits made by an older sidecar", async () => {
  const repository = createProfileStore(path);
  const migrated = toProviderProfile(legacyExternal);
  const current: ProviderProfile = {
    ...migrated,
    connections: { "claude-code": { connectedAt: "t", defaultModel: "moonshotai/kimi-k2" } },
  };
  await repository.saveStore({ current: "router", profiles: { router: current } });
  const raw = (await Bun.file(path).json()) as { current: string; profiles: Record<string, ProviderProfile> };
  await writeRaw({
    ...raw,
    profiles: { router: { ...raw.profiles.router, baseUrl: "https://new.example.com/v1", model: "m2" } },
  });
  const store = await repository.loadStore();
  const loaded = store.profiles.router as ProviderProfile;
  expect(loaded.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://new.example.com" }]);
  expect(loaded.connections["claude-code"]?.defaultModel).toBe("m2");
  expect(loaded.models.map((model) => model.id).sort()).toEqual(["m2", "moonshotai/kimi-k2"]);
  await repository.saveStore(store);
  const saved = (await Bun.file(path).json()) as { profiles: Record<string, ProviderProfile> };
  expect(saved.profiles.router?.baseUrl).toBe("https://new.example.com");
  expect(saved.profiles.router?.model).toBe("m2");
});

const codexProfile = {
  type: "codex",
  name: "codex-work",
  snapshot: { files: { "auth.json": "{\"tokens\":{}}" } },
  identity: { label: "work@example.com", email: "work@example.com", plan: "plus", accountId: "acct-1" },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("loadStore keeps subscription profiles and currentByTool next to legacy and provider profiles", async () => {
  await writeRaw({
    current: "router",
    currentByTool: { codex: "codex-work", bogus: "x", kimi: 7 },
    profiles: {
      work: { name: "work", keychain: "{}", account: null, updatedAt: "t" },
      router: legacyExternal,
      "codex-work": codexProfile,
    },
  });
  const store = await createProfileStore(path).loadStore();
  expect(store.profiles.work?.type).toBe("claude");
  expect(store.profiles.router?.type).toBe("external");
  expect(store.profiles["codex-work"]).toEqual(codexProfile as SubscriptionProfile);
  expect(store.currentByTool).toEqual({ codex: "codex-work" });
  expect(store.current).toBe("router");
});

test("loadStore repairs a subscription profile with a malformed snapshot or identity", async () => {
  await writeRaw({
    current: null,
    profiles: { k: { type: "kimi", name: "k", snapshot: { files: { a: 1 }, keyring: "x" }, updatedAt: "t" } },
  });
  const profile = (await createProfileStore(path).loadStore()).profiles.k;
  expect(profile).toEqual({ type: "kimi", name: "k", snapshot: { files: {} }, identity: { label: "k" }, updatedAt: "t" });
});

test("saveStore moves subscription profiles and currentByTool out of profiles.json", async () => {
  const repository = createProfileStore(path);
  await writeRaw({ current: "router", profiles: { router: legacyExternal, "codex-work": codexProfile } });
  const store = await repository.loadStore();
  store.currentByTool = { codex: "codex-work" };
  await repository.saveStore(store);
  const saved = (await Bun.file(path).json()) as Record<string, unknown> & { profiles: Record<string, unknown> };
  expect(saved.current).toBe("router");
  expect("currentByTool" in saved).toBe(false);
  expect(Object.keys(saved.profiles)).toEqual(["router"]);
  const subscriptions = (await Bun.file(subscriptionsPath()).json()) as {
    schemaVersion: number;
    currentByTool: unknown;
    profiles: Record<string, unknown>;
  };
  expect(subscriptions).toEqual({ schemaVersion: 1, currentByTool: { codex: "codex-work" }, profiles: { "codex-work": codexProfile } });
  if (process.platform !== "win32") expect((await stat(subscriptionsPath())).mode & 0o777).toBe(0o600);
  const reloaded = await repository.loadStore();
  expect(reloaded.profiles["codex-work"]).toEqual(codexProfile as SubscriptionProfile);
  expect(reloaded.currentByTool).toEqual({ codex: "codex-work" });
  expect((reloaded.profiles.router as ProviderProfile).endpoints).toEqual((store.profiles.router as ProviderProfile).endpoints);
  expect((reloaded.profiles.router as ProviderProfile).connections).toEqual((store.profiles.router as ProviderProfile).connections);
});

const MAIN_BRANCH_PROFILE_FIELDS: Record<string, string[]> = {
  claude: ["name", "updatedAt"],
  external: ["name", "provider", "baseUrl", "model", "updatedAt"],
};

const parsesAsMainBranchStore = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) return false;
  const { current, profiles } = value as { current?: unknown; profiles?: unknown };
  if (current !== undefined && current !== null && typeof current !== "string") return false;
  if (typeof profiles !== "object" || profiles === null) return false;
  return Object.values(profiles as Record<string, Record<string, unknown>>).every((profile) => {
    const required = MAIN_BRANCH_PROFILE_FIELDS[String(profile.type)];
    return required !== undefined && required.every((field) => typeof profile[field] === "string");
  });
};

test("a store holding every profile kind stays readable by the pre-subscription desktop RawStore", async () => {
  const repository = createProfileStore(path);
  await repository.saveStore({
    current: "router",
    currentByTool: { codex: "codex-work" },
    profiles: {
      work: { type: "claude", name: "work", keychain: "{}", account: null, updatedAt: "t" },
      router: toProviderProfile(legacyExternal),
      "codex-work": codexProfile as SubscriptionProfile,
    },
  });
  const saved = (await Bun.file(path).json()) as { profiles: Record<string, unknown> };
  expect(parsesAsMainBranchStore(saved)).toBe(true);
  expect(Object.keys(saved.profiles).sort()).toEqual(["router", "work"]);
});

test("subscriptions survive an older sidecar rewriting profiles.json with only current and profiles", async () => {
  const repository = createProfileStore(path);
  await repository.saveStore({
    current: null,
    currentByTool: { codex: "codex-work" },
    profiles: { router: toProviderProfile(legacyExternal), "codex-work": codexProfile as SubscriptionProfile },
  });
  const saved = (await Bun.file(path).json()) as { profiles: Record<string, unknown> };
  await writeRaw({ current: "router", profiles: saved.profiles });
  const store = await repository.loadStore();
  expect(store.current).toBe("router");
  expect(store.currentByTool).toEqual({ codex: "codex-work" });
  expect(store.profiles["codex-work"]).toEqual(codexProfile as SubscriptionProfile);
});

test("loadStore renames a subscription whose name an older writer gave to a Claude account", async () => {
  const repository = createProfileStore(path);
  await repository.saveStore({
    current: null,
    currentByTool: { codex: "work" },
    profiles: { work: { ...(codexProfile as SubscriptionProfile), name: "work" } },
  });
  await writeRaw({ current: "work", profiles: { work: { type: "claude", name: "work", keychain: "{}", account: null, updatedAt: "t" } } });
  const store = await repository.loadStore();
  expect(store.profiles.work?.type).toBe("claude");
  expect(store.profiles["work-2"]).toEqual({ ...(codexProfile as SubscriptionProfile), name: "work-2" });
  expect(store.currentByTool).toEqual({ codex: "work-2" });
});

test("saveStore removes subscriptions.json once the last subscription and selection are gone", async () => {
  const repository = createProfileStore(path);
  await repository.saveStore({ current: null, currentByTool: { codex: "codex-work" }, profiles: { "codex-work": codexProfile as SubscriptionProfile } });
  expect(await Bun.file(subscriptionsPath()).exists()).toBe(true);
  await repository.saveStore({ current: null, currentByTool: {}, profiles: {} });
  expect(await Bun.file(subscriptionsPath()).exists()).toBe(false);
  expect(await repository.loadStore()).toEqual({ schemaVersion: 2, current: null, profiles: {} });
});

test("loadStore omits currentByTool when the file has none", async () => {
  await writeRaw({ current: null, profiles: {} });
  expect("currentByTool" in (await createProfileStore(path).loadStore())).toBe(false);
});
