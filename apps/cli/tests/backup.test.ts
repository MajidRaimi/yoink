import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createCodexAdapter } from "../src/features/harnesses/adapters/codex";
import { writeConfigFile } from "../src/features/harnesses/adapters/config-file";
import { createOmpAdapter } from "../src/features/harnesses/adapters/omp";
import { createOpencodeAdapter } from "../src/features/harnesses/adapters/opencode";
import { createPiAdapter } from "../src/features/harnesses/adapters/pi";
import { createHarnessSync, type HarnessSync } from "../src/features/harnesses/sync";
import { createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import type { HarnessId, ProviderProfile } from "../src/features/profiles/types";
import { backupPathFor, ensureBackup, retiredSecret, scrubbingBackups } from "../src/shared/backup";
import { makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";
import { expectMode } from "./support/posix";

const OLD_TOKEN = "sk-old-rotated-away";
const NEW_TOKEN = "sk-new-current";
const FILE_HARNESSES: readonly HarnessId[] = ["pi", "omp", "opencode", "codex"];

let root: string;
let store: ProfileStoreRepository;
let sync: HarnessSync;

const backupFiles = async (): Promise<string[]> => {
  const entries = await readdir(root, { recursive: true });
  return entries.filter((entry) => entry.endsWith(".yoink.bak")).map((entry) => join(root, entry));
};

const backupsContaining = async (secret: string): Promise<string[]> => {
  const files = await backupFiles();
  const texts = await Promise.all(files.map(readText));
  return files.filter((_file, index) => texts[index]?.includes(secret));
};

const saveProviders = async (providers: readonly ProviderProfile[]): Promise<void> => {
  await store.saveStore({ current: null, profiles: Object.fromEntries(providers.map((provider) => [provider.name, provider])) });
};

const rotateToken = async (name: string, token: string): Promise<void> => {
  const current = await sync.loadProvider(name);
  const snapshot = await store.loadStore();
  snapshot.profiles[name] = { ...current, token };
  await store.saveStore(snapshot);
  const stored = await sync.loadProvider(name);
  await scrubbingBackups(retiredSecret(current.token, stored.token), () => sync.resyncProvider(stored, name));
};

beforeEach(async () => {
  root = await makeTempDir();
  store = createProfileStore(join(root, "yoink", "profiles.json"));
  sync = createHarnessSync({
    adapters: [
      createPiAdapter({ agentDir: join(root, "pi") }, probesWith([])),
      createOmpAdapter({ agentDir: join(root, "omp") }, probesWith([])),
      createOpencodeAdapter({ configDir: join(root, "opencode"), appBundles: [] }, probesWith([])),
      createCodexAdapter({ codexHome: join(root, "codex") }, probesWith([])),
    ],
    store,
  });
});

afterEach(async () => {
  await removeTempDir(root);
});

test("a backup of a file yoink created stays an empty sentinel across later writes", async () => {
  const path = join(root, "harness", "config.json");
  await writeConfigFile(path, `{"key":"${OLD_TOKEN}"}`);
  await writeConfigFile(path, `{"key":"${NEW_TOKEN}"}`);
  expect(await readText(backupPathFor(path))).toBe("");
  await expectMode(backupPathFor(path), 0o600);
});

test("the backup keeps the user's pre-yoink original", async () => {
  const path = join(root, "harness", "config.json");
  await mkdir(join(root, "harness"), { recursive: true });
  await Bun.write(path, '{"user":true}');
  await writeConfigFile(path, `{"key":"${OLD_TOKEN}"}`);
  await writeConfigFile(path, `{"key":"${NEW_TOKEN}"}`);
  expect(await readText(backupPathFor(path))).toBe('{"user":true}');
});

test("scrubbingBackups removes retired secrets from backups touched by the action", async () => {
  const path = join(root, "harness", "config.json");
  await mkdir(join(root, "harness"), { recursive: true });
  await Bun.write(backupPathFor(path), `{"key":"${OLD_TOKEN}","other":"kept"}`);
  await scrubbingBackups([OLD_TOKEN], () => ensureBackup(path));
  expect(await readText(backupPathFor(path))).toBe('{"key":"","other":"kept"}');
});

test("connect, rotate and disconnect leave no backup holding the old token", async () => {
  await saveProviders([makeProvider({ token: OLD_TOKEN })]);
  await sync.connectHarnesses("fuse", FILE_HARNESSES, {});
  await rotateToken("fuse", NEW_TOKEN);
  expect(await backupsContaining(OLD_TOKEN)).toEqual([]);
  const outcomes = await sync.disconnectHarnesses("fuse", FILE_HARNESSES);
  expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
  expect((await backupFiles()).length).toBeGreaterThan(0);
  expect(await backupsContaining(OLD_TOKEN)).toEqual([]);
  expect(await backupsContaining(NEW_TOKEN)).toEqual([]);
});

test("a rotation scrubs the old token from a backup written by an earlier yoink", async () => {
  await saveProviders([makeProvider({ token: OLD_TOKEN })]);
  await sync.connectHarnesses("fuse", ["pi"], {});
  const legacyBackup = backupPathFor(join(root, "pi", "models.json"));
  await Bun.write(legacyBackup, await readText(join(root, "pi", "models.json")));
  await rotateToken("fuse", NEW_TOKEN);
  expect(await readText(legacyBackup)).not.toContain(OLD_TOKEN);
});

test("removing providers scrubs their tokens from backups written by an earlier yoink", async () => {
  const alpha = makeProvider({ name: "alpha", token: "sk-alpha-secret" });
  const beta = makeProvider({ name: "beta", token: "sk-beta-secret" });
  await saveProviders([alpha, beta]);
  await sync.connectHarnesses("alpha", ["pi", "omp"], {});
  await sync.connectHarnesses("beta", ["pi", "omp"], {});
  for (const path of [join(root, "pi", "models.json"), join(root, "omp", "models.yml")]) {
    await Bun.write(backupPathFor(path), await readText(path));
  }
  await sync.disconnectHarnesses("alpha", ["pi", "omp"]);
  await sync.disconnectHarnesses("beta", ["pi", "omp"]);
  expect(await backupsContaining("sk-alpha-secret")).toEqual([]);
  expect(await backupsContaining("sk-beta-secret")).toEqual([]);
});
