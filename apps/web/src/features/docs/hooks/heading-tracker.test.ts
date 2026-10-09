import { describe, expect, test } from "bun:test";
import { applyHeadingEntries, resolveActiveHeading } from "./heading-tracker";

const ids = ["intro", "setup", "usage"] as const;

describe("resolveActiveHeading", () => {
  test("falls back to the first heading before any entries arrive", () => {
    expect(resolveActiveHeading(ids, new Map())).toBe("intro");
  });

  test("prefers the topmost heading inside the band", () => {
    const positions = applyHeadingEntries(new Map(), [
      { id: "intro", intersecting: false, top: -400, bandBottom: 300 },
      { id: "setup", intersecting: true, top: 120, bandBottom: 300 },
      { id: "usage", intersecting: true, top: 250, bandBottom: 300 },
    ]);
    expect(resolveActiveHeading(ids, positions)).toBe("setup");
  });

  test("keeps the last passed heading when none intersect", () => {
    const seeded = applyHeadingEntries(new Map(), [
      { id: "intro", intersecting: false, top: -900, bandBottom: 300 },
      { id: "setup", intersecting: true, top: 200, bandBottom: 300 },
      { id: "usage", intersecting: false, top: 1200, bandBottom: 300 },
    ]);
    const scrolled = applyHeadingEntries(seeded, [{ id: "setup", intersecting: false, top: 40, bandBottom: 300 }]);
    expect(resolveActiveHeading(ids, scrolled)).toBe("setup");
  });

  test("returns null without headings", () => {
    expect(resolveActiveHeading([], new Map())).toBeNull();
  });
});
