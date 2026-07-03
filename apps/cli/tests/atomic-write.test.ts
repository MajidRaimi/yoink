import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileAtomic } from "../src/shared/atomic-write";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "yoink-atomic-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("writeFileAtomic round-trips content", async () => {
  const path = join(dir, "fresh.json");
  await writeFileAtomic(path, '{"hello":"world"}');
  expect(await Bun.file(path).text()).toBe('{"hello":"world"}');
});

test("writeFileAtomic replaces an existing file", async () => {
  const path = join(dir, "existing.json");
  await Bun.write(path, "old contents");
  await writeFileAtomic(path, "new contents");
  expect(await Bun.file(path).text()).toBe("new contents");
});

test.if(process.platform !== "win32")("writeFileAtomic applies the requested mode", async () => {
  const path = join(dir, "secret.json");
  await writeFileAtomic(path, "token", 0o600);
  const info = await stat(path);
  expect(info.mode & 0o777).toBe(0o600);
});
