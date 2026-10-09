import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { finalizeOg, rewriteOgReferences } from "./finalize-og";

describe("rewriteOgReferences", () => {
  test("replaces hashed and bare og urls with the png path", () => {
    expect(rewriteOgReferences('<meta content="https://yoink.codes/opengraph-image?a1b2c3"/>')).toBe(
      '<meta content="https://yoink.codes/opengraph-image.png"/>',
    );
    expect(rewriteOgReferences('"/docs/usage/opengraph-image"')).toBe('"/docs/usage/opengraph-image.png"');
  });

  test("leaves already rewritten urls alone", () => {
    const html = '<meta content="/opengraph-image.png"/>';
    expect(rewriteOgReferences(html)).toBe(html);
  });
});

describe("finalizeOg", () => {
  test("renames og files and rewrites html and rsc payloads", () => {
    const out = mkdtempSync(join(tmpdir(), "finalize-og-"));
    mkdirSync(join(out, "docs", "usage"), { recursive: true });
    writeFileSync(join(out, "opengraph-image"), "png");
    writeFileSync(join(out, "docs", "usage", "opengraph-image"), "png");
    writeFileSync(join(out, "index.html"), '<meta property="og:image" content="https://yoink.codes/opengraph-image?1f2e"/>');
    writeFileSync(join(out, "index.txt"), '"/opengraph-image?1f2e"');
    writeFileSync(join(out, "plain.html"), "<p>no images</p>");

    expect(finalizeOg(out)).toEqual({ renamed: 2, rewritten: 2 });
    expect(existsSync(join(out, "opengraph-image.png"))).toBe(true);
    expect(existsSync(join(out, "docs", "usage", "opengraph-image.png"))).toBe(true);
    expect(readFileSync(join(out, "index.html"), "utf8")).toContain("/opengraph-image.png");
    expect(readFileSync(join(out, "index.txt"), "utf8")).toBe('"/opengraph-image.png"');
  });

  test("fails loudly without an out directory", () => {
    expect(() => finalizeOg(join(tmpdir(), "missing-out-dir-for-finalize-og"))).toThrow();
  });
});
