import { DEMO_IDS, DOC_SECTIONS, isDocSection, type DemoId, type DocMeta, type DocSection } from "@/shared/contract";
import { COMPARE_INDEX_SLUG, type DocSlug } from "@/shared/lib/routes";
import { entryForRepoPath, entryRepoPath, entryUrlPath, sameEntry, type EntryRef } from "./collections";
import type { Competitor, EntryMeta } from "./entry-types";

export class DocFrontmatterError extends Error {
  constructor(slug: string, problem: string) {
    super(`docs/${slug}.md frontmatter: ${problem}`);
    this.name = "DocFrontmatterError";
  }
}

type RawFrontmatter = Readonly<Record<string, unknown>>;

const requireText = (slug: string, data: RawFrontmatter, field: string): string => {
  const value = data[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new DocFrontmatterError(slug, `"${field}" must be a non-empty string`);
  }
  return value.trim();
};

const requireOrder = (slug: string, data: RawFrontmatter): number => {
  const value = data.order;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new DocFrontmatterError(slug, `"order" must be a positive integer`);
  }
  return value;
};

const isDemoId = (value: unknown): value is DemoId =>
  typeof value === "string" && (DEMO_IDS as readonly string[]).includes(value);

const requireSection = (slug: DocSlug, data: RawFrontmatter): DocSection => {
  if (!isDocSection(data.section)) {
    throw new DocFrontmatterError(slug, `"section" must be one of ${DOC_SECTIONS.join(", ")}`);
  }
  return data.section;
};

const optionalDemo = (slug: DocSlug, data: RawFrontmatter): DemoId | undefined => {
  if (data.demo === undefined) return undefined;
  if (!isDemoId(data.demo)) throw new DocFrontmatterError(slug, `"demo" must be one of ${DEMO_IDS.join(", ")}`);
  return data.demo;
};

export const MAX_SEO_TITLE_LENGTH = 62;

const optionalSeoTitle = (slug: string, data: RawFrontmatter): string | undefined => {
  if (data.seoTitle === undefined) return undefined;
  const seoTitle = requireText(slug, data, "seoTitle");
  if (seoTitle.length > MAX_SEO_TITLE_LENGTH) {
    throw new DocFrontmatterError(slug, `"seoTitle" must be at most ${MAX_SEO_TITLE_LENGTH} characters, got ${seoTitle.length}`);
  }
  return seoTitle;
};

export const parseDocMeta = (slug: DocSlug, data: RawFrontmatter): DocMeta => {
  const demo = optionalDemo(slug, data);
  const seoTitle = optionalSeoTitle(slug, data);
  return {
    slug,
    title: requireText(slug, data, "title"),
    ...(seoTitle === undefined ? {} : { seoTitle }),
    description: requireText(slug, data, "description"),
    nav: requireText(slug, data, "nav"),
    order: requireOrder(slug, data),
    section: requireSection(slug, data),
    ...(demo === undefined ? {} : { demo }),
  };
};

export const assertUniqueOrder = (docs: readonly DocMeta[]): void => {
  const seen = new Map<number, DocSlug>();
  for (const doc of docs) {
    const clash = seen.get(doc.order);
    if (clash !== undefined) throw new DocFrontmatterError(doc.slug, `"order" ${doc.order} is already used by ${clash}`);
    seen.set(doc.order, doc.slug);
  }
};

export const assertSectionsFollowOrder = (docs: readonly DocMeta[]): void => {
  const sorted = [...docs].sort((left, right) => left.order - right.order);
  sorted.reduce((previous, doc) => {
    const rank = DOC_SECTIONS.indexOf(doc.section);
    if (rank < previous) {
      throw new DocFrontmatterError(doc.slug, `"section" ${doc.section} breaks the nav order of ${DOC_SECTIONS.join(", ")}`);
    }
    return rank;
  }, 0);
};

export const MIN_ENTRY_DESCRIPTION_LENGTH = 140;

export const MAX_ENTRY_DESCRIPTION_LENGTH = 158;

