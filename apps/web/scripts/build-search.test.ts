import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { searchIndexFile, writeSearchIndex } from "./build-search";

describe("build-search", () => {
  test("targets public/search-index.json", () => {
    expect(searchIndexFile().endsWith(join("apps", "web", "public", "search-index.json"))).toBe(true);
  });

  test("writes a loadable MiniSearch index", () => {
    const dir = mkdtempSync(join(tmpdir(), "yoink-search-"));
    try {
      const target = join(dir, "nested", "search-index.json");
      const count = writeSearchIndex(target);
      expect(count).toBeGreaterThan(9);
      const parsed: unknown = JSON.parse(readFileSync(target, "utf8"));
      expect(parsed).toHaveProperty("documentCount", count);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
