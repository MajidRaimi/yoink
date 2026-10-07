import { expect, test } from "bun:test";
import {
  parseAccountTool,
  parseCurrentArgs,
  parseListArgs,
  parseSaveArgs,
  parseUseArgs,
  type AccountTool,
} from "../src/cli/account-flags";
import { YoinkError } from "../src/shared/errors";

test("save defaults to Claude and accepts --tool", () => {
  expect(parseSaveArgs(["work"])).toEqual({ name: "work", tool: "claude" });
  expect(parseSaveArgs(["cx", "--tool", "codex"])).toEqual({ name: "cx", tool: "codex" });
  expect(parseSaveArgs(["cx", "--tool", "Gemini"])).toEqual({ name: "cx", tool: "gemini" });
});

test("save rejects a missing name, an unknown tool and a missing tool value", () => {
  expect(() => parseSaveArgs([])).toThrow(YoinkError);
  expect(() => parseSaveArgs(["--tool", "codex"])).toThrow(YoinkError);
  expect(() => parseSaveArgs(["cx", "--tool", "cursor"])).toThrow(/Unknown tool "cursor"/);
  expect(() => parseSaveArgs(["cx", "--tool"])).toThrow(/needs a value/);
});

test("use parses --force and rejects unknown flags", () => {
  expect(parseUseArgs(["cx"])).toEqual({ name: "cx", force: false });
  expect(parseUseArgs(["cx", "--force"])).toEqual({ name: "cx", force: true });
  expect(() => parseUseArgs(["cx", "--yes"])).toThrow(/Unknown flag/);
});

test("list and current parse --json and --tool", () => {
  expect(parseListArgs([])).toEqual({ json: false });
  expect(parseListArgs(["--json"])).toEqual({ json: true });
  expect(parseCurrentArgs([])).toEqual({ tool: undefined, json: false });
  expect(parseCurrentArgs(["--tool", "kimi", "--json"])).toEqual({ tool: "kimi", json: true });
  expect(() => parseCurrentArgs(["--tool", "external"])).toThrow(YoinkError);
});

test("every subscription tool and claude are valid tool names", () => {
  const tools: readonly AccountTool[] = ["claude", "codex", "kimi", "gemini", "copilot"];
  for (const tool of tools) expect(parseAccountTool(tool)).toBe(tool);
});
