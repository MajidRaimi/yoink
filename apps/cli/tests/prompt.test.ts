import { expect, test } from "bun:test";
import { normalizePromptValue } from "../src/shared/prompt";

test("normalizePromptValue turns an empty submit into an empty string", () => {
  expect(normalizePromptValue(undefined)).toBe("");
  expect(normalizePromptValue("")).toBe("");
  expect(normalizePromptValue("   ")).toBe("");
});

test("normalizePromptValue trims real input", () => {
  expect(normalizePromptValue("  claude-opus-4  ")).toBe("claude-opus-4");
  expect(normalizePromptValue("opus")).toBe("opus");
});
