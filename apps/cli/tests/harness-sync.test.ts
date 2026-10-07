import { afterEach, beforeEach, expect, test } from "bun:test";
import { join } from "node:path";
import { createCodexAdapter } from "../src/features/harnesses/adapters/codex";
import { createDroidAdapter } from "../src/features/harnesses/adapters/droid";
import { createOmpAdapter } from "../src/features/harnesses/adapters/omp";
import { createOpencodeAdapter } from "../src/features/harnesses/adapters/opencode";
import { createPiAdapter } from "../src/features/harnesses/adapters/pi";
import { createHarnessSync, type HarnessSync } from "../src/features/harnesses/sync";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { pruneStaleDefaultModels } from "../src/features/profiles/default-model";
import { createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import type { Connections, HarnessId, ProviderProfile, SubscriptionProfile } from "../src/features/profiles/types";
import { kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir, visionModel } from "./support/provider-fixture";

type ExclusiveState = {
  current: string | null;
  token: string | null;
  model: string | null;
};

const connectedAt = "2026-01-01T00:00:00.000Z";
const FILE_HARNESSES: readonly HarnessId[] = ["pi", "omp", "opencode", "codex"];

let root: string;
let store: ProfileStoreRepository;
let fileAdapters: HarnessAdapter[];
let exclusive: ExclusiveState;
let sync: HarnessSync;

const createExclusiveAdapter = (state: ExclusiveState): HarnessAdapter => ({
  id: "claude-code",
  label: "Claude Code",
  protocols: ["anthropic-messages", "openai-chat", "openai-responses"],
  exclusive: true,
  experimental: false,
  setsDefaultModel: true,
  detect: async () => ({ installed: true, configPath: "/fake/settings.json" }),
  readProviders: async () => [],
  isConnected: async (providerId) => state.current === providerId,
  readDefaultModel: async (providerId) => (state.current === providerId ? state.model : null),
  connect: async (provider, options) => {
    state.current = provider.name;
    state.token = provider.token;
    state.model = options.defaultModel ?? provider.models[0]?.id ?? null;
  },
  disconnect: async (providerId) => {
    if (state.current !== providerId) return;
    state.current = null;
    state.token = null;
    state.model = null;
  },
});

const findFileAdapter = (id: HarnessId): HarnessAdapter => {
  const adapter = fileAdapters.find((candidate) => candidate.id === id);
  if (!adapter) throw new Error(`missing adapter ${id}`);
  return adapter;
};

const saveProvider = async (provider: ProviderProfile, current: string | null = null): Promise<void> => {
  await store.saveStore({ current, profiles: { [provider.name]: provider } });
};

const storedProvider = async (name: string): Promise<ProviderProfile> => sync.loadProvider(name);

const applyUpdate = async (previous: ProviderProfile, next: ProviderProfile): Promise<void> => {
  const snapshot = await store.loadStore();
  delete snapshot.profiles[previous.name];
  snapshot.profiles[next.name] = { ...next, connections: pruneStaleDefaultModels(next.connections, next.models) };
  if (snapshot.current === previous.name) snapshot.current = next.name;
  await store.saveStore(snapshot);
};

const piSettings = async (): Promise<Record<string, unknown>> =>
  JSON.parse(await readText(join(root, "pi", "settings.json"))) as Record<string, unknown>;

const importedConnections = (ids: readonly HarnessId[]): Connections =>
  Object.fromEntries(ids.map((id) => [id, { connectedAt }]));

beforeEach(async () => {
  root = await makeTempDir();
  store = createProfileStore(join(root, "yoink", "profiles.json"));
  fileAdapters = [
    createPiAdapter({ agentDir: join(root, "pi") }, probesWith([])),
    createOmpAdapter({ agentDir: join(root, "omp") }, probesWith([])),
    createOpencodeAdapter({ configDir: join(root, "opencode"), appBundles: [] }, probesWith([])),
    createCodexAdapter({ codexHome: join(root, "codex") }, probesWith([])),
  ];
  exclusive = { current: null, token: null, model: null };
  sync = createHarnessSync({ adapters: [createExclusiveAdapter(exclusive), ...fileAdapters], store });
});

afterEach(async () => {
  await removeTempDir(root);
});

test("removing the default model moves every harness default to a remaining model", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const outcomes = await sync.connectHarnesses(provider.name, ["claude-code", ...FILE_HARNESSES], {
    defaultModel: visionModel.id,
  });
  expect(outcomes.every((outcome) => outcome.ok)).toBe(true);

  const connected = await storedProvider(provider.name);
  const trimmed = { ...connected, models: [kimiModel] };
  await applyUpdate(connected, trimmed);
  await sync.resyncProvider(await storedProvider(provider.name), provider.name);

  for (const id of FILE_HARNESSES) {
    expect(await findFileAdapter(id).readDefaultModel(provider.name)).toBe(kimiModel.id);
  }
  expect(await piSettings()).toEqual({ defaultProvider: "fuse", defaultModel: `fuse/${kimiModel.id}` });
  expect(exclusive.model).toBe(kimiModel.id);
  const stored = await storedProvider(provider.name);
  expect(stored.model).toBe(kimiModel.id);
  for (const id of ["claude-code", ...FILE_HARNESSES] as const) {
    expect(stored.connections[id]?.defaultModel).toBe(kimiModel.id);
  }
});

