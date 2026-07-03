import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileBackend } from "../src/shared/credentials/file-backend";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "yoink-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("read returns null when the file is missing", async () => {
  const backend = createFileBackend(join(dir, ".credentials.json"));
  expect(await backend.read()).toBeNull();
});

test("read returns null for empty and whitespace-only files", async () => {
  const path = join(dir, ".credentials.json");
  const backend = createFileBackend(path);
  await writeFile(path, "");
  expect(await backend.read()).toBeNull();
  await writeFile(path, "  \n\t ");
  expect(await backend.read()).toBeNull();
});

test("write then read round-trips the exact blob", async () => {
  const backend = createFileBackend(join(dir, ".credentials.json"));
  const blob = '{"claudeAiOauth":{"accessToken":"abc","refreshToken":"def"}}';
  await backend.write(blob);
  expect(await backend.read()).toBe(blob);
});

test("write creates missing parent directories", async () => {
  const path = join(dir, "nested", "config", ".credentials.json");
  const backend = createFileBackend(path);
  await backend.write("blob");
  expect(await backend.read()).toBe("blob");
});

test("write replaces existing content", async () => {
  const backend = createFileBackend(join(dir, ".credentials.json"));
  await backend.write("first");
  await backend.write("second");
  expect(await backend.read()).toBe("second");
});

test("write sets restrictive file and directory modes on posix", async () => {
  if (process.platform === "win32") return;
  const parent = join(dir, "created");
  const path = join(parent, ".credentials.json");
  const backend = createFileBackend(path);
  await backend.write("blob");
  const fileStat = await stat(path);
  const dirStat = await stat(parent);
  expect(fileStat.mode & 0o777).toBe(0o600);
  expect(dirStat.mode & 0o777).toBe(0o700);
});
