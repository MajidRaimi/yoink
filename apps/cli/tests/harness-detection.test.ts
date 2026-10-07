import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultProbes, isInstalled, type DetectionProbes } from "../src/features/harnesses/adapters/detection";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "yoink-detection-"));
});

afterEach(async () => {
  await chmod(join(root, "locked"), 0o755).catch(() => undefined);
  await rm(root, { recursive: true, force: true });
});

test("defaultProbes.exists reports present and missing paths", async () => {
  const file = join(root, "config.json");
  await writeFile(file, "{}");
  expect(await defaultProbes.exists(file)).toBe(true);
  expect(await defaultProbes.exists(root)).toBe(true);
  expect(await defaultProbes.exists(join(root, "missing"))).toBe(false);
  expect(await defaultProbes.exists(join(file, "nested"))).toBe(false);
});

test.skipIf(process.getuid?.() === 0)("defaultProbes.exists treats unreadable paths as not installed", async () => {
  const locked = join(root, "locked");
  await mkdir(locked);
  await writeFile(join(locked, "settings.json"), "{}");
  await chmod(locked, 0o000);
  expect(await defaultProbes.exists(join(locked, "settings.json"))).toBe(false);
});

test("isInstalled checks binaries before paths", async () => {
  const probes: DetectionProbes = {
    which: (binary) => (binary === "present" ? `/bin/${binary}` : null),
    exists: async (path) => path === "/found",
  };
  expect(await isInstalled(probes, ["present"], [])).toBe(true);
  expect(await isInstalled(probes, ["absent"], ["/found"])).toBe(true);
  expect(await isInstalled(probes, ["absent"], ["/missing"])).toBe(false);
});
