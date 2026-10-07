import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFileBackend } from "../src/shared/credentials/file-backend";
import { expectMode, isPosix } from "./support/posix";

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

test.if(isPosix)("write sets restrictive file and directory modes on posix", async () => {
  const parent = join(dir, "created");
  const path = join(parent, ".credentials.json");
  const backend = createFileBackend(path);
  await backend.write("blob");
  await expectMode(path, 0o600);
  await expectMode(parent, 0o700);
});
