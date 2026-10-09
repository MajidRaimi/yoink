import { describe, expect, test } from "bun:test";
import { compile } from "@mdx-js/mdx";
import { DOC_SLUGS } from "@/shared/lib/routes";
import { adjacentDocs, getDoc, getDocGroups, getDocs } from "./content";
import { docHeadings, extractHeadings } from "./headings";
import { docLinkContext, docRehypePlugins, docRemarkPlugins } from "./mdx/pipeline";

const compileDoc = async (slug: (typeof DOC_SLUGS)[number]): Promise<string> =>
  String(
    await compile(getDoc(slug).body, {
      format: "md",
      remarkPlugins: docRemarkPlugins(docLinkContext(slug)),
      rehypePlugins: docRehypePlugins(),
    }),
  );

describe("docs content", () => {
  test("every published slug has a doc, in plan order", () => {
    expect(getDocs().map((doc) => [doc.slug, doc.section, doc.order])).toEqual([
      ["getting-started", "Start", 1],
      ["desktop", "Start", 2],
      ["interactive-menu", "Switch", 3],
      ["subscriptions", "Switch", 4],
      ["providers", "Connect", 5],
      ["harnesses", "Connect", 6],
      ["how-it-works", "Understand", 7],
      ["security", "Understand", 8],
      ["usage", "Reference", 9],
    ]);
  });

  test("demos sit on the pages the plan names", () => {
    const demos = Object.fromEntries(getDocs().flatMap((doc) => (doc.demo === undefined ? [] : [[doc.slug, doc.demo]])));
    expect(demos).toEqual({
      desktop: "menubar-panel",
      "interactive-menu": "menu",
      subscriptions: "subscription-switch",
      providers: "provider-add",
    });
  });

  test("groups follow the section order", () => {
    expect(getDocGroups().map((group) => group.section)).toEqual(["Start", "Switch", "Connect", "Understand", "Reference"]);
  });

  test("pager follows nav order", () => {
    expect(adjacentDocs("getting-started")).toMatchObject({ previous: null, next: { slug: "desktop" } });
    expect(adjacentDocs("usage")).toMatchObject({ previous: { slug: "security" }, next: null });
  });

  test("bodies drop the leading H1 from headings", () => {
    for (const slug of DOC_SLUGS) {
      expect(getDoc(slug).body).toMatch(/^\s*# /);
      expect(docHeadings(slug).every((heading) => heading.depth === 2 || heading.depth === 3)).toBe(true);
    }
  });

  test("published copy has no em or en dashes", () => {
    for (const slug of DOC_SLUGS) expect(getDoc(slug).body).not.toMatch(/[\u2013\u2014]/);
  });
});

describe("rendering", () => {
  test.each([...DOC_SLUGS])("%s compiles and its TOC ids match rehype-slug", async (slug) => {
    const output = await compileDoc(slug);
    const renderedIds = new Set([...output.matchAll(/\bid: "([^"]+)"/g)].map((match) => match[1]));
    for (const heading of docHeadings(slug)) expect(renderedIds.has(heading.id)).toBe(true);
    expect(output).not.toMatch(/href: "\.{0,2}\/?[a-z-]+\.md/);
  });

  test("code blocks carry their raw text for the copy button", async () => {
    const output = await compileDoc("getting-started");
    expect(output).toContain('"data-copy": "git clone https://github.com/MajidRaimi/yoink.git\\ncd yoink\\nbun install');
  });

  test("duplicate headings get github-slugger suffixes", () => {
    expect(extractHeadings("# T\n\n## Notes\n\n### Notes\n\n## Notes").map((heading) => heading.id)).toEqual([
      "notes",
      "notes-1",
      "notes-2",
    ]);
  });
});
