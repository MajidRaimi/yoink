import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isMissingFileError, parseJsonOrNull, pathExists, readOptionalText } from "../src/shared/fs-errors";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "yoink-fs-errors-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

test("isMissingFileError recognizes ENOENT and ENOTDIR only", () => {
  const withCode = (code: string): Error => Object.assign(new Error(code), { code });
  expect(isMissingFileError(withCode("ENOENT"))).toBe(true);
  expect(isMissingFileError(withCode("ENOTDIR"))).toBe(true);
  expect(isMissingFileError(withCode("EACCES"))).toBe(false);
  expect(isMissingFileError("ENOENT")).toBe(false);
});

test("readOptionalText returns null for missing paths and the text otherwise", async () => {
  const file = join(root, "a.txt");
  expect(await readOptionalText(file)).toBeNull();
  expect(await readOptionalText(join(file, "nested"))).toBeNull();
  await writeFile(file, "hello");
  expect(await readOptionalText(file)).toBe("hello");
});

test("pathExists checks the requested kind", async () => {
  const file = join(root, "a.txt");
  const directory = join(root, "dir");
  await writeFile(file, "x");
  await mkdir(directory);
  expect(await pathExists(file)).toBe(true);
  expect(await pathExists(file, "file")).toBe(true);
  expect(await pathExists(file, "directory")).toBe(false);
  expect(await pathExists(directory, "directory")).toBe(true);
  expect(await pathExists(join(root, "missing"))).toBe(false);
});

test("parseJsonOrNull is lenient", () => {
  expect(parseJsonOrNull('{"a":1}')).toEqual({ a: 1 });
  expect(parseJsonOrNull("not json")).toBeNull();
  expect(parseJsonOrNull(undefined)).toBeNull();
});
