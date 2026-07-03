import { expect, test } from "bun:test";
import { slugify, uniqueName } from "../src/features/profiles/naming";
import type { Profile } from "../src/features/profiles/types";

const claude = (name: string): Profile => ({
  type: "claude",
  name,
  keychain: "blob",
  account: null,
  updatedAt: "now",
});

test("slugify lowercases and dashes non-alphanumerics", () => {
  expect(slugify("Open Router")).toBe("open-router");
  expect(slugify("  z.ai/GLM  ")).toBe("z-ai-glm");
});

test("slugify falls back to provider for empty input", () => {
  expect(slugify("!!!")).toBe("provider");
  expect(slugify("")).toBe("provider");
});

test("uniqueName returns base when free", () => {
  expect(uniqueName([], "work")).toBe("work");
  expect(uniqueName([claude("personal")], "work")).toBe("work");
});

test("uniqueName suffixes on collision", () => {
  expect(uniqueName([claude("work")], "work")).toBe("work-2");
  expect(uniqueName([claude("work"), claude("work-2")], "work")).toBe("work-3");
});
