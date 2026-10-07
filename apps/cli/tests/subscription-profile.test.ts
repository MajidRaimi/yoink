import { expect, test } from "bun:test";
import {
  isSubscriptionProfile,
  isSubscriptionTool,
  parseCurrentByTool,
  releaseFromCurrentByTool,
  renameInCurrentByTool,
} from "../src/features/profiles/subscription-profile";
import type { ProfileStore, SubscriptionProfile } from "../src/features/profiles/types";

const codex: SubscriptionProfile = { type: "codex", name: "c", snapshot: { files: {} }, identity: { label: "c" }, updatedAt: "t" };

test("isSubscriptionTool and isSubscriptionProfile recognise only the four tools", () => {
  expect(["codex", "kimi", "gemini", "copilot"].every(isSubscriptionTool)).toBe(true);
  expect(isSubscriptionTool("claude")).toBe(false);
  expect(isSubscriptionTool(undefined)).toBe(false);
  expect(isSubscriptionProfile(codex)).toBe(true);
  expect(isSubscriptionProfile({ type: "claude", name: "x", keychain: "k", account: null, updatedAt: "t" })).toBe(false);
});

test("renameInCurrentByTool and releaseFromCurrentByTool follow renames and removals", () => {
  const store: ProfileStore = { current: null, currentByTool: { codex: "c", kimi: "k" }, profiles: {} };
  renameInCurrentByTool(store, "c", "work");
  expect(store.currentByTool).toEqual({ codex: "work", kimi: "k" });
  releaseFromCurrentByTool(store, "k");
  expect(store.currentByTool).toEqual({ codex: "work" });
  const bare: ProfileStore = { current: null, profiles: {} };
  renameInCurrentByTool(bare, "a", "b");
  releaseFromCurrentByTool(bare, "a");
  expect("currentByTool" in bare).toBe(false);
});

test("parseCurrentByTool drops unknown tools and non-string names", () => {
  expect(parseCurrentByTool({ codex: "a", claude: "b", kimi: 1, gemini: "" })).toEqual({ codex: "a" });
  expect(parseCurrentByTool(null)).toBeUndefined();
  expect(parseCurrentByTool(["codex"])).toBeUndefined();
});
