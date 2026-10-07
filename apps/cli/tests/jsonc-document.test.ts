import { afterEach, beforeEach, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadJsoncDocument, seedJsoncText } from "../src/features/harnesses/adapters/jsonc-document";
import { makeTempDir, removeTempDir } from "./support/provider-fixture";

let root: string;

beforeEach(async () => {
  root = await makeTempDir();
});

afterEach(async () => {
  await removeTempDir(root);
});

test("loadJsoncDocument returns null for a missing file", async () => {
  expect(await loadJsoncDocument(join(root, "missing.json"))).toBeNull();
});

test("loadJsoncDocument keeps the path, raw text and parsed object", async () => {
  const path = join(root, "settings.json");
  const text = '{\n  // note\n  "a": 1,\n}\n';
  await writeFile(path, text);
  expect(await loadJsoncDocument(path)).toEqual({ path, text, config: { a: 1 } });
});

test("loadJsoncDocument treats a whitespace-only file as an empty object", async () => {
  const path = join(root, "blank.json");
  await writeFile(path, "  \n");
  expect(await loadJsoncDocument(path)).toEqual({ path, text: "  \n", config: {} });
});

test("seedJsoncText falls back for missing or blank documents and keeps real text", () => {
  expect(seedJsoncText(null)).toBe("{}\n");
  expect(seedJsoncText(null, '{ "$schema": "x" }\n')).toBe('{ "$schema": "x" }\n');
  expect(seedJsoncText({ path: "p", text: " \n", config: {} })).toBe("{}\n");
  expect(seedJsoncText({ path: "p", text: '{"a":1}', config: { a: 1 } })).toBe('{"a":1}');
});
