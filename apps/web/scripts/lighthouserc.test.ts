import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INDEXABLE_PATHS } from "../src/shared/lib/routes";

type LighthouseAssertion = [string, Record<string, number>?];

type LighthouseConfig = {
  ci: {
    collect: { staticDistDir: string; url: readonly string[] };
    assert: { assertions: Readonly<Record<string, LighthouseAssertion>> };
  };
};

const config = JSON.parse(readFileSync(resolve(import.meta.dir, "..", "lighthouserc.json"), "utf8")) as LighthouseConfig;

describe("lighthouserc.json", () => {
  test("audits exactly the indexable paths", () => {
    const paths = config.ci.collect.url.map((url) => new URL(url).pathname);
    expect(paths.toSorted()).toEqual([...INDEXABLE_PATHS].toSorted());
  });

  test("serves the static export relative to apps/web", () => {
    expect(config.ci.collect.staticDistDir).toBe("./out");
  });

  test("bounds cumulative layout shift", () => {
    expect(config.ci.assert.assertions["cumulative-layout-shift"]).toEqual(["error", { maxNumericValue: 0.05 }]);
  });
});
