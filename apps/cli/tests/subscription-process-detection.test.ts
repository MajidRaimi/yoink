import { expect, test } from "bun:test";
import {
  isProcessRunning,
  matchesProcess,
  parseProcCmdline,
  parsePsOutput,
  parseTasklistProcesses,
} from "../src/shared/processes/process-detection";
import type { ProcessInfo } from "../src/shared/processes/types";

const proc = (pid: number, name: string, argv: string[] = []): ProcessInfo => ({ pid, name, argv });

test("matchesProcess matches by process name, argv[0] basename and Windows exe names", () => {
  expect(matchesProcess({ names: ["codex"] }, proc(1, "codex"))).toBe(true);
  expect(matchesProcess({ names: ["codex"] }, proc(1, "MainThread", ["/opt/bin/codex", "exec"]))).toBe(true);
  expect(matchesProcess({ names: ["codex"] }, proc(1, "Codex.EXE"))).toBe(true);
  expect(matchesProcess({ names: ["codex"] }, proc(1, "codex-helper"))).toBe(false);
  expect(matchesProcess({ names: ["codex"] }, proc(1, "node", ["node", "/x/codex.js"]))).toBe(false);
});

test("matchesProcess matches npm-installed CLIs whose script path is argv[1] of an interpreter", () => {
  const gemini = { names: ["gemini"], argvContains: ["@google/gemini-cli"] };
  const copilot = { names: ["copilot"] };
  expect(matchesProcess(gemini, proc(1, "MainThread", ["node", "/usr/local/bin/gemini"]))).toBe(true);
  expect(matchesProcess(copilot, proc(1, "MainThread", ["node", "/usr/local/bin/copilot"]))).toBe(true);
  expect(matchesProcess(copilot, proc(1, "node", ["/usr/bin/node", "--no-warnings", "/usr/local/bin/copilot"]))).toBe(true);
  expect(matchesProcess(gemini, proc(1, "bun", ["bun", "/home/u/.bun/bin/gemini"]))).toBe(true);
  expect(matchesProcess(gemini, proc(1, "nvim", ["nvim", "/usr/local/bin/gemini"]))).toBe(false);
});

test("matchesProcess matches argvContains as a path segment of the interpreter script", () => {
  const gemini = { names: [], argvContains: ["@google/gemini-cli"] };
  const codex = { names: [], argvContains: ["@openai/codex"] };
  expect(matchesProcess(gemini, proc(1, "node", ["node", "/usr/lib/node_modules/@google/gemini-cli/dist/index.js"]))).toBe(true);
  expect(matchesProcess(gemini, proc(1, "node", ["node", "--max-old-space-size=8192", "C:\\npm\\node_modules\\@google\\gemini-cli\\dist\\index.js"]))).toBe(true);
  expect(matchesProcess(codex, proc(1, "node", ["node", "/usr/lib/node_modules/@openai/codex/bin/codex.js"]))).toBe(true);
  expect(matchesProcess(gemini, proc(1, "node", ["node", "server.js"]))).toBe(false);
  expect(matchesProcess(gemini, proc(1, "node", ["node", "/srv/@google/gemini-cli-fork/index.js"]))).toBe(false);
});

test("matchesProcess ignores editors and dev tools that merely reference matching paths", () => {
  const gemini = { names: ["gemini"], argvContains: ["@google/gemini-cli"] };
  const codex = { names: ["codex"], argvContains: ["@openai/codex"] };
  expect(matchesProcess(gemini, proc(1, "nvim", ["nvim", "/home/u/src/gemini-cli/README.md"]))).toBe(false);
  expect(matchesProcess(gemini, proc(1, "nvim", ["nvim", "/home/u/node_modules/@google/gemini-cli/README.md"]))).toBe(false);
  expect(matchesProcess(codex, proc(1, "code", ["code", "/home/u/node_modules/@openai/codex/README.md"]))).toBe(false);
  expect(matchesProcess(gemini, proc(1, "bun", ["bun", "run", "dev", "/home/u/node_modules/@google/gemini-cli"]))).toBe(false);
  expect(
    matchesProcess(codex, proc(1, "node", ["node", "/home/u/node_modules/typescript/lib/tsserver.js", "/home/u/node_modules/@openai/codex/x.ts"])),
  ).toBe(false);
});

test("isProcessRunning ignores its own pid and swallows lister errors", async () => {
  const matcher = { names: ["kimi"] };
  expect(await isProcessRunning(matcher, async () => [proc(10, "kimi")], 10)).toBe(false);
  expect(await isProcessRunning(matcher, async () => [proc(10, "kimi"), proc(11, "kimi")], 10)).toBe(true);
  expect(await isProcessRunning(matcher, async () => { throw new Error("ps missing"); }, 10)).toBe(false);
});

test("parsePsOutput reads pid, name and argv", () => {
  expect(parsePsOutput("  12 codex  /usr/local/bin/codex --yolo\n 13 launchd\n\n")).toEqual([
    proc(12, "codex", ["/usr/local/bin/codex", "--yolo"]),
    proc(13, "launchd", []),
  ]);
});

test("parseProcCmdline splits NUL-separated arguments", () => {
  expect(parseProcCmdline("node\0/x/gemini-cli/index.js\0")).toEqual(["node", "/x/gemini-cli/index.js"]);
});

test("parseTasklistProcesses reads CSV rows and ignores the no-tasks message", () => {
  expect(parseTasklistProcesses('"copilot.exe","4242","Console","1","50,000 K"\nINFO: No tasks\n')).toEqual([
    proc(4242, "copilot.exe"),
  ]);
});
