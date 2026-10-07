import { expect, test } from "bun:test";
import { parsePsOutput } from "../src/shared/processes/process-detection";
import type { ProcessInfo } from "../src/shared/processes/types";
import { isClaudeRunning, parsePgrepOutput, parseTasklistOutput } from "../src/features/switch/running-session";

const listerOf =
  (processes: ProcessInfo[]): (() => Promise<ProcessInfo[]>) =>
  async () =>
    processes;

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

test("isClaudeRunning ignores the Claude desktop app on macOS", async () => {
  const processes = parsePsOutput(
    [
      "501 Claude /Applications/Claude.app/Contents/MacOS/Claude",
      "502 Claude Helper /Applications/Claude.app/Contents/Frameworks/Claude Helper.app/Contents/MacOS/Claude Helper",
    ].join("\n"),
  );
  expect(await isClaudeRunning(listerOf(processes), 1)).toBe(false);
});

test("isClaudeRunning ignores processes whose argv merely mentions claude", async () => {
  const processes = parsePsOutput("600 node /usr/local/bin/claude --version\n700 vim /home/me/claude");
  expect(await isClaudeRunning(listerOf(processes), 1)).toBe(false);
});

test("isClaudeRunning detects a claude process by exact name", async () => {
  const processes = parsePsOutput("800 claude claude --resume");
  expect(await isClaudeRunning(listerOf(processes), 1)).toBe(true);
});

test("isClaudeRunning skips its own pid", async () => {
  const processes = parsePsOutput("800 claude claude");
  expect(await isClaudeRunning(listerOf(processes), 800)).toBe(false);
});
