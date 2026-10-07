import { afterEach, beforeEach, expect, test } from "bun:test";
import { join } from "node:path";
import { createPiAdapter } from "../src/features/harnesses/adapters/pi";
import type { HarnessOutcome } from "../src/features/harnesses/sync";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { createRenameProfile, type RenameProfile, type ResyncRenamedProvider } from "../src/features/profiles/rename";
import { createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import type { ClaudeProfile, ProviderProfile } from "../src/features/profiles/types";
import { kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

type ResyncCall = { name: string; previousName: string };

let dir: string;
let repository: ProfileStoreRepository;
let calls: ResyncCall[];

const recordingResync =
  (outcomes: HarnessOutcome[] = []): ResyncRenamedProvider =>
  async (provider, previousName) => {
    calls.push({ name: provider.name, previousName });
    return outcomes;
  };

const seed = async (profiles: (ProviderProfile | ClaudeProfile)[], current: string | null): Promise<void> => {
  const store = await repository.loadStore();
  for (const profile of profiles) store.profiles[profile.name] = profile;
  store.current = current;
  await repository.saveStore(store);
};

const claudeProfile: ClaudeProfile = {
  type: "claude",
  name: "work",
  keychain: "{}",
  account: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const piConnected = (name: string): ProviderProfile =>
  makeProvider({ name, connections: { pi: { connectedAt: "2026-01-01T00:00:00.000Z", defaultModel: kimiModel.id } } });

beforeEach(async () => {
  dir = await makeTempDir();
  repository = createProfileStore(join(dir, "profiles.json"));
  calls = [];
});

afterEach(async () => {
  await removeTempDir(dir);
});

test("renaming a provider resyncs its harnesses under the new name", async () => {
  await seed([piConnected("oa")], "oa");
  const failure: HarnessOutcome = { id: "pi", ok: false, message: "boom" };
  const rename = createRenameProfile({ store: repository, resync: recordingResync([failure]) });
  expect(await rename("oa", "ob")).toEqual([failure]);
  expect(calls).toEqual([{ name: "ob", previousName: "oa" }]);
  const store = await repository.loadStore();
  expect(Object.keys(store.profiles)).toEqual(["ob"]);
  expect(store.profiles.ob?.name).toBe("ob");
  expect(store.current).toBe("ob");
});

test("renaming a Claude profile does not touch harnesses", async () => {
  await seed([claudeProfile], null);
  const rename = createRenameProfile({ store: repository, resync: recordingResync() });
  expect(await rename("work", "personal")).toEqual([]);
  expect(calls).toEqual([]);
  expect((await repository.loadStore()).profiles.personal?.name).toBe("personal");
});

test("rename rejects missing sources and taken targets without resyncing", async () => {
  await seed([piConnected("oa"), piConnected("ob")], null);
  const rename = createRenameProfile({ store: repository, resync: recordingResync() });
  await expect(rename("missing", "x")).rejects.toThrow('No profile named "missing".');
  await expect(rename("oa", "ob")).rejects.toThrow('A profile named "ob" already exists.');
  expect(calls).toEqual([]);
});

test("rename rejects names harness configs cannot use when the provider is connected", async () => {
  await seed([piConnected("oa"), makeProvider({ name: "loose" })], null);
  const rename = createRenameProfile({ store: repository, resync: recordingResync() });
  await expect(rename("oa", "has space")).rejects.toThrow('Invalid provider name "has space"');
  expect(Object.keys((await repository.loadStore()).profiles).sort()).toEqual(["loose", "oa"]);
  await rename("loose", "Loose Name");
  expect((await repository.loadStore()).profiles["Loose Name"]?.name).toBe("Loose Name");
});

test("renaming a pi-connected provider moves its pi entry and default to the new name", async () => {
  const agentDir = join(dir, "agent");
  const pi: HarnessAdapter = createPiAdapter({ agentDir }, probesWith([]));
  const original = piConnected("oa");
  await pi.connect(original, { defaultModel: kimiModel.id });
  await seed([original], null);
  const resync: ResyncRenamedProvider = async (provider, previousName) => {
    await pi.disconnect(previousName);
    await pi.connect(provider, { defaultModel: provider.connections.pi?.defaultModel });
    return [{ id: "pi", ok: true }];
  };
  const rename: RenameProfile = createRenameProfile({ store: repository, resync });
  await rename("oa", "ob");
  const models = JSON.parse(await readText(join(agentDir, "models.json")));
  expect(Object.keys(models.providers)).toEqual(["ob"]);
  const settings = JSON.parse(await readText(join(agentDir, "settings.json")));
  expect(settings.defaultProvider).toBe("ob");
  expect(await pi.isConnected("oa")).toBe(false);
});