test("a harness default set outside yoink is moved off a removed model", async () => {
  const provider = makeProvider({ connections: importedConnections(["pi"]) });
  await findFileAdapter("pi").connect(provider, { defaultModel: visionModel.id });
  await saveProvider(provider);

  await applyUpdate(provider, { ...provider, models: [kimiModel] });
  await sync.resyncProvider(await storedProvider(provider.name), provider.name);

  expect(await piSettings()).toEqual({ defaultProvider: "fuse", defaultModel: `fuse/${kimiModel.id}` });
});

test("renaming an imported provider moves each harness default to the new id", async () => {
  const provider = makeProvider({ connections: importedConnections(FILE_HARNESSES) });
  for (const id of FILE_HARNESSES) {
    await findFileAdapter(id).connect(provider, { defaultModel: visionModel.id });
  }
  await saveProvider(provider);

  const renamed = { ...provider, name: "fuse2" };
  await applyUpdate(provider, renamed);
  const outcomes = await sync.resyncProvider(await storedProvider("fuse2"), provider.name);

  expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
  for (const id of FILE_HARNESSES) {
    const adapter = findFileAdapter(id);
    expect(await adapter.isConnected(provider.name)).toBe(false);
    expect(await adapter.readDefaultModel(provider.name)).toBeNull();
    expect(await adapter.readDefaultModel("fuse2")).toBe(visionModel.id);
  }
  expect(await piSettings()).toEqual({ defaultProvider: "fuse2", defaultModel: `fuse2/${visionModel.id}` });
  const stored = await storedProvider("fuse2");
  for (const id of FILE_HARNESSES) {
    expect(stored.connections[id]?.defaultModel).toBe(visionModel.id);
  }
});

test("resyncing under a suffixed import name keeps the source harness default", async () => {
  const source = makeProvider({ name: "fuse" });
  await findFileAdapter("pi").connect(source, { defaultModel: visionModel.id });
  const imported = makeProvider({ name: "fuse-2", connections: importedConnections(["pi"]) });
  await saveProvider(imported);

  await sync.resyncProvider(await storedProvider("fuse-2"), "fuse");

  expect(await piSettings()).toEqual({ defaultProvider: "fuse-2", defaultModel: `fuse-2/${visionModel.id}` });
  expect((await storedProvider("fuse-2")).connections.pi?.defaultModel).toBe(visionModel.id);
});

test("a harness that points at another provider keeps its default on resync", async () => {
  const provider = makeProvider({ connections: importedConnections(["pi"]) });
  await findFileAdapter("pi").connect(makeProvider({ name: "other" }), { defaultModel: kimiModel.id });
  await saveProvider(provider);

  await sync.resyncProvider(await storedProvider(provider.name));

  expect(await piSettings()).toEqual({ defaultProvider: "other", defaultModel: `other/${kimiModel.id}` });
  expect((await storedProvider(provider.name)).connections.pi?.defaultModel).toBeUndefined();
});

test("a key rotation never takes back harness defaults moved to another provider", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  await sync.connectHarnesses(provider.name, ["pi", "codex"], { defaultModel: visionModel.id });
  const other = makeProvider({ name: "other" });
  await findFileAdapter("pi").connect(other, { defaultModel: kimiModel.id });
  await findFileAdapter("codex").connect(other, { defaultModel: kimiModel.id });

  const connected = await storedProvider(provider.name);
  await applyUpdate(connected, { ...connected, token: "sk-rotated" });
  const outcomes = await sync.resyncProvider(await storedProvider(provider.name), provider.name);

  expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
  expect(await piSettings()).toEqual({ defaultProvider: "other", defaultModel: `other/${kimiModel.id}` });
  expect(await findFileAdapter("codex").readDefaultModel(provider.name)).toBeNull();
  expect(await findFileAdapter("codex").readDefaultModel("other")).toBe(kimiModel.id);
  expect(await findFileAdapter("codex").isConnected(provider.name)).toBe(true);
});

test("loadProvider names the subscription type of a non-provider profile", async () => {
  const login: SubscriptionProfile = {
    type: "codex",
    name: "gpt-one",
    snapshot: { files: {} },
    identity: { label: "me@example.com" },
    updatedAt: connectedAt,
  };
  await store.saveStore({ current: null, profiles: { [login.name]: login } });

  await expect(sync.loadProvider("gpt-one")).rejects.toThrow('"gpt-one" is a ChatGPT (Codex) login, not a provider.');
});

