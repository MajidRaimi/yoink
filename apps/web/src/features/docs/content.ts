import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { DOC_SECTIONS, type DocMeta, type DocSection } from "@/shared/contract";
import { DOC_SLUGS, isDocSlug, type DocSlug } from "@/shared/lib/routes";
import { contentCollectionMetas, readContentCollectionEntry } from "./collection-content";
import type { CollectionId, EntryRef } from "./collections";
import { docsDir } from "./docs-dir";
import type { Entry, EntryMeta } from "./entry-types";
import { assertSectionsFollowOrder, assertUniqueOrder, docEntryMeta, parseDocMeta } from "./frontmatter";

export type Doc = {
  meta: DocMeta;
  body: string;
};

export type DocGroup = {
  section: DocSection;
  docs: readonly DocMeta[];
};

export type AdjacentDocs = {
  previous: DocMeta | null;
  next: DocMeta | null;
};

const readDoc = (slug: DocSlug): Doc => {
  const source = readFileSync(join(docsDir(), `${slug}.md`), "utf8");
  const parsed = matter(source);
  return { meta: parseDocMeta(slug, parsed.data), body: parsed.content };
};

const loadAll = (): ReadonlyMap<DocSlug, Doc> => {
  const docs = DOC_SLUGS.map(readDoc);
  const metas = docs.map((doc) => doc.meta);
  assertUniqueOrder(metas);
  assertSectionsFollowOrder(metas);
  return new Map(docs.map((doc) => [doc.meta.slug, doc]));
};

let cache: ReadonlyMap<DocSlug, Doc> | null = null;

const allDocs = (): ReadonlyMap<DocSlug, Doc> => {
  cache ??= loadAll();
  return cache;
};

export const getDoc = (slug: DocSlug): Doc => {
  const doc = allDocs().get(slug);
  if (doc === undefined) throw new Error(`Unknown doc "${slug}"`);
  return doc;
};

export const docMeta = (slug: DocSlug): DocMeta => getDoc(slug).meta;

export const getDocs = (): readonly DocMeta[] =>
  [...allDocs().values()].map((doc) => doc.meta).sort((left, right) => left.order - right.order);

export const getDocGroups = (): readonly DocGroup[] =>
  DOC_SECTIONS.map((section) => ({ section, docs: getDocs().filter((doc) => doc.section === section) })).filter(
    (group) => group.docs.length > 0,
  );

export const adjacentDocs = (slug: DocSlug): AdjacentDocs => {
  const docs = getDocs();
  const index = docs.findIndex((doc) => doc.slug === slug);
  return { previous: docs[index - 1] ?? null, next: docs[index + 1] ?? null };
};

export const readEntry = (collection: CollectionId, slug: string): Entry => {
  if (collection !== "docs") return readContentCollectionEntry(collection, slug);
  if (!isDocSlug(slug)) throw new Error(`Unknown doc "${slug}"`);
  const doc = getDoc(slug);
  return { meta: docEntryMeta(doc.meta), body: doc.body };
};

export const entryMeta = (ref: EntryRef): EntryMeta => readEntry(ref.collection, ref.slug).meta;

export const getEntries = (collection: CollectionId): readonly EntryMeta[] =>
  collection === "docs" ? getDocs().map(docEntryMeta) : contentCollectionMetas(collection);
