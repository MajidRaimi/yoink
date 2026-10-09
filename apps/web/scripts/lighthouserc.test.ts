import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { contentEntryRefs, entryUrlPath, indexablePaths } from "../src/features/docs/collections";
import { COMPARE_INDEX_SLUG, CONTENT_COLLECTION_IDS, STATIC_PAGE_PATHS, entryPath } from "../src/shared/lib/routes";

type LighthouseAssertion = [string, Record<string, number>?];

type LighthouseConfig = {
  ci: {
    collect: { staticDistDir: string; url: readonly string[] };
    assert: { assertions: Readonly<Record<string, LighthouseAssertion>> };
  };
};

const config = JSON.parse(readFileSync(resolve(import.meta.dir, "..", "lighthouserc.json"), "utf8")) as LighthouseConfig;

describe("lighthouserc.json", () => {
  const paths = config.ci.collect.url.map((url) => new URL(url).pathname);

  test("audits only indexable pages, each once", () => {
    const indexable = new Set(indexablePaths());
    expect(paths.filter((path) => !indexable.has(path))).toEqual([]);
    expect(new Set(paths).size).toBe(paths.length);
  });

  test("audits every static page path", () => {
    expect(STATIC_PAGE_PATHS.filter((path) => !paths.includes(path))).toEqual([]);
  });

  test("audits at least one page from every content collection", () => {
    const audited = new Set(paths);
    const represented = new Set(
      contentEntryRefs()
        .filter((ref) => audited.has(entryUrlPath(ref)))
        .map((ref) => ref.collection),
    );
    expect([...represented].toSorted()).toEqual([...CONTENT_COLLECTION_IDS].toSorted());
  });

  test("audits the compare hub and at least one comparison", () => {
    const hub = entryPath("compare", COMPARE_INDEX_SLUG);
    expect(paths).toContain(hub);
    expect(paths.some((path) => path.startsWith(hub) && path !== hub)).toBe(true);
  });

  test("serves the static export relative to apps/web", () => {
    expect(config.ci.collect.staticDistDir).toBe("./out");
  });

  test("bounds cumulative layout shift", () => {
    expect(config.ci.assert.assertions["cumulative-layout-shift"]).toEqual(["error", { maxNumericValue: 0.05 }]);
  });
});
