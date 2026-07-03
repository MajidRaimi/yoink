import { expect, test } from "bun:test";
import { findClaudeProfileByEmail, hasProfileForEmail } from "../src/features/profiles/lookup";
import type { Profile } from "../src/features/profiles/types";

const claude = (name: string, email: string): Profile => ({
  type: "claude",
  name,
  keychain: "blob",
  account: { emailAddress: email },
  updatedAt: "now",
});

const external: Profile = {
  type: "external",
  name: "glm",
  provider: "OpenRouter",
  baseUrl: "https://openrouter.ai/api",
  token: "sk",
  model: "z-ai/glm",
  updatedAt: "now",
};

const profiles = [claude("work", "work@example.com"), external];

test("findClaudeProfileByEmail matches by email", () => {
  expect(findClaudeProfileByEmail(profiles, "work@example.com")?.name).toBe("work");
});

test("findClaudeProfileByEmail ignores external profiles and null email", () => {
  expect(findClaudeProfileByEmail(profiles, "nobody@example.com")).toBeUndefined();
  expect(findClaudeProfileByEmail(profiles, null)).toBeUndefined();
});

test("hasProfileForEmail reflects the lookup", () => {
  expect(hasProfileForEmail(profiles, "work@example.com")).toBe(true);
  expect(hasProfileForEmail(profiles, "nobody@example.com")).toBe(false);
  expect(hasProfileForEmail(profiles, null)).toBe(false);
});
