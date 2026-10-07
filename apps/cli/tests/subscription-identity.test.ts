import { expect, test } from "bun:test";
import { defaultSubscriptionName, sameIdentity } from "../src/features/subscriptions/identity";

test("sameIdentity needs at least one shared field and no conflicting one", () => {
  expect(sameIdentity({ label: "a", accountId: "1" }, { label: "b", accountId: "1" })).toBe(true);
  expect(sameIdentity({ label: "a", email: "A@x.com" }, { label: "b", email: "a@x.com" })).toBe(true);
  expect(sameIdentity({ label: "a", accountId: "1", email: "a@x.com" }, { label: "a", accountId: "1", email: "b@x.com" })).toBe(false);
  expect(sameIdentity({ label: "a", accountId: "1" }, { label: "a", accountId: "2" })).toBe(false);
  expect(sameIdentity({ label: "a" }, { label: "a" })).toBe(false);
  expect(sameIdentity({ label: "a", email: "a@x.com" }, { label: "a", accountId: "1" })).toBe(false);
});

test("defaultSubscriptionName prefixes the tool once", () => {
  expect(defaultSubscriptionName("codex", { label: "x", email: "majid.r@x.com" })).toBe("codex-majid-r");
  expect(defaultSubscriptionName("kimi", { label: "kimi:123" })).toBe("kimi-123");
  expect(defaultSubscriptionName("copilot", { label: "octocat" })).toBe("copilot-octocat");
  expect(defaultSubscriptionName("gemini", { label: "!!!" })).toBe("gemini");
});
