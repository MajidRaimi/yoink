import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createCodexAdapter } from "../src/features/harnesses/adapters/codex";
import { createHarnessSync } from "../src/features/harnesses/sync";
import { ALLOW_TRACKED_SWITCH } from "../src/features/harnesses/tracked-guard";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import type { ProviderProfile } from "../src/features/profiles/types";
import { ensureBackup } from "../src/shared/backup";
import { excludeFromEnclosingRepo, isTrackedAndNotIgnored } from "../src/shared/git-status";
import { makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

const ORIGINAL_CODEX_CONFIG = 'model = "gpt-5"\n';

let root: string;
let store: ProfileStoreRepository;

const git = (dir: string, ...args: string[]): string => {
  const result = Bun.spawnSync(["git", "-C", dir, ...args], { stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr.toString()}`);
  return result.stdout.toString();
};

const initRepo = (dir: string): void => {
  git(dir, "init", "--quiet");
};

const codexProvider = (): ProviderProfile =>
  makeProvider({ endpoints: [{ protocol: "openai-responses", baseUrl: "https://api.fuse.test/v1" }] });

const saveProvider = async (provider: ProviderProfile): Promise<void> => {
  await store.saveStore({ current: null, profiles: { [provider.name]: provider } });
};

const recordingAdapter = (configPath: string, calls: string[], writeTargets?: string[]): HarnessAdapter => ({
  id: "pi",
  label: "Pi",
  protocols: ["openai-chat", "openai-responses", "anthropic-messages"],
  exclusive: false,
  experimental: false,
  setsDefaultModel: false,
  detect: async () => ({ installed: true, configPath }),
  ...(writeTargets ? { writeTargets: async () => writeTargets } : {}),
  readProviders: async () => [],
  isConnected: async () => false,
  readDefaultModel: async () => null,
  connect: async (provider) => {
    calls.push(provider.name);
  },
  disconnect: async () => {},
});

beforeEach(async () => {
  root = await makeTempDir();
  store = createProfileStore(join(root, "yoink", "profiles.json"));
});

afterEach(async () => {
  await removeTempDir(root);
});

test("connect refuses a tracked config and leaves the harness untouched", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const calls: string[] = [];
  const configPath = join(root, "pi", "models.json");
  const sync = createHarnessSync({
    adapters: [recordingAdapter(configPath, calls)],
    store,
    isTracked: async (path) => path === configPath,
  });

  const outcomes = await sync.connectHarnesses(provider.name, ["pi"], {});

  expect(calls).toEqual([]);
  expect(outcomes).toHaveLength(1);
  const [outcome] = outcomes;
  expect(outcome?.ok).toBe(false);
  if (outcome && !outcome.ok) {
    expect(outcome.trackedPaths).toEqual([configPath]);
    expect(outcome.message).toContain(ALLOW_TRACKED_SWITCH);
  }
  expect((await sync.loadProvider(provider.name)).connections.pi).toBeUndefined();
});

test("connect writes a tracked config when allowTracked is set", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const calls: string[] = [];
  const configPath = join(root, "pi", "models.json");
  const sync = createHarnessSync({
    adapters: [recordingAdapter(configPath, calls)],
    store,
    isTracked: async () => true,
  });

  const outcomes = await sync.connectHarnesses(provider.name, ["pi"], { allowTracked: true });

  expect(outcomes).toEqual([{ id: "pi", ok: true }]);
  expect(calls).toEqual([provider.name]);
});

test("connect checks every declared write target, not only the detected config", async () => {
  const provider = makeProvider();
  await saveProvider(provider);
  const calls: string[] = [];
  const secretsPath = join(root, "goose", "secrets.yaml");
  const sync = createHarnessSync({
    adapters: [recordingAdapter(join(root, "goose", "config.yaml"), calls, [join(root, "goose", "config.yaml"), secretsPath])],
    store,
    isTracked: async (path) => path === secretsPath,
  });

  const [outcome] = await sync.connectHarnesses(provider.name, ["pi"], {});

  expect(calls).toEqual([]);
  expect(outcome && !outcome.ok ? outcome.trackedPaths : null).toEqual([secretsPath]);
});

test("rename resync refuses a tracked config before removing the old entry", async () => {
  const provider = makeProvider({ connections: { pi: { connectedAt: "2026-01-01T00:00:00.000Z" } } });
  await saveProvider(provider);
  const disconnected: string[] = [];
  const configPath = join(root, "pi", "models.json");
  const adapter: HarnessAdapter = {
    ...recordingAdapter(configPath, []),
    disconnect: async (providerId) => {
      disconnected.push(providerId);
    },
  };
  const sync = createHarnessSync({ adapters: [adapter], store, isTracked: async () => true });

  const outcomes = await sync.resyncProvider(provider, "old-name");

  expect(disconnected).toEqual([]);
  expect(outcomes.map((outcome) => outcome.ok)).toEqual([false]);
});

test("a git-tracked codex config is refused end to end and its backup stays out of git", async () => {
  const codexHome = join(root, "codex");
  await mkdir(codexHome, { recursive: true });
  const configPath = join(codexHome, "config.toml");
  await writeFile(configPath, ORIGINAL_CODEX_CONFIG);
  initRepo(codexHome);
  git(codexHome, "add", "config.toml");
  const provider = codexProvider();
  await saveProvider(provider);
  const sync = createHarnessSync({
    adapters: [createCodexAdapter({ codexHome }, probesWith(["codex"]))],
    store,
  });

  const [refused] = await sync.connectHarnesses(provider.name, ["codex"], {});
  expect(refused?.ok).toBe(false);
  expect(await readText(configPath)).toBe(ORIGINAL_CODEX_CONFIG);

  const [allowed] = await sync.connectHarnesses(provider.name, ["codex"], { allowTracked: true });
  expect(allowed?.ok).toBe(true);
  expect(await readText(configPath)).toContain(provider.name);
  expect(await Bun.file(`${configPath}.yoink.bak`).exists()).toBe(true);
  expect(git(codexHome, "status", "--porcelain", "--untracked-files=all")).not.toContain(".yoink.bak");
});

test("isTrackedAndNotIgnored follows a symlink into a dotfiles repo", async () => {
  const dotfiles = join(root, "dotfiles");
  const home = join(root, "home");
  await mkdir(dotfiles, { recursive: true });
  await mkdir(home, { recursive: true });
  const repoFile = join(dotfiles, "opencode.json");
  await writeFile(repoFile, "{}\n");
  initRepo(dotfiles);
  git(dotfiles, "add", "opencode.json");
  const linked = join(home, "opencode.json");
  await symlink(repoFile, linked);

  expect(await isTrackedAndNotIgnored(linked)).toBe(true);
  expect(await isTrackedAndNotIgnored(join(home, "missing.json"))).toBe(false);
});

test("isTrackedAndNotIgnored still flags a tracked file that a gitignore lists", async () => {
  const repo = join(root, "repo");
  await mkdir(repo, { recursive: true });
  await writeFile(join(repo, "settings.json"), "{}\n");
  await writeFile(join(repo, ".gitignore"), "settings.json\n");
  initRepo(repo);
  git(repo, "add", "-f", "settings.json");

  expect(await isTrackedAndNotIgnored(join(repo, "settings.json"))).toBe(true);
});

test("excludeFromEnclosingRepo adds the pattern once and skips paths outside a repo", async () => {
  const repo = join(root, "repo");
  await mkdir(repo, { recursive: true });
  initRepo(repo);

  await excludeFromEnclosingRepo(join(repo, "a.json.yoink.bak"), "*.yoink.bak");
  await excludeFromEnclosingRepo(join(repo, "b.json.yoink.bak"), "*.yoink.bak");
  await excludeFromEnclosingRepo(join(root, "outside", "c.json.yoink.bak"), "*.yoink.bak");

  const exclude = await readText(join(repo, ".git", "info", "exclude"));
  expect(exclude.split("\n").filter((line) => line === "*.yoink.bak")).toHaveLength(1);
});

test("ensureBackup inside a repo never shows up as an untracked file", async () => {
  const repo = join(root, "repo");
  await mkdir(repo, { recursive: true });
  const configPath = join(repo, "crush.json");
  await writeFile(configPath, "{}\n");
  initRepo(repo);
  git(repo, "add", "crush.json");

  await ensureBackup(configPath);

  expect(await Bun.file(`${configPath}.yoink.bak`).exists()).toBe(true);
  expect(git(repo, "status", "--porcelain", "--untracked-files=all")).toBe("A  crush.json\n");
});
