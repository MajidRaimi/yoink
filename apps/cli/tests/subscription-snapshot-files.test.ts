import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertDeclaredPath,
  listSnapshotFiles,
  readSnapshotFiles,
  restoreSnapshotFiles,
} from "../src/features/subscriptions/shared/snapshot-files";
import { YoinkError } from "../src/shared/errors";
import { expectMode, isPosix } from "./support/posix";

const PATTERNS = ["auth.json", "credentials/*.json"];

let home: string;

beforeEach(async () => {
  home = await mkdtemp(join(tmpdir(), "yoink-snapshot-"));
});

afterEach(async () => {
  await rm(home, { recursive: true, force: true });
});

const writeHome = async (relativePath: string, contents: string): Promise<void> => {
  await Bun.write(join(home, relativePath), contents);
};

test("readSnapshotFiles captures only declared files", async () => {
  await writeHome("auth.json", "A");
  await writeHome("credentials/one.json", "1");
  await writeHome("credentials/notes.txt", "skip");
  await writeHome("config.toml", "skip");
  expect(await readSnapshotFiles(home, PATTERNS)).toEqual({ "auth.json": "A", "credentials/one.json": "1" });
});

test("readSnapshotFiles returns an empty snapshot for a missing home", async () => {
  expect(await readSnapshotFiles(join(home, "absent"), PATTERNS)).toEqual({});
  expect(await listSnapshotFiles(join(home, "absent"), PATTERNS)).toEqual([]);
});

test("restoreSnapshotFiles writes 0600 files in 0700 directories and removes stale declared files", async () => {
  await writeHome("credentials/old.json", "old");
  await writeHome("credentials/keep.txt", "keep");
  await writeHome("other.json", "other");
  const target = join(home, "fresh");
  await restoreSnapshotFiles(target, { "auth.json": "A", "credentials/new.json": "N" }, PATTERNS);
  await restoreSnapshotFiles(home, { "auth.json": "A", "credentials/new.json": "N" }, PATTERNS);
  expect(await readSnapshotFiles(home, PATTERNS)).toEqual({ "auth.json": "A", "credentials/new.json": "N" });
  expect(await Bun.file(join(home, "credentials/keep.txt")).text()).toBe("keep");
  expect(await Bun.file(join(home, "other.json")).text()).toBe("other");
  await expectMode(join(target, "credentials/new.json"), 0o600);
  await expectMode(join(target, "credentials"), 0o700);
});

test("restoreSnapshotFiles with an empty snapshot clears the declared files only", async () => {
  await writeHome("auth.json", "A");
  await writeHome("config.toml", "C");
  await restoreSnapshotFiles(home, {}, PATTERNS);
  expect(await Bun.file(join(home, "auth.json")).exists()).toBe(false);
  expect(await Bun.file(join(home, "config.toml")).text()).toBe("C");
});

test("restoreSnapshotFiles refuses paths outside the declared set before writing anything", async () => {
  await expect(restoreSnapshotFiles(home, { "auth.json": "A", "../escape.json": "x" }, PATTERNS)).rejects.toBeInstanceOf(YoinkError);
  await expect(restoreSnapshotFiles(home, { "config.toml": "x" }, PATTERNS)).rejects.toBeInstanceOf(YoinkError);
  expect(await Bun.file(join(home, "auth.json")).exists()).toBe(false);
  expect(() => assertDeclaredPath("/abs/auth.json", PATTERNS)).toThrow(YoinkError);
  expect(() => assertDeclaredPath("credentials/../auth.json", PATTERNS)).toThrow(YoinkError);
  expect(() => assertDeclaredPath("credentials/a.json", PATTERNS)).not.toThrow();
});

test("restoreSnapshotFiles keeps a symlinked file a symlink", async () => {
  if (!isPosix) return;
  const dotfiles = join(home, "dotfiles");
  await mkdir(dotfiles);
  await Bun.write(join(dotfiles, "auth.json"), "old");
  const codexHome = join(home, "codex");
  await mkdir(codexHome);
  await symlink(join(dotfiles, "auth.json"), join(codexHome, "auth.json"));
  expect(await readSnapshotFiles(codexHome, PATTERNS)).toEqual({ "auth.json": "old" });
  await restoreSnapshotFiles(codexHome, { "auth.json": "new" }, PATTERNS);
  expect(await Bun.file(join(dotfiles, "auth.json")).text()).toBe("new");
});
