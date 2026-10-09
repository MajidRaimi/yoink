import { describe, expect, test } from "bun:test";
import {
  diffSummary,
  MANAGED_ENV_KEYS,
  settingsDiff,
  TRACKED_WARNING,
} from "@/features/landing/safety/settings-diff-model";

const userLines = (mode: "apply" | "strip", tracked: boolean): string[] =>
  settingsDiff({ mode, tracked })
    .filter((line) => line.ownedBy === "user")
    .map((line) => line.text);

describe("settings.json diff", () => {
  test("applying adds exactly the seven managed keys", () => {
    const added = settingsDiff({ mode: "apply", tracked: false }).filter((line) => line.change === "added");
    expect(added.map((line) => line.id)).toEqual([...MANAGED_ENV_KEYS]);
    expect(added.at(-1)?.comma).toBe(false);
  });

  test("stripping removes exactly the seven managed keys", () => {
    const removed = settingsDiff({ mode: "strip", tracked: false }).filter((line) => line.change === "removed");
    expect(removed.length).toBe(7);
  });

  test("user keys never change", () => {
    const lines = settingsDiff({ mode: "apply", tracked: false });
    expect(lines.filter((line) => line.ownedBy !== "yoink").every((line) => line.change === "context")).toBe(true);
    expect(userLines("apply", false)).toEqual(userLines("strip", false));
    expect(userLines("apply", true)).toEqual(userLines("apply", false));
  });

  test("a tracked config is skipped on apply", () => {
    const lines = settingsDiff({ mode: "apply", tracked: true });
    expect(lines.some((line) => line.ownedBy === "yoink")).toBe(false);
    expect(diffSummary(lines)).toBe("Nothing written. 3 of your keys unchanged.");
  });

  test("summaries count real lines", () => {
    expect(diffSummary(settingsDiff({ mode: "apply", tracked: false }))).toBe(
      "7 managed keys added. 3 of your keys unchanged.",
    );
  });

  test("warning matches the CLI prompt", () => {
    expect(TRACKED_WARNING).toContain("is tracked in a git repo on this machine, so your API key could be committed. Write anyway?");
  });
});
