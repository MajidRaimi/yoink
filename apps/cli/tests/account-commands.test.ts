import { afterEach, beforeEach, expect, setDefaultTimeout, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProfileStore } from "../src/features/profiles/types";
import { CODEX_SECRET, KIMI_SECRET, mixedStore } from "./support/account-fixture";
import { makeTempDir, removeTempDir } from "./support/provider-fixture";
import { CLI_TEST_TIMEOUT_MS, runCli, type CliResult } from "./support/run-cli";

setDefaultTimeout(CLI_TEST_TIMEOUT_MS);

type Summary = { name: string; type: string; label: string; current: boolean };

let home: string;

const cli = (args: readonly string[]): Promise<CliResult> => runCli(home, args);

const seed = async (store: ProfileStore): Promise<void> => {
  const dir = join(home, ".config", "yoink");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "profiles.json"), JSON.stringify(store), { mode: 0o600 });
};

const expectNoSecrets = (output: string): void => {
  for (const secret of [CODEX_SECRET, KIMI_SECRET, "claude-keychain", "sk-test-fuse"]) {
    expect(output).not.toContain(secret);
  }
};

beforeEach(async () => {
  home = await makeTempDir();
  await seed(mixedStore());
});

afterEach(async () => {
  await removeTempDir(home);
});

test("list --json and accounts --json print the same secret-free summaries", async () => {
  const list = await cli(["list", "--json"]);
  const accounts = await cli(["accounts", "--json"]);
  expect(list.exitCode).toBe(0);
  expect(accounts.stdout).toBe(list.stdout);
  expectNoSecrets(list.stdout);
  const summaries = JSON.parse(list.stdout) as Summary[];
  expect(summaries.map((summary) => summary.name)).toEqual(["work", "home", "fuse", "cx-work", "cx-personal", "kimi-main"]);
  expect(summaries.find((summary) => summary.name === "cx-personal")).toEqual({
    name: "cx-personal",
    type: "codex",
    label: "me@example.com · plus",
    current: true,
  });
});

test("list groups profiles under tool headings", async () => {
  const result = await cli(["list"]);
  expect(result.exitCode).toBe(0);
  const lines = result.stdout.split("\n");
  for (const heading of ["Claude Code", "Providers", "ChatGPT (Codex)", "Kimi Code"]) expect(lines).toContain(heading);
  expect(lines.indexOf("Kimi Code")).toBeLessThan(lines.findIndex((line) => line.includes("kimi-main")));
  expectNoSecrets(result.stdout);
});

test("current shows every active profile and filters by --tool", async () => {
  const all = await cli(["current"]);
  expect(all.stdout).toContain("work");
  expect(all.stdout).toContain("cx-personal");

  const codex = await cli(["current", "--tool", "codex", "--json"]);
  expect(JSON.parse(codex.stdout)).toEqual([
    { name: "cx-personal", type: "codex", label: "me@example.com · plus", current: true },
  ]);

  const gemini = await cli(["current", "--tool", "gemini"]);
  expect(gemini.exitCode).toBe(0);
  expect(gemini.stdout).toContain("No active Gemini login tracked");
});

test("bad flags fail with a clear message", async () => {
  const save = await cli(["save", "x", "--tool", "cursor"]);
  expect(save.exitCode).toBe(1);
  expect(save.stderr).toContain('Unknown tool "cursor"');

  const use = await cli(["use", "cx-work", "--yes"]);
  expect(use.exitCode).toBe(1);
  expect(use.stderr).toContain('Unknown flag "--yes"');

  const missing = await cli(["use", "ghost"]);
  expect(missing.exitCode).toBe(1);
  expect(missing.stderr).toContain('No profile named "ghost"');
});

test("an empty store prints the empty hint and an empty JSON array", async () => {
  await seed({ schemaVersion: 2, current: null, profiles: {} });
  expect((await cli(["list"])).stdout).toContain("No profiles yet");
  expect(JSON.parse((await cli(["list", "--json"])).stdout)).toEqual([]);
});
