import { describe, expect, test } from "bun:test";
import { createDateResolver, formatDisplayDate, lastModified, type GitRunner } from "./last-modified";

const BUILD_TIME = new Date("2026-10-09T12:00:00.000Z");

describe("createDateResolver", () => {
  test("uses the newest commit for modified and the oldest for published", () => {
    const calls: (readonly string[])[] = [];
    const git: GitRunner = (args) => {
      calls.push(args);
      return "2026-10-01T10:00:00+03:00\n2026-09-20T08:00:00Z\n2026-09-01T00:00:00Z\n";
    };
    const resolve = createDateResolver(git, BUILD_TIME);
    expect(resolve(["docs/usage.md"])).toEqual({
      published: "2026-09-01T00:00:00.000Z",
      modified: "2026-10-01T07:00:00.000Z",
    });
    expect(calls).toEqual([["log", "--format=%cI", "--", ":(top)docs/usage.md"]]);
  });

  test("falls back to the build time when git fails or knows no commits", () => {
    const fallback = { published: BUILD_TIME.toISOString(), modified: BUILD_TIME.toISOString() };
    expect(createDateResolver(() => null, BUILD_TIME)(["docs/usage.md"])).toEqual(fallback);
    expect(createDateResolver(() => "", BUILD_TIME)(["docs/new.md"])).toEqual(fallback);
    expect(createDateResolver(() => "not a date\n", BUILD_TIME)([])).toEqual(fallback);
  });

  test("asks git once per source set", () => {
    let count = 0;
    const resolve = createDateResolver(() => {
      count += 1;
      return "2026-10-01T00:00:00Z\n";
    }, BUILD_TIME);
    resolve(["docs/usage.md"]);
    resolve(["docs/usage.md"]);
    expect(count).toBe(1);
  });

  test("reads real commit dates for a tracked doc", () => {
    const dates = lastModified(["docs/usage.md"]);
    expect(Number.isNaN(Date.parse(dates.modified))).toBe(false);
    expect(dates.published <= dates.modified).toBe(true);
  });
});

describe("formatDisplayDate", () => {
  test("formats in UTC so the visible date matches the machine-readable one", () => {
    expect(formatDisplayDate("2026-10-01T23:30:00.000Z")).toBe("October 1, 2026");
  });
});
