import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeTempDir, readText, removeTempDir } from "./support/provider-fixture";
import { runCli, type CliResult } from "./support/run-cli";

type StoredProfile = { name: string; model?: string; connections?: Record<string, unknown> };

type StoredStore = { current: string | null; importOffered?: boolean; profiles: Record<string, StoredProfile> };

type PiModels = { providers: Record<string, unknown> };

let home: string;

const cli = (args: readonly string[], stdin?: string): Promise<CliResult> => runCli(home, args, stdin);

const piDir = (): string => join(home, ".pi", "agent");

const piModelsPath = (): string => join(piDir(), "models.json");

const readPiModels = async (): Promise<PiModels> => JSON.parse(await readText(piModelsPath())) as PiModels;

const readStore = async (): Promise<StoredStore> =>
  JSON.parse(await readText(join(home, ".config", "yoink", "profiles.json"))) as StoredStore;

const addPiProvider = async (name: string): Promise<void> => {
  const result = await cli(
    [
      "add",
      "--name",
      name,
      "--base-url",
      "https://example.invalid",
      "--protocol",
      "anthropic-messages,openai-chat",
      "--models",
      "m1",
      "--connect",
      "pi",
      "--token-stdin",
    ],
    "FAKEKEY",
  );
  expect(result.exitCode).toBe(0);
};

const piEntry = (name: string, token: string) => ({
  name,
  baseUrl: `https://${name}.invalid/v1`,
  api: "openai-completions",
  apiKey: token,
  models: [{ id: "m1", name: "m1" }],
});

beforeEach(async () => {
  home = await makeTempDir();
});

afterEach(async () => {
  await chmod(piDir(), 0o755).catch(() => undefined);
  await removeTempDir(home);
});

test("add keeps a probed /v1 endpoint when the base url has none", async () => {
  const result = await cli(
    [
      "add",
      "--name",
      "router",
      "--base-url",
      "https://openrouter.invalid/api",
      "--endpoint",
      "openai-chat=https://openrouter.invalid/api/v1",
      "--models",
      "m1",
      "--connect",
      "pi",
      "--token-stdin",
    ],
    "FAKEKEY",
  );

  expect(result.exitCode).toBe(0);
  const stored = JSON.parse(await readText(join(home, ".config", "yoink", "profiles.json"))) as {
    profiles: Record<string, { endpoints?: { protocol: string; baseUrl: string }[] }>;
  };
  expect(stored.profiles.router?.endpoints).toEqual([
    { protocol: "openai-chat", baseUrl: "https://openrouter.invalid/api/v1" },
  ]);
  const piProvider = (await readPiModels()).providers.router as { baseUrl?: string } | undefined;
  expect(piProvider?.baseUrl).toBe("https://openrouter.invalid/api/v1");
});

test("disconnect drops a recorded pi connection whose entry was deleted by hand", async () => {
  await addPiProvider("fuse");
  await writeFile(piModelsPath(), JSON.stringify({ providers: {} }));

  const result = await cli(["disconnect", "fuse"]);

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("Disconnected from pi");
  expect((await readStore()).profiles.fuse?.connections).not.toHaveProperty("pi");

  expect((await cli(["models", "fuse", "--set", "m1,m2"])).exitCode).toBe(0);
  expect(Object.keys((await readPiModels()).providers)).toEqual([]);
});

test("import --yes imports every candidate and reports failed syncs once at the end", async () => {
  await mkdir(piDir(), { recursive: true });
  await writeFile(
    piModelsPath(),
    JSON.stringify({ providers: { alpha: piEntry("alpha", "sk-alpha"), beta: piEntry("beta", "sk-beta") } }),
  );
  await chmod(piDir(), 0o555);

  const result = await cli(["import", "--yes"]);

  expect(result.exitCode).not.toBe(0);
  expect(result.stdout).toContain("Imported alpha");
  expect(result.stdout).toContain("Imported beta");
  expect(result.stderr).toContain("2 harness update(s) failed.");
  const store = await readStore();
  expect(Object.keys(store.profiles).sort()).toEqual(["alpha", "beta"]);
  expect(store.importOffered).toBe(true);
});

test("edit --model keeps the chosen model and re-syncs pi", async () => {
  await addPiProvider("fuse");

  const result = await cli(["edit", "fuse", "--model", "m2"]);

  expect(result.exitCode).toBe(0);
  expect((await readStore()).profiles.fuse?.model).toBe("m2");
  expect(JSON.stringify((await readPiModels()).providers.fuse)).toContain('"m2"');
});
