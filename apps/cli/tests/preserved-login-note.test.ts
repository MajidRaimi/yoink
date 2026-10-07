import { expect, test } from "bun:test";
import { preservedLoginNote } from "../src/features/menu/flows/preserved-login-note";
import { switchedLine } from "../src/features/profiles/format";
import type { SubscriptionProfile } from "../src/features/profiles/types";

const stripAnsi = (text: string): string => text.replace(/\u001b\[[0-9;]*m/g, "");

const profile: SubscriptionProfile = {
  type: "kimi",
  name: "work",
  snapshot: { files: {} },
  identity: { label: "work@example.com", email: "work@example.com" },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

test("preservedLoginNote names the saved profile and points at rename", () => {
  const note = stripAnsi(preservedLoginNote(profile));
  expect(note.startsWith("Saved current login as work (")).toBe(true);
  expect(note.endsWith("Rename it anytime with `yoink rename`.")).toBe(true);
});

test("switchedLine renders subscription profiles too", () => {
  expect(stripAnsi(switchedLine(profile)).startsWith("✔ Switched to work (")).toBe(true);
});
