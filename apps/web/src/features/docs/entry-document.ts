import { entryKey, type EntryRef } from "./collections";
import { readEntry } from "./content";
import { composeEntryMarkdown, faqQuestions, splitEntryBody, type EntryBodyParts, type FaqQuestion } from "./entry-body";
import type { EntryMeta } from "./entry-types";
import { harnessFactsMarkdown, presetFactsMarkdown } from "./facts/facts-model";
import type { FaqMode } from "./mdx/faq-sections";

export type EntryDocument = {
  readonly meta: EntryMeta;
  readonly parts: EntryBodyParts | null;
  readonly markdown: string;
  readonly faqMode: FaqMode | null;
  readonly faq: readonly FaqQuestion[];
};

export const entryFactsMarkdown = (meta: EntryMeta): string | null => {
  if (meta.harness !== undefined) return harnessFactsMarkdown(meta.harness);
  if (meta.preset !== undefined) return presetFactsMarkdown(meta.preset);
  return null;
};

export const faqModeFor = (ref: EntryRef): FaqMode | null => {
  if (ref.collection === "docs") return null;
  return ref.collection === "faq" ? "page" : "section";
};

const buildDocument = (ref: EntryRef): EntryDocument => {
  const { meta, body } = readEntry(ref.collection, ref.slug);
  const faqMode = faqModeFor(ref);
  if (ref.collection === "docs") return { meta, parts: null, markdown: body, faqMode, faq: [] };
  const parts = splitEntryBody(meta.repoPath, body, meta.path);
  if (parts.title !== meta.title) {
    throw new Error(`${meta.repoPath}: the h1 "${parts.title}" must equal the frontmatter title "${meta.title}"`);
  }
  const markdown = composeEntryMarkdown(parts, entryFactsMarkdown(meta));
  return { meta, parts, markdown, faqMode, faq: faqMode === null ? [] : faqQuestions(markdown, faqMode) };
};

const cache = new Map<string, EntryDocument>();

export const entryDocument = (ref: EntryRef): EntryDocument => {
  const key = entryKey(ref);
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  const built = buildDocument(ref);
  cache.set(key, built);
  return built;
};
