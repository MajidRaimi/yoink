import { expect, test } from "bun:test";
import { parseJsoncObject } from "../src/features/harnesses/adapters/jsonc-document";
import { ConfigParseError, YoinkError } from "../src/shared/errors";

const path = "/scratch/opencode.json";

test.each(["", "   \n\t", "// only a comment\n", "/* block */\n// line\n"])(
  "a document without a value parses as an empty object: %p",
  (text) => {
    expect(parseJsoncObject(path, text)).toEqual({});
  },
);

test("an unterminated comment still raises a parse error", () => {
  expect(() => parseJsoncObject(path, "/* never closed")).toThrow(ConfigParseError);
});

test("malformed jsonc raises a parse error", () => {
  expect(() => parseJsoncObject(path, '{ "a": ')).toThrow(ConfigParseError);
});

test("a non-object value is rejected", () => {
  expect(() => parseJsoncObject(path, "[1, 2]")).toThrow(YoinkError);
});

test("comments and trailing commas are accepted", () => {
  expect(parseJsoncObject(path, '{\n  // note\n  "a": 1,\n}\n')).toEqual({ a: 1 });
});
