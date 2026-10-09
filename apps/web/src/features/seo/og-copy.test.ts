import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DOC_SLUGS } from "@/shared/lib/routes";
import { DOC_OG_FALLBACK, PAGE_OG_COPY, docOgCopy, parseDocOgCopy } from "./og-copy";

const dashes = /[\u2013\u2014]/;

describe("og copy", () => {
  test("every doc slug has fallback copy", () => {
    for (const slug of DOC_SLUGS) {
      expect(DOC_OG_FALLBACK[slug].title.length).toBeGreaterThan(0);
    }
  });

  test("no copy uses an em or en dash", () => {
    const all = [...Object.values(PAGE_OG_COPY), ...Object.values(DOC_OG_FALLBACK)];
    for (const copy of all) {
      expect(dashes.test(copy.title)).toBe(false);
      expect(dashes.test(copy.subtitle)).toBe(false);
    }
  });

  test("frontmatter title and description win over the fallback", () => {
    const source = "---\ntitle: Providers\ndescription: One key in every tool.\n---\n\n# Providers\n";
    expect(parseDocOgCopy(source, { title: "x", subtitle: "y" })).toEqual({
      title: "Providers",
      subtitle: "One key in every tool.",
    });
  });

  test("missing frontmatter or a missing file falls back", () => {
    expect(parseDocOgCopy("# Usage\n", { title: "Usage", subtitle: "Commands" })).toEqual({
      title: "Usage",
      subtitle: "Commands",
    });
    const dir = mkdtempSync(join(tmpdir(), "og-copy-"));
    expect(docOgCopy("security", dir)).toEqual(DOC_OG_FALLBACK.security);
    writeFileSync(join(dir, "security.md"), "---\ntitle: Security model\n---\n");
    expect(docOgCopy("security", dir)).toEqual({ title: "Security model", subtitle: DOC_OG_FALLBACK.security.subtitle });
  });
});
