import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createCodexAdapter } from "../src/features/harnesses/adapters/codex";
import { createOpencodeAdapter } from "../src/features/harnesses/adapters/opencode";
import { createPiAdapter } from "../src/features/harnesses/adapters/pi";
import { mergeImportedProviders, type ImportCandidate } from "../src/features/harnesses/import";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import { createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import { createImportProvider, type ImportProvider } from "../src/features/providers/import-provider";
import { makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

const BASE_URL = "https://api.fuse.test/v1";
const TOKEN = "sk-test-import";

let root: string;
let piDir: string;
let opencodeDir: string;
let codexDir: string;
let store: ProfileStoreRepository;
let adapters: HarnessAdapter[];
let importProvider: ImportProvider;

const writeJson = async (path: string, value: unknown): Promise<void> => {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
};

const readJson = async (path: string): Promise<Record<string, unknown>> => JSON.parse(await readText(path));

const piEntry = { name: "Fuse", baseUrl: BASE_URL, api: "openai-completions", apiKey: TOKEN, models: [{ id: "m1" }] };

const opencodeEntry = {
  npm: "@ai-sdk/openai-compatible",
  name: "Fuse",
  options: { baseURL: BASE_URL, apiKey: TOKEN },
  models: { m1: { name: "m1" } },
};

const writePi = async (providerId: string): Promise<void> => {
  await writeJson(join(piDir, "models.json"), { providers: { [providerId]: piEntry } });
  await writeJson(join(piDir, "settings.json"), {
    theme: "dark",
    defaultProvider: providerId,
    defaultModel: `${providerId}/m1`,
  });
};

const writeOpencode = async (providerId: string): Promise<void> => {
  await writeJson(join(opencodeDir, "opencode.json"), {
    $schema: "https://opencode.ai/config.json",
    model: `${providerId}/m1`,
    provider: { [providerId]: opencodeEntry },
  });
};

const scan = async (): Promise<ImportCandidate> => {
  const found = (await Promise.all(adapters.map((adapter) => adapter.readProviders()))).flat();
  const [candidate] = mergeImportedProviders(found);
  if (!candidate) throw new Error("expected an import candidate");
  return candidate;
};

beforeEach(async () => {
  root = await makeTempDir();
  piDir = join(root, "pi");
  opencodeDir = join(root, "opencode");
  codexDir = join(root, "codex");
  await Promise.all([piDir, opencodeDir, codexDir].map((dir) => mkdir(dir, { recursive: true })));
  store = createProfileStore(join(root, "yoink", "profiles.json"));
  adapters = [
    createPiAdapter({ agentDir: piDir }, probesWith([])),
    createOpencodeAdapter({ configDir: opencodeDir, appBundles: [] }, probesWith([])),
    createCodexAdapter({ codexHome: codexDir }, probesWith([])),
  ];
  importProvider = createImportProvider({ store, adapters });
});

afterEach(async () => {
  await removeTempDir(root);
});

test("importing a non-slug id keeps the original entries and their defaults", async () => {
  await writePi("My_Fuse");
  await writeOpencode("My_Fuse");
  const { profile, outcomes } = await importProvider(await scan());
  expect(profile.name).toBe("My_Fuse");
  expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
  const opencode = await readJson(join(opencodeDir, "opencode.json"));
  expect(opencode.model).toBe("My_Fuse/m1");
  expect(Object.keys(opencode.provider as Record<string, unknown>)).toEqual(["My_Fuse"]);
  const settings = await readJson(join(piDir, "settings.json"));
  expect(settings).toEqual({ theme: "dark", defaultProvider: "My_Fuse", defaultModel: "My_Fuse/m1" });
  expect(profile.connections.opencode?.defaultModel).toBe("m1");
  expect(profile.connections.pi?.defaultModel).toBe("m1");
});

test("importing under a new name connects first and carries the default over", async () => {
  await writeOpencode("fuse");
  const taken = await store.loadStore();
  taken.profiles.fuse = makeProvider({ token: "sk-someone-else" });
  await store.saveStore(taken);
  const { profile, outcomes } = await importProvider(await scan());
  expect(profile.name).toBe("fuse-2");
  expect(outcomes).toEqual([{ id: "opencode", ok: true }]);
  const opencode = await readJson(join(opencodeDir, "opencode.json"));
  expect(opencode.model).toBe("fuse-2/m1");
  expect(Object.keys(opencode.provider as Record<string, unknown>)).toEqual(["fuse-2"]);
  expect(profile.connections.opencode?.defaultModel).toBe("m1");
});

test("importing never renames onto an unrelated entry in a source harness", async () => {
  const unrelated = { ...opencodeEntry, options: { baseURL: "https://other.test/v1", apiKey: "sk-unrelated" } };
  await writeJson(join(opencodeDir, "opencode.json"), {
    model: "Fuse!/m1",
    provider: { "Fuse!": opencodeEntry, fuse: unrelated },
  });
  const { profile } = await importProvider(await scan());
  expect(profile.name).toBe("fuse-2");
  const opencode = await readJson(join(opencodeDir, "opencode.json"));
  expect(opencode.model).toBe("fuse-2/m1");
  expect(opencode.provider).toEqual({ fuse: unrelated, "fuse-2": expect.any(Object) });
});

test("importing leaves a harness untouched when it cannot use the provider's protocols", async () => {
  const codexConfig = `model = "m1"
model_provider = "chatty"

[model_providers.chatty]
name = "Chatty"
base_url = "${BASE_URL}"
wire_api = "chat"
experimental_bearer_token = "${TOKEN}"
`;
  const configPath = join(codexDir, "config.toml");
  await writeFile(configPath, codexConfig);
  const { profile, outcomes } = await importProvider(await scan());
  expect(await readText(configPath)).toBe(codexConfig);
  expect(outcomes).toHaveLength(1);
  expect(outcomes[0]?.ok).toBe(false);
  expect(profile.connections.codex).toBeUndefined();
});

test("importing one provider with different ids per harness leaves a single entry in each", async () => {
  await writeJson(join(piDir, "models.json"), { providers: { fuse: piEntry } });
  await writeOpencode("fuse-ai");
  const { profile, outcomes } = await importProvider(await scan());
  expect(profile.name).toBe("fuse");
  expect(outcomes.every((outcome) => outcome.ok)).toBe(true);
  const opencode = await readJson(join(opencodeDir, "opencode.json"));
  expect(Object.keys(opencode.provider as Record<string, unknown>)).toEqual(["fuse"]);
  expect(opencode.model).toBe("fuse/m1");
  const pi = await readJson(join(piDir, "models.json"));
  expect(Object.keys(pi.providers as Record<string, unknown>)).toEqual(["fuse"]);
  expect(Object.keys(profile.connections).sort()).toEqual(["opencode", "pi"]);
});
