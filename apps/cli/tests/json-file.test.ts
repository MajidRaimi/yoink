import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigParseError } from "../src/shared/errors";
import { describeJsonSyntaxError, parseJsonText, readJsonFile } from "../src/shared/json-file";

const SECRET = "gsk_SECRETabc123XYZ";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "yoink-json-file-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const parseFailure = (text: string): ConfigParseError => {
  try {
    parseJsonText<unknown>("/tmp/models.json", text);
  } catch (error) {
    if (error instanceof ConfigParseError) return error;
    throw error;
  }
  throw new Error("expected a parse failure");
};

test("parseJsonText never echoes unquoted values from the file", () => {
  const error = parseFailure(`{\n  "apiKey": ${SECRET}\n}`);
  expect(error.message).not.toContain(SECRET);
  expect(error.message).not.toContain("gsk_");
  expect(error.message).toBe("Could not parse /tmp/models.json: JSON syntax error InvalidSymbol at line 2, column 13");
});

test("describeJsonSyntaxError reports position for truncated input", () => {
  expect(describeJsonSyntaxError('{"a": 1')).toBe("JSON syntax error CloseBraceExpected at line 1, column 8");
});

test("describeJsonSyntaxError rejects comments and trailing commas like JSON.parse", () => {
  expect(describeJsonSyntaxError('{"a": 1,}')).toStartWith("JSON syntax error ");
  expect(describeJsonSyntaxError('{"a": 1,}')).toContain("line 1");
  expect(describeJsonSyntaxError("// note\n{}")).toContain("line 1, column 1");
});

test("parseJsonText parses valid JSON", () => {
  expect(parseJsonText<{ a: number }>("/tmp/x.json", '{"a": 1}')).toEqual({ a: 1 });
});

test("readJsonFile returns null for missing or blank files", async () => {
  expect(await readJsonFile(join(root, "missing.json"))).toBeNull();
  await writeFile(join(root, "blank.json"), "  \n");
  expect(await readJsonFile(join(root, "blank.json"))).toBeNull();
});

test("readJsonFile parses an existing file", async () => {
  await writeFile(join(root, "data.json"), '{"ok": true}');
  expect(await readJsonFile<{ ok: boolean }>(join(root, "data.json"))).toEqual({ ok: true });
});
