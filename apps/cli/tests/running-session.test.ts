import { expect, test } from "bun:test";
import { parsePgrepOutput, parseTasklistOutput } from "../src/features/switch/running-session";

test("parsePgrepOutput returns false for empty output", () => {
  expect(parsePgrepOutput("", 1234)).toBe(false);
  expect(parsePgrepOutput("\n\n", 1234)).toBe(false);
});

test("parsePgrepOutput returns false when only own pid is listed", () => {
  expect(parsePgrepOutput("1234\n", 1234)).toBe(false);
});

test("parsePgrepOutput returns true for a foreign pid", () => {
  expect(parsePgrepOutput("5678\n", 1234)).toBe(true);
});

test("parsePgrepOutput returns true when own and foreign pids are mixed", () => {
  expect(parsePgrepOutput("1234\n5678\n", 1234)).toBe(true);
});

test("parseTasklistOutput returns false for the no-tasks INFO message", () => {
  expect(parseTasklistOutput("INFO: No tasks are running which match the specified criteria.\n")).toBe(false);
});

test("parseTasklistOutput returns true for a matching CSV row", () => {
  expect(parseTasklistOutput('"claude.exe","4242","Console","1","50,000 K"\n')).toBe(true);
});

test("parseTasklistOutput matches case-insensitively", () => {
  expect(parseTasklistOutput('"Claude.EXE","4242","Console","1","50,000 K"\n')).toBe(true);
});

test("parseTasklistOutput returns false for a non-matching image", () => {
  expect(parseTasklistOutput('"node.exe","4242","Console","1","50,000 K"\n')).toBe(false);
});

test("parseTasklistOutput returns false for empty output", () => {
  expect(parseTasklistOutput("")).toBe(false);
});