export type EntryFacts = {
  readonly harnessIds: ReadonlySet<string>;
  readonly presetIds: ReadonlySet<string>;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const entrySource = (ref: EntryRef): string => entryRepoPath(ref).replace(/^docs\//, "").replace(/\.md$/, "");

const requireDescription = (source: string, data: RawFrontmatter): string => {
  const description = requireText(source, data, "description");
  if (description.length < MIN_ENTRY_DESCRIPTION_LENGTH || description.length > MAX_ENTRY_DESCRIPTION_LENGTH) {
    throw new DocFrontmatterError(
      source,
      `"description" must be ${MIN_ENTRY_DESCRIPTION_LENGTH} to ${MAX_ENTRY_DESCRIPTION_LENGTH} characters, got ${description.length}`,
    );
  }
  return description;
};

const toIsoDate = (source: string, field: string, value: unknown): string => {
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  if (typeof text !== "string" || !ISO_DATE.test(text) || Number.isNaN(Date.parse(text))) {
    throw new DocFrontmatterError(source, `"${field}" must be an ISO date like 2026-10-10`);
  }
  return text;
};

const parseRelated = (source: string, ref: EntryRef, value: unknown): readonly EntryRef[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new DocFrontmatterError(source, `"related" must be a list of repo paths like docs/how-it-works.md`);
  return value.map((item: unknown) => {
    if (typeof item !== "string") throw new DocFrontmatterError(source, `"related" items must be strings`);
    const target = entryForRepoPath(item.trim());
    if (target === null) throw new DocFrontmatterError(source, `"related" item "${item}" is not a published page under docs/`);
    if (sameEntry(target, ref)) throw new DocFrontmatterError(source, `"related" must not list the page itself`);
    return target;
  });
};

const requireKnownId = (source: string, data: RawFrontmatter, field: string, ref: EntryRef, known: ReadonlySet<string>): string => {
  const value = requireText(source, data, field);
  if (value !== ref.slug) throw new DocFrontmatterError(source, `"${field}" must equal the file name "${ref.slug}"`);
  if (!known.has(value)) throw new DocFrontmatterError(source, `"${field}" "${value}" is not one of ${[...known].join(", ")}`);
  return value;
};

const parseCompetitor = (source: string, value: unknown): Competitor => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new DocFrontmatterError(source, `"competitor" must be an object with name, url, version and checked`);
  }
  const data: RawFrontmatter = Object.fromEntries(Object.entries(value));
  const url = requireText(source, data, "url");
  if (!url.startsWith("https://")) throw new DocFrontmatterError(source, `"competitor.url" must be an https URL`);
  return {
    name: requireText(source, data, "name"),
    url,
    version: requireText(source, data, "version"),
    checked: toIsoDate(source, "competitor.checked", data.checked),
  };
};

type CollectionFields = Pick<EntryMeta, "harness" | "preset" | "competitor" | "checked">;

const collectionFields = (source: string, ref: EntryRef, data: RawFrontmatter, facts: EntryFacts): CollectionFields => {
  if (ref.collection === "harnesses") return { harness: requireKnownId(source, data, "harness", ref, facts.harnessIds) };
  if (ref.collection === "providers") return { preset: requireKnownId(source, data, "preset", ref, facts.presetIds) };
  if (ref.collection !== "compare") return {};
  const hasCompetitor = data.competitor !== undefined;
  const hasChecked = data.checked !== undefined;
  if (ref.slug === COMPARE_INDEX_SLUG && hasCompetitor) {
    throw new DocFrontmatterError(source, `the roundup uses "checked", not "competitor"`);
  }
  if (hasCompetitor === hasChecked) {
    throw new DocFrontmatterError(source, `set exactly one of "competitor" (one tool) or "checked" (the roundup)`);
  }
  return hasCompetitor
    ? { competitor: parseCompetitor(source, data.competitor) }
    : { checked: toIsoDate(source, "checked", data.checked) };
};

export const parseEntryMeta = (ref: EntryRef, data: RawFrontmatter, facts: EntryFacts): EntryMeta => {
  const source = entrySource(ref);
  const seoTitle = optionalSeoTitle(source, data);
  return {
    ref,
    path: entryUrlPath(ref),
    repoPath: entryRepoPath(ref),
    title: requireText(source, data, "title"),
    ...(seoTitle === undefined ? {} : { seoTitle }),
    description: requireDescription(source, data),
    nav: requireText(source, data, "nav"),
    order: requireOrder(source, data),
    related: parseRelated(source, ref, data.related),
    ...collectionFields(source, ref, data, facts),
  };
};

export const docEntryMeta = (meta: DocMeta): EntryMeta => {
  const ref: EntryRef = { collection: "docs", slug: meta.slug };
  return {
    ref,
    path: entryUrlPath(ref),
    repoPath: entryRepoPath(ref),
    title: meta.title,
    ...(meta.seoTitle === undefined ? {} : { seoTitle: meta.seoTitle }),
    description: meta.description,
    nav: meta.nav,
    order: meta.order,
    related: [],
    section: meta.section,
  };
};

export const assertUniqueEntryOrder = (entries: readonly EntryMeta[]): void => {
  const seen = new Map<number, string>();
  for (const entry of entries) {
    const clash = seen.get(entry.order);
    if (clash !== undefined) throw new DocFrontmatterError(entrySource(entry.ref), `"order" ${entry.order} is already used by ${clash}`);
    seen.set(entry.order, entry.ref.slug);
  }
};
