import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { createKiloAdapter } from "../src/features/harnesses/adapters/kilo";
import { createOpencodeAdapter } from "../src/features/harnesses/adapters/opencode";
import {
  createOpencodeFamilyAdapter,
  type OpencodeFamilySpec,
} from "../src/features/harnesses/adapters/opencode-family";
import { kimiModel, makeProvider, makeTempDir, probesWith, readText, removeTempDir } from "./support/provider-fixture";

let root: string;

const customSpec: OpencodeFamilySpec = {
  id: "kilo",
  label: "Custom Fork",
  binaries: ["fork", "fork-cli"],
  fileBase: "fork",
  emptyConfigText: "{\n  \"seeded\": true\n}\n",
};

const readJsonc = async (path: string): Promise<Record<string, unknown>> => parse(await readText(path));

beforeEach(async () => {
  root = await makeTempDir();
});

afterEach(async () => {
  await removeTempDir(root);
});

test("kilo and opencode write identical provider blocks and defaults", async () => {
  const opencode = createOpencodeAdapter({ configDir: join(root, "opencode"), appBundles: [] }, probesWith([]));
  const kilo = createKiloAdapter({ configDir: join(root, "kilo") }, probesWith([]));
  await opencode.connect(makeProvider(), { defaultModel: kimiModel.id });
  await kilo.connect(makeProvider(), { defaultModel: kimiModel.id });
  const opencodeConfig = await readJsonc(join(root, "opencode", "opencode.json"));
  const kiloConfig = await readJsonc(join(root, "kilo", "kilo.json"));
  expect(kiloConfig.provider).toEqual(opencodeConfig.provider);
  expect(kiloConfig.model).toBe(opencodeConfig.model as string);
  expect(opencodeConfig.$schema).toBe("https://opencode.ai/config.json");
  expect(kiloConfig.$schema).toBeUndefined();
});

test("kilo and opencode import the same providers apart from the source", async () => {
  const opencode = createOpencodeAdapter({ configDir: join(root, "opencode"), appBundles: [] }, probesWith([]));
  const kilo = createKiloAdapter({ configDir: join(root, "kilo") }, probesWith([]));
  await opencode.connect(makeProvider(), {});
  await kilo.connect(makeProvider(), {});
  const fromOpencode = await opencode.readProviders();
  const fromKilo = await kilo.readProviders();
  expect(fromOpencode.map((provider) => provider.source)).toEqual(["opencode"]);
  expect(fromKilo.map((provider) => provider.source)).toEqual(["kilo"]);
  expect(fromKilo.map(({ source: _source, ...rest }) => rest)).toEqual(
    fromOpencode.map(({ source: _source, ...rest }) => rest),
  );
});

test("the family factory honours the spec file base, seed, label and binaries", async () => {
  const dir = join(root, "fork");
  const appBundle = join(root, "Fork.app");
  const adapter = createOpencodeFamilyAdapter(customSpec, { configDir: dir, appBundles: [appBundle] }, probesWith([]));
  expect(adapter.label).toBe("Custom Fork");
  expect(adapter.protocols).toEqual(["openai-chat", "anthropic-messages", "openai-responses"]);
  expect(await adapter.detect()).toEqual({ installed: false, configPath: join(dir, "fork.json") });
  await adapter.connect(makeProvider(), {});
  const config = await readJsonc(join(dir, "fork.json"));
  expect(config.seeded).toBe(true);
  expect(Object.keys(config.provider as object)).toEqual(["fuse"]);
  await expect(adapter.connect(makeProvider({ endpoints: [] }), {})).rejects.toThrow("Custom Fork");
  const withBinary = createOpencodeFamilyAdapter(customSpec, { configDir: dir, appBundles: [] }, probesWith(["fork-cli"]));
  expect((await withBinary.detect()).installed).toBe(true);
  const withBundle = createOpencodeFamilyAdapter(
    customSpec,
    { configDir: join(root, "missing"), appBundles: [appBundle] },
    probesWith([], [appBundle]),
  );
  expect((await withBundle.detect()).installed).toBe(true);
});

test("the family factory prefers the jsonc file only when the json file is absent", async () => {
  const dir = join(root, "fork");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "fork.jsonc"), "{}\n");
  const adapter = createOpencodeFamilyAdapter(customSpec, { configDir: dir, appBundles: [] }, probesWith([]));
  expect((await adapter.detect()).configPath).toBe(join(dir, "fork.jsonc"));
  await adapter.connect(makeProvider(), {});
  expect(await Bun.file(join(dir, "fork.json")).exists()).toBe(false);
  expect(Object.keys((await readJsonc(join(dir, "fork.jsonc"))).provider as object)).toEqual(["fuse"]);
});
