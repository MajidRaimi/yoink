import { afterEach, beforeEach, expect, setDefaultTimeout, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { makeTempDir, readText, removeTempDir } from "./support/provider-fixture";
import { CLI_TEST_TIMEOUT_MS, runCli as runCliIn, type CliResult } from "./support/run-cli";

setDefaultTimeout(CLI_TEST_TIMEOUT_MS);

type StoredProfile = {
  name: string;
  provider?: string;
  connections?: Record<string, unknown>;
  endpoints?: { protocol: string; baseUrl: string }[];
  models?: { id: string }[];
};

type StoredStore = { current: string | null; profiles: Record<string, StoredProfile> };

let home: string;

const runCli = (args: readonly string[], stdin?: string): Promise<CliResult> => runCliIn(home, args, stdin);

const piModelsPath = (): string => join(home, ".pi", "agent", "models.json");

const claudeSettingsPath = (): string => join(home, ".claude", "settings.json");

const readStore = async (): Promise<StoredStore> =>
  JSON.parse(await readText(join(home, ".config", "yoink", "profiles.json"))) as StoredStore;

const addPiProvider = async (name: string): Promise<void> => {
  const result = await runCli(
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
  expect(await readText(piModelsPath())).toContain(name);
};

const addLegacyExternal = (name: string): Promise<CliResult> =>
  runCli(
    ["add", "--external", "--name", name, "--provider", "Fuse", "--base-url", "https://example.invalid", "--model", "m1", "--token-stdin"],
    "FAKEKEY",
  );

beforeEach(async () => {
  home = await makeTempDir();
});

afterEach(async () => {
  await removeTempDir(home);
});

test("remove disconnects a provider from pi and Claude Code before deleting it", async () => {
  await addPiProvider("demo");
  expect((await runCli(["use", "demo"])).exitCode).toBe(0);
  expect(await readText(claudeSettingsPath())).toContain("ANTHROPIC_AUTH_TOKEN");

  const result = await runCli(["remove", "demo"]);

  expect(result.exitCode).toBe(0);
  expect(await readText(piModelsPath())).not.toContain("demo");
  expect(await readText(piModelsPath())).not.toContain("FAKEKEY");
  expect(await readText(claudeSettingsPath())).not.toContain("ANTHROPIC_AUTH_TOKEN");
  const store = await readStore();
  expect(store.profiles.demo).toBeUndefined();
  expect(store.current).toBeNull();
});

test("remove keeps the provider when a harness cannot be disconnected", async () => {
  await addPiProvider("demo");
  await writeFile(piModelsPath(), "{ not json");

  const result = await runCli(["remove", "demo"]);

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain('Kept "demo"');
  expect((await readStore()).profiles.demo?.connections).toHaveProperty("pi");
});

test("remove still deletes Claude account profiles", async () => {
  await mkdir(join(home, ".config", "yoink"), { recursive: true });
  await writeFile(
    join(home, ".config", "yoink", "profiles.json"),
    JSON.stringify({
      current: null,
      profiles: { work: { type: "claude", name: "work", keychain: "{}", account: null, updatedAt: "2026-01-01T00:00:00.000Z" } },
    }),
  );

  const result = await runCli(["remove", "work"]);

  expect(result.exitCode).toBe(0);
  expect((await readStore()).profiles.work).toBeUndefined();
  expect(existsSync(piModelsPath())).toBe(false);
});

test("rename moves a connected provider's pi entry to the new id", async () => {
  await addPiProvider("fuse2");

  const result = await runCli(["rename", "fuse2", "fuse3"]);

  expect(result.exitCode).toBe(0);
  const models = JSON.parse(await readText(piModelsPath())) as { providers: Record<string, unknown> };
  expect(Object.keys(models.providers)).toEqual(["fuse3"]);
});

test("rename rejects an id harness configs cannot use", async () => {
  await addPiProvider("fuse");

  const result = await runCli(["rename", "fuse", "My Fuse"]);

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain("Invalid provider name");
  expect((await readStore()).profiles.fuse).toBeDefined();
});

test("add --external rejects an invalid provider id", async () => {
  const result = await addLegacyExternal("My Fuse");

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain("Invalid provider name");
  expect(existsSync(join(home, ".config", "yoink", "profiles.json"))).toBe(false);
});

test("add --external stores a provider profile with endpoints and models", async () => {
  const result = await addLegacyExternal("fuse");

  expect(result.exitCode).toBe(0);
  const stored = (await readStore()).profiles.fuse;
  expect(stored?.provider).toBe("Fuse");
  expect(stored?.endpoints).toEqual([{ protocol: "anthropic-messages", baseUrl: "https://example.invalid" }]);
  expect(stored?.models?.map((model) => model.id)).toEqual(["m1"]);
  expect(stored?.connections).toEqual({});
});

test("add --external rejects a duplicate provider id", async () => {
  expect((await addLegacyExternal("fuse")).exitCode).toBe(0);

  const result = await addLegacyExternal("fuse");

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain('A profile named "fuse" already exists');
});

test("edit --name rejects an invalid provider id and leaves harnesses untouched", async () => {
  await addPiProvider("fuse");

  const result = await runCli(["edit", "fuse", "--name", "My Fuse"]);

  expect(result.exitCode).not.toBe(0);
  expect(result.stderr).toContain("Invalid provider name");
  expect(await readText(piModelsPath())).not.toContain("My Fuse");
  expect((await readStore()).profiles.fuse).toBeDefined();
});

test("edit --name accepts a valid id and renames the pi entry", async () => {
  await addPiProvider("fuse");

  const result = await runCli(["edit", "fuse", "--name", "fuse-two"]);

  expect(result.exitCode).toBe(0);
  const models = JSON.parse(await readText(piModelsPath())) as { providers: Record<string, unknown> };
  expect(Object.keys(models.providers)).toEqual(["fuse-two"]);
});

test("the shared runner spawns the CLI against the scratch home", async () => {
  const result = await runCli(["--help"]);

  expect(result.exitCode).toBe(0);
  expect(result.stdout.length).toBeGreaterThan(0);
  expect(existsSync(join(home, ".config", "yoink", "profiles.json"))).toBe(false);
});
