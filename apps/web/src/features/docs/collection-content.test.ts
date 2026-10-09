import { describe, expect, test } from "bun:test";
import { compile } from "@mdx-js/mdx";
import { contentEntryRefs, entryKey, type EntryRef } from "./collections";
import { getEntries } from "./content";
import { entryDocument } from "./entry-document";
import { wordCount } from "./entry-body";
import { AT_A_GLANCE_ID } from "./facts/facts-model";
import { entryHeadings } from "./headings";
import { extractHeadings } from "./headings-core";
import { docLinkContext, docRehypePlugins, docRemarkPlugins } from "./mdx/pipeline";

const MIN_BODY_WORDS = 350;
const LEAD_WORDS = { min: 40, max: 60 } as const;
const PAGE_FAQ = { min: 2, max: 4 } as const;

const refs = contentEntryRefs().map((ref) => [entryKey(ref), ref] as const);

const requireParts = (ref: EntryRef): NonNullable<ReturnType<typeof entryDocument>["parts"]> => {
  const { parts } = entryDocument(ref);
  if (parts === null) throw new Error(`${entryKey(ref)} has no body parts`);
  return parts;
};

const compileRest = async (ref: EntryRef): Promise<string> =>
  String(
    await compile(requireParts(ref).restMarkdown, {
      format: "md",
      remarkPlugins: docRemarkPlugins(docLinkContext(ref), entryDocument(ref).faqMode),
      rehypePlugins: docRehypePlugins(),
    }),
  );

describe("content collections", () => {
  test("every collection has its example page", () => {
    for (const collection of ["guides", "harnesses", "providers", "compare", "faq"] as const) {
      expect(getEntries(collection).length).toBeGreaterThan(0);
    }
  });

  test.each(refs)("%s opens with an answer-first lead of 40 to 60 words", (_key, ref) => {
    const words = wordCount(requireParts(ref).leadMarkdown);
    expect(words).toBeGreaterThanOrEqual(LEAD_WORDS.min);
    expect(words).toBeLessThanOrEqual(LEAD_WORDS.max);
  });

  test.each(refs)("%s has at least 350 words of its own body", (_key, ref) => {
    const parts = requireParts(ref);
    expect(wordCount(`${parts.leadMarkdown}\n\n${parts.restMarkdown}`)).toBeGreaterThanOrEqual(MIN_BODY_WORDS);
  });

  test.each(refs)("%s keeps a page FAQ to 2 to 4 questions", (_key, ref) => {
    const { faq } = entryDocument(ref);
    if (ref.collection === "faq") {
      expect(faq.length).toBeGreaterThan(PAGE_FAQ.max);
      return;
    }
    if (faq.length === 0) return;
    expect(faq.length).toBeGreaterThanOrEqual(PAGE_FAQ.min);
    expect(faq.length).toBeLessThanOrEqual(PAGE_FAQ.max);
    for (const item of faq) expect(item.answer.length).toBeGreaterThan(0);
  });

  test.each(refs)("%s has no em or en dashes and leaves At a glance to the generated table", (_key, ref) => {
    const { markdown, meta } = entryDocument(ref);
    expect(markdown).not.toMatch(/[\u2013\u2014]/);
    expect(extractHeadings(requireParts(ref).restMarkdown).map((heading) => heading.id)).not.toContain(AT_A_GLANCE_ID);
    const hasFacts = meta.harness !== undefined || meta.preset !== undefined;
    expect(entryHeadings(ref).some((heading) => heading.id === AT_A_GLANCE_ID)).toBe(hasFacts);
  });

  test.each(refs)("%s compiles and its TOC ids match the rendered ids", async (_key, ref) => {
    const output = await compileRest(ref);
    const renderedIds = new Set([...output.matchAll(/\bid: "([^"]+)"/g)].map((match) => match[1]));
    for (const heading of entryHeadings(ref)) {
      if (heading.id !== AT_A_GLANCE_ID) expect(renderedIds.has(heading.id)).toBe(true);
    }
    expect(output).not.toMatch(/href: "\.{0,2}\/?[a-z-/]+\.md/);
  });
});
