import { expect, test } from "bun:test";
import { toListOptions } from "../src/features/menu/list-options";
import { groupedProfileLines } from "../src/features/profiles/grouped-lines";
import {
  accountSummaries,
  currentOverview,
  groupProfiles,
  toProfileOverview,
} from "../src/features/profiles/overview";
import { CODEX_SECRET, KIMI_SECRET, mixedStore } from "./support/account-fixture";

const overview = () => toProfileOverview(mixedStore());

test("groups profiles by tool in a fixed order with per-tool current markers", () => {
  const groups = groupProfiles(overview());
  expect(groups.map((group) => group.key)).toEqual(["claude", "external", "codex", "kimi"]);
  const codex = groups.find((group) => group.key === "codex");
  expect(codex?.rows.map((row) => [row.profile.name, row.isCurrent])).toEqual([
    ["cx-work", false],
    ["cx-personal", true],
  ]);
  const claude = groups.find((group) => group.key === "claude");
  expect(claude?.rows.map((row) => [row.profile.name, row.isCurrent])).toEqual([
    ["work", true],
    ["home", false],
  ]);
});

test("account summaries carry name, type, label and current without secrets", () => {
  const summaries = accountSummaries(overview());
  expect(summaries).toContainEqual({ name: "cx-personal", type: "codex", label: "me@example.com · plus", current: true });
  expect(summaries).toContainEqual({ name: "kimi-main", type: "kimi", label: "kimi:42", current: false });
  expect(summaries).toContainEqual({ name: "work", type: "claude", label: "work@example.com", current: true });
  for (const summary of summaries) expect(Object.keys(summary).sort()).toEqual(["current", "label", "name", "type"]);
  const serialized = JSON.stringify(summaries);
  for (const secret of [CODEX_SECRET, KIMI_SECRET, "claude-keychain", "sk-test-fuse"]) {
    expect(serialized).not.toContain(secret);
  }
});

test("current overview keeps only active profiles, optionally for one tool", () => {
  expect(currentOverview(overview()).profiles.map((profile) => profile.name)).toEqual(["work", "cx-personal"]);
  expect(currentOverview(overview(), "codex").profiles.map((profile) => profile.name)).toEqual(["cx-personal"]);
  expect(currentOverview(overview(), "claude").profiles.map((profile) => profile.name)).toEqual(["work"]);
  expect(currentOverview(overview(), "kimi").profiles).toEqual([]);
});

test("menu options are grouped with section titles and keep the tool's current", () => {
  const options = toListOptions(overview());
  expect(options.map((option) => [option.group, option.name, option.isCurrent])).toEqual([
    ["Claude Code", "work", true],
    ["Claude Code", "home", false],
    ["Providers", "fuse", false],
    ["ChatGPT (Codex)", "cx-work", false],
    ["ChatGPT (Codex)", "cx-personal", true],
    ["Kimi Code", "kimi-main", false],
  ]);
});

test("a single group renders without section titles", () => {
  const store = mixedStore();
  const claudeOnly = toProfileOverview({
    ...store,
    profiles: Object.fromEntries(Object.entries(store.profiles).filter(([, profile]) => profile.type === "claude")),
  });
  expect(toListOptions(claudeOnly).every((option) => option.group === undefined)).toBe(true);
  expect(groupedProfileLines(claudeOnly)).toHaveLength(2);
});

test("grouped lines put a heading before each tool", () => {
  const lines = groupedProfileLines(overview()).map((line) => Bun.stripANSI(line));
  expect(lines).toContain("ChatGPT (Codex)");
  expect(lines).toContain("Kimi Code");
  expect(lines.indexOf("ChatGPT (Codex)")).toBeLessThan(lines.findIndex((line) => line.includes("cx-work")));
});

test("menu options tell Enter to connect providers and switch everything else", () => {
  const labels = Object.fromEntries(toListOptions(overview()).map((option) => [option.name, option.enterLabel]));
  expect(labels.fuse).toBe("connect");
  expect(labels.work).toBe("switch");
  expect(labels["cx-personal"]).toBe("switch");
});
