import { expect, test } from "bun:test";
import { parseDocument } from "yaml";
import { setYamlEntry } from "../src/features/harnesses/adapters/yaml-entry";

test("setYamlEntry updates changed keys in place and leaves unchanged nodes and comments alone", () => {
  const document = parseDocument("p:\n  a: 1 # keep a\n  b:\n    c: 2 # keep c\n");
  setYamlEntry(document, ["p"], { a: 3, b: { c: 2 }, d: "new" });
  expect(String(document)).toBe("p:\n  a: 3 # keep a\n  b:\n    c: 2 # keep c\n  d: new\n");
});

test("setYamlEntry replaces a missing or scalar node with the whole entry", () => {
  const missing = parseDocument("other: 1\n");
  setYamlEntry(missing, ["p", "q"], { a: 1 });
  expect(missing.toJS()).toEqual({ other: 1, p: { q: { a: 1 } } });
  const scalar = parseDocument("p: text\n");
  setYamlEntry(scalar, ["p"], { a: 1 });
  expect(scalar.toJS()).toEqual({ p: { a: 1 } });
});