test("a provider activated without a recorded connection still gets its new key in the exclusive harness", async () => {
  const provider = makeProvider();
  await saveProvider(provider, provider.name);
  exclusive.current = provider.name;
  exclusive.token = provider.token;
  exclusive.model = visionModel.id;

  const rotated = { ...provider, token: "sk-rotated" };
  await applyUpdate(provider, rotated);
  const outcomes = await sync.resyncProvider(await storedProvider(provider.name), provider.name);

  expect(outcomes).toEqual([{ id: "claude-code", ok: true }]);
  expect(exclusive.token).toBe("sk-rotated");
  expect(exclusive.model).toBe(visionModel.id);
  expect((await storedProvider(provider.name)).connections["claude-code"]?.defaultModel).toBe(visionModel.id);
});

test("an exclusive harness active on another provider is left alone", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  exclusive.current = "other";
  exclusive.token = "sk-other";

  expect(await sync.resyncProvider(await storedProvider(provider.name))).toEqual([]);
  expect(exclusive).toEqual({ current: "other", token: "sk-other", model: null });
});

test("connectHarnesses rejects a default model that is not one of the provider's models", async () => {
  const provider = makeProvider();
  await saveProvider(provider);

  await expect(sync.connectHarnesses(provider.name, ["pi", "claude-code"], { defaultModel: "typo-model" })).rejects.toThrow(
    '"typo-model" is not one of the models selected for "fuse"',
  );
  expect(await findFileAdapter("pi").isConnected(provider.name)).toBe(false);
  expect(exclusive.current).toBeNull();
  expect((await storedProvider(provider.name)).connections).toEqual({});
});

test("connectHarnesses records a valid default model", async () => {
  const provider = makeProvider();
  await saveProvider(provider);

  await sync.connectHarnesses(provider.name, ["pi"], { defaultModel: visionModel.id });

  expect(await piSettings()).toEqual({ defaultProvider: "fuse", defaultModel: `fuse/${visionModel.id}` });
  expect((await storedProvider(provider.name)).connections.pi?.defaultModel).toBe(visionModel.id);
});

test("a successful connect carries the adapter notice and the status reports it while connected", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const pi = findFileAdapter("pi");
  const noticed: HarnessAdapter = { ...pi, experimental: true, connectNotice: (target) => `Restart pi for ${target.name}` };
  const noticeSync = createHarnessSync({ adapters: [noticed], store });

  const before = await noticeSync.harnessStatuses(provider);
  expect(before[0]).toMatchObject({ experimental: true, connected: false, notice: null });

  const outcomes = await noticeSync.connectHarnesses(provider.name, ["pi"], {});
  expect(outcomes).toEqual([{ id: "pi", ok: true, notice: "Restart pi for fuse" }]);

  const after = await noticeSync.harnessStatuses(provider);
  expect(after[0]).toMatchObject({ connected: true, notice: "Restart pi for fuse" });
});

test("a failed connect never carries a notice", async () => {
  const provider = makeProvider({ endpoints: [{ protocol: "anthropic-messages", baseUrl: "https://api.fuse.test" }] });
  await saveProvider(provider);
  const codex = findFileAdapter("codex");
  const noticed: HarnessAdapter = { ...codex, connectNotice: () => "unused" };
  const outcomes = await createHarnessSync({ adapters: [noticed], store }).connectHarnesses(provider.name, ["codex"], {});
  expect(outcomes[0]?.ok).toBe(false);
  expect(outcomes[0]).not.toHaveProperty("notice");
});

test("a re-sync after connect never repeats the adapter notice", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const pi = findFileAdapter("pi");
  const noticed: HarnessAdapter = { ...pi, connectNotice: (target) => `Restart pi for ${target.name}` };
  const noticeSync = createHarnessSync({ adapters: [noticed], store });

  const connected = await noticeSync.connectHarnesses(provider.name, ["pi"], {});
  expect(connected).toEqual([{ id: "pi", ok: true, notice: "Restart pi for fuse" }]);

  const resynced = await noticeSync.resyncProvider(await noticeSync.loadProvider(provider.name));
  expect(resynced).toEqual([{ id: "pi", ok: true }]);
});

test("a harness that cannot set a default never records one on connect or resync", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const droid = createDroidAdapter({ configDir: join(root, "droid") }, probesWith([]));
  const droidSync = createHarnessSync({ adapters: [droid], store });

  const outcomes = await droidSync.connectHarnesses(provider.name, ["droid"], { defaultModel: visionModel.id });
  expect(outcomes).toEqual([{ id: "droid", ok: true }]);
  expect((await storedProvider(provider.name)).connections.droid).toEqual({ connectedAt: expect.any(String) });

  await droidSync.resyncProvider(await storedProvider(provider.name));
  expect((await storedProvider(provider.name)).connections.droid?.defaultModel).toBeUndefined();
  const statuses = await droidSync.harnessStatuses(await storedProvider(provider.name));
  expect(statuses[0]).toMatchObject({ connected: true, setsDefaultModel: false });
});
