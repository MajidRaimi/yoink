import { describe, expect, test } from "bun:test";
import type { DocSlug } from "@/shared/lib/routes";
import { DocLinkError, remarkDocLinks, rewriteDocUrl, rewriteImageUrl, type DocLinkContext } from "./remark-doc-links";
import type { TreeNode } from "./syntax-tree";

const HEADINGS: Partial<Record<DocSlug, readonly string[]>> = {
  providers: ["claude-code-is-exclusive", "presets"],
  usage: ["commands"],
};

const context: DocLinkContext = {
  source: "usage",
  headingIds: (slug) => new Set(HEADINGS[slug] ?? []),
  repoFileExists: (path) => ["docs/development.md", "README.md", "docs/assets/demo.svg"].includes(path),
};

describe("rewriteDocUrl", () => {
  test("rewrites published docs to site paths with a trailing slash", () => {
    expect(rewriteDocUrl("./providers.md", context)).toBe("/docs/providers/");
    expect(rewriteDocUrl("providers.md#presets", context)).toBe("/docs/providers/#presets");
    expect(rewriteDocUrl("./providers.md#claude-code-is-exclusive", context)).toBe("/docs/providers/#claude-code-is-exclusive");
  });

  test("sends unpublished repo files to GitHub", () => {
    expect(rewriteDocUrl("./development.md", context)).toBe("https://github.com/MajidRaimi/yoink/blob/main/docs/development.md");
    expect(rewriteDocUrl("../README.md", context)).toBe("https://github.com/MajidRaimi/yoink/blob/main/README.md");
  });

  test("leaves external and same-page links alone", () => {
    expect(rewriteDocUrl("https://models.dev", context)).toBe("https://models.dev");
    expect(rewriteDocUrl("mailto:a@b.c", context)).toBe("mailto:a@b.c");
    expect(rewriteDocUrl("#commands", context)).toBe("#commands");
  });

  test("throws on unknown files and anchors", () => {
    expect(() => rewriteDocUrl("./nope.md", context)).toThrow(DocLinkError);
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
