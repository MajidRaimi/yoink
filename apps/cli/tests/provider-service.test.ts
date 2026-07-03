import { expect, test } from "bun:test";
import { normalizeBaseUrl } from "../src/features/provider/service";

test("normalizeBaseUrl trims whitespace and trailing slashes", () => {
  expect(normalizeBaseUrl("https://openrouter.ai/api/")).toBe("https://openrouter.ai/api");
  expect(normalizeBaseUrl("  https://openrouter.ai/api///  ")).toBe("https://openrouter.ai/api");
  expect(normalizeBaseUrl("https://openrouter.ai/api")).toBe("https://openrouter.ai/api");
});
