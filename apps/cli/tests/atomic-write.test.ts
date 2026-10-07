import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmod, lstat, mkdir, mkdtemp, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileAtomic, writeSecretFileAtomic } from "../src/shared/atomic-write";
import { expectMode, isPosix } from "./support/posix";

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

test.if(isPosix)("writeFileAtomic applies the requested mode", async () => {
  const path = join(dir, "secret.json");
  await writeFileAtomic(path, "token", 0o600);
  await expectMode(path, 0o600);
});

test.if(isPosix)("writeFileAtomic keeps the existing mode when none is given", async () => {
  const path = join(dir, "shared.json");
  await Bun.write(path, "old");
  await chmod(path, 0o640);
  await writeFileAtomic(path, "new");
  await expectMode(path, 0o640);
});

test.if(isPosix)("writeFileAtomic writes through a symlink and keeps the link", async () => {
  const real = join(dir, "real.json");
  const link = join(dir, "link.json");
  await Bun.write(real, "old");
  await symlink(real, link);
  await writeFileAtomic(link, "new");
  expect((await lstat(link)).isSymbolicLink()).toBe(true);
  expect(await Bun.file(real).text()).toBe("new");
});

test.if(isPosix)("writeSecretFileAtomic creates new files as 0600", async () => {
  const path = join(dir, "secret-new.json");
  await writeSecretFileAtomic(path, "token");
  await expectMode(path, 0o600);
});

test.if(isPosix)("writeSecretFileAtomic strips group and other bits from existing files", async () => {
  const path = join(dir, "settings.json");
  await Bun.write(path, "{}");
  await chmod(path, 0o644);
  await writeSecretFileAtomic(path, "token");
  await expectMode(path, 0o600);
});

test.if(isPosix)("writeFileAtomic writes through a dangling relative symlink and keeps the link", async () => {
  const link = join(dir, "opencode.json");
  const real = join(dir, "dots", "opencode.json");
  await symlink(join("dots", "opencode.json"), link);
  await writeFileAtomic(link, "new");
  expect((await lstat(link)).isSymbolicLink()).toBe(true);
  expect(await Bun.file(real).text()).toBe("new");
  expect(await Bun.file(link).text()).toBe("new");
});

test.if(isPosix)("writeFileAtomic follows a chain of dangling symlinks to the final target", async () => {
  const first = join(dir, "first.json");
  const second = join(dir, "second.json");
  const real = join(dir, "nested", "deeper", "real.json");
  await symlink(second, first);
  await symlink(real, second);
  await writeFileAtomic(first, "chained");
  expect((await lstat(first)).isSymbolicLink()).toBe(true);
  expect((await lstat(second)).isSymbolicLink()).toBe(true);
  expect(await Bun.file(real).text()).toBe("chained");
});

test.if(isPosix)("writeSecretFileAtomic writes a dangling symlink target as 0600 and keeps the link", async () => {
  await mkdir(join(dir, "dots"));
  const link = join(dir, "settings.json");
  const real = join(dir, "dots", "settings.json");
  await symlink(real, link);
  await writeSecretFileAtomic(link, "token");
  expect((await lstat(link)).isSymbolicLink()).toBe(true);
  await expectMode(real, 0o600);
  expect(await readdir(join(dir, "dots"))).toEqual(["settings.json"]);
});

test.if(isPosix)("writeFileAtomic rejects a symlink loop without replacing the link", async () => {
  const a = join(dir, "a.json");
  const b = join(dir, "b.json");
  await symlink(b, a);
  await symlink(a, b);
  await expect(writeFileAtomic(a, "loop")).rejects.toMatchObject({ code: "ELOOP" });
  expect((await lstat(a)).isSymbolicLink()).toBe(true);
});
