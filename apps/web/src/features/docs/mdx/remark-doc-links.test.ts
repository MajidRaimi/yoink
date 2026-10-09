import { describe, expect, test } from "bun:test";
import type { EntryRef } from "../collections";
import { DocLinkError, remarkDocLinks, rewriteDocUrl, rewriteImageUrl, type DocLinkContext } from "./remark-doc-links";
import type { TreeNode } from "./syntax-tree";

const HEADINGS: Readonly<Record<string, readonly string[]>> = {
  "docs/providers": ["claude-code-is-exclusive", "presets"],
  "docs/usage": ["commands"],
  "harnesses/pi": ["at-a-glance"],
};

const ENTRIES: Readonly<Record<string, EntryRef>> = {
  "docs/providers.md": { collection: "docs", slug: "providers" },
  "docs/usage.md": { collection: "docs", slug: "usage" },
  "docs/harnesses/pi.md": { collection: "harnesses", slug: "pi" },
  "docs/compare/index.md": { collection: "compare", slug: "index" },
  "docs/faq.md": { collection: "faq", slug: "faq" },
};

const contextFor = (source: EntryRef, sourceRepoPath: string): DocLinkContext => ({
  source,
  sourceRepoPath,
  resolveEntry: (repoPath) => ENTRIES[repoPath] ?? null,
  headingIds: (ref) => new Set(HEADINGS[`${ref.collection}/${ref.slug}`] ?? []),
  repoFileExists: (path) => ["docs/development.md", "README.md", "docs/assets/demo.svg"].includes(path),
});

const context = contextFor({ collection: "docs", slug: "usage" }, "docs/usage.md");

const guideContext = contextFor({ collection: "guides", slug: "switch" }, "docs/guides/switch.md");

describe("rewriteDocUrl", () => {
  test("rewrites published docs to site paths with a trailing slash", () => {
    expect(rewriteDocUrl("./providers.md", context)).toBe("/docs/providers/");
    expect(rewriteDocUrl("providers.md#presets", context)).toBe("/docs/providers/#presets");
    expect(rewriteDocUrl("./providers.md#claude-code-is-exclusive", context)).toBe("/docs/providers/#claude-code-is-exclusive");
  });

  test("resolves collection pages relative to the source folder", () => {
    expect(rewriteDocUrl("../providers.md#presets", guideContext)).toBe("/docs/providers/#presets");
    expect(rewriteDocUrl("../harnesses/pi.md#at-a-glance", guideContext)).toBe("/harnesses/pi/#at-a-glance");
    expect(rewriteDocUrl("../compare/index.md", guideContext)).toBe("/compare/");
    expect(rewriteDocUrl("../faq.md", guideContext)).toBe("/faq/");
    expect(rewriteDocUrl("./harnesses/pi.md", context)).toBe("/harnesses/pi/");
  });

  test("sends unpublished repo files to GitHub", () => {
    expect(rewriteDocUrl("./development.md", context)).toBe("https://github.com/MajidRaimi/yoink/blob/main/docs/development.md");
    expect(rewriteDocUrl("../README.md", context)).toBe("https://github.com/MajidRaimi/yoink/blob/main/README.md");
    expect(rewriteDocUrl("../../README.md", guideContext)).toBe("https://github.com/MajidRaimi/yoink/blob/main/README.md");
  });

  test("leaves external and same-page links alone", () => {
    expect(rewriteDocUrl("https://models.dev", context)).toBe("https://models.dev");
    expect(rewriteDocUrl("mailto:a@b.c", context)).toBe("mailto:a@b.c");
    expect(rewriteDocUrl("#commands", context)).toBe("#commands");
  });

  test("throws on unknown files and anchors", () => {
    expect(() => rewriteDocUrl("./nope.md", context)).toThrow(DocLinkError);
    expect(() => rewriteDocUrl("../guides/missing.md", guideContext)).toThrow(DocLinkError);
    expect(() => rewriteDocUrl("./providers.md#missing", context)).toThrow(/no heading/);
    expect(() => rewriteDocUrl("#missing", context)).toThrow(/no heading/);
    expect(() => rewriteDocUrl("/docs/providers", context)).toThrow(/relative/);
    expect(() => rewriteDocUrl("../../etc/passwd", context)).toThrow(DocLinkError);
  });
});

describe("rewriteImageUrl", () => {
  test("serves repo images from raw GitHub", () => {
    expect(rewriteImageUrl("./assets/demo.svg", context)).toBe(
      "https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/demo.svg",
    );
    expect(rewriteImageUrl("../assets/demo.svg", guideContext)).toBe(
      "https://raw.githubusercontent.com/MajidRaimi/yoink/main/docs/assets/demo.svg",
    );
    expect(() => rewriteImageUrl("./assets/missing.png", context)).toThrow(DocLinkError);
  });
});

describe("remarkDocLinks", () => {
  test("rewrites link and definition nodes in place", () => {
    const tree: TreeNode = {
      type: "root",
      children: [
        { type: "paragraph", children: [{ type: "link", url: "./providers.md", children: [] }] },
        { type: "definition", url: "./usage.md#commands" },
      ],
    };
    remarkDocLinks(context)(tree);
    expect(tree.children?.[0]?.children?.[0]?.url).toBe("/docs/providers/");
    expect(tree.children?.[1]?.url).toBe("/docs/usage/#commands");
  });
});
