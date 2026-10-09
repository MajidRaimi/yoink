import { describe, expect, test } from "bun:test";
import { STATIC_PAGE_PATHS } from "@/shared/lib/routes";
import { contentEntryRefs, entryForRepoPath, entryForUrlPath, entryRepoPath, entryUrlPath, indexablePaths } from "./collections";

describe("collections", () => {
  test("maps repo paths to published entries", () => {
    expect(entryForRepoPath("docs/usage.md")).toEqual({ collection: "docs", slug: "usage" });
    expect(entryForRepoPath("docs/faq.md")).toEqual({ collection: "faq", slug: "faq" });
    expect(entryForRepoPath("docs/harnesses/pi.md")).toEqual({ collection: "harnesses", slug: "pi" });
    expect(entryForRepoPath("docs/compare/index.md")).toEqual({ collection: "compare", slug: "index" });
    expect(entryForRepoPath("docs/development.md")).toBeNull();
    expect(entryForRepoPath("docs/guides/missing.md")).toBeNull();
    expect(entryForRepoPath("README.md")).toBeNull();
  });

  test("builds canonical site paths and repo paths", () => {
    expect(entryUrlPath({ collection: "guides", slug: "x" })).toBe("/guides/x/");
    expect(entryUrlPath({ collection: "compare", slug: "index" })).toBe("/compare/");
    expect(entryUrlPath({ collection: "faq", slug: "faq" })).toBe("/faq/");
    expect(entryRepoPath({ collection: "providers", slug: "openrouter" })).toBe("docs/providers/openrouter.md");
    expect(entryRepoPath({ collection: "faq", slug: "faq" })).toBe("docs/faq.md");
  });

  test("the indexable list holds the static pages and every content entry", () => {
    const paths = indexablePaths();
    expect(paths.slice(0, STATIC_PAGE_PATHS.length)).toEqual([...STATIC_PAGE_PATHS]);
    for (const ref of contentEntryRefs()) {
      expect(paths).toContain(entryUrlPath(ref));
      expect(entryForUrlPath(entryUrlPath(ref))).toEqual(ref);
    }
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.endsWith("/"))).toBe(true);
  });
});
