import { expect, test } from "bun:test";
import { enterLabelFor } from "../src/features/menu/action-list";
import { restartHint } from "../src/features/profiles/format";
import { toProfileOverview } from "../src/features/profiles/overview";
import { mixedStore } from "./support/account-fixture";

const profileNamed = (name: string) => {
  const profile = toProfileOverview(mixedStore()).profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new Error(`fixture is missing ${name}`);
  return profile;
};

test("enterLabelFor follows the highlighted row and falls back for an empty list", () => {
  expect(enterLabelFor({ name: "fuse", label: "fuse", hint: "", isCurrent: false, enterLabel: "connect" })).toBe("connect");
  expect(enterLabelFor({ name: "work", label: "work", hint: "", isCurrent: true })).toBe("switch");
  expect(enterLabelFor(undefined)).toBe("new");
});

test("restartHint names the tool that has to reload the login", () => {
  expect(restartHint(profileNamed("work"))).toBe("Restart Claude Code to pick up the new login.");
  expect(restartHint(profileNamed("fuse"))).toBe("Restart Claude Code to pick up the new login.");
  expect(restartHint(profileNamed("cx-personal"))).toBe("Restart Codex to pick up the new login.");
  expect(restartHint(profileNamed("kimi-main"))).toBe("Restart Kimi Code to pick up the new login.");
});
