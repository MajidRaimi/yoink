import { expect, test } from "bun:test";
import { buildClaudeLoginCommand } from "../src/features/login/service";

test("buildClaudeLoginCommand wraps in cmd /c on Windows", () => {
  expect(buildClaudeLoginCommand("win32")).toEqual([
    "cmd",
    "/c",
    "claude",
    "auth",
    "login",
    "--claudeai",
  ]);
});

test("buildClaudeLoginCommand runs claude directly elsewhere", () => {
  expect(buildClaudeLoginCommand("darwin")).toEqual(["claude", "auth", "login", "--claudeai"]);
  expect(buildClaudeLoginCommand("linux")).toEqual(["claude", "auth", "login", "--claudeai"]);
});
