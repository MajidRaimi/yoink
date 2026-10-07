import type { ClaudeProfile, ProfileStore, SubscriptionProfile, SubscriptionTool } from "../../src/features/profiles/types";
import { makeProvider } from "./provider-fixture";

export const CODEX_SECRET = "codex-refresh-secret";
export const KIMI_SECRET = "kimi-access-secret";

export const claudeProfile = (name: string, email: string): ClaudeProfile => ({
  type: "claude",
  name,
  keychain: `claude-keychain-${name}`,
  account: { emailAddress: email },
  updatedAt: "2026-01-01T00:00:00.000Z",
});

export const subscriptionProfile = (
  type: SubscriptionTool,
  name: string,
  label: string,
  secret: string,
  plan?: string,
): SubscriptionProfile => ({
  type,
  name,
  snapshot: { files: { "auth.json": JSON.stringify({ refresh_token: secret }) } },
  identity: plan === undefined ? { label, email: label } : { label, email: label, plan },
  updatedAt: "2026-01-01T00:00:00.000Z",
});

export const mixedStore = (): ProfileStore => ({
  schemaVersion: 2,
  current: "work",
  currentByTool: { codex: "cx-personal" },
  profiles: {
    "cx-work": subscriptionProfile("codex", "cx-work", "work@example.com", `${CODEX_SECRET}-work`, "team"),
    work: claudeProfile("work", "work@example.com"),
    fuse: makeProvider(),
    "cx-personal": subscriptionProfile("codex", "cx-personal", "me@example.com", `${CODEX_SECRET}-me`, "plus"),
    "kimi-main": subscriptionProfile("kimi", "kimi-main", "kimi:42", KIMI_SECRET),
    home: claudeProfile("home", "home@example.com"),
  },
});
