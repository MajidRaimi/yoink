import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  CONTENT_COLLECTION_IDS,
  DOC_SLUGS,
  FAQ_SLUG,
  STATIC_PAGE_PATHS,
  entryPath,
  isDocSlug,
  type CollectionId,
  type ContentCollectionId,
} from "@/shared/lib/routes";
import { docsDir } from "./docs-dir";

export type { CollectionId, ContentCollectionId };

export type EntryRef = {
  readonly collection: CollectionId;
  readonly slug: string;
};

export type Crumb = {
  readonly name: string;
  readonly path: string;
};

export type CollectionConfig = {
  readonly id: ContentCollectionId;
  readonly dir: string | null;
  readonly label: string;
  readonly crumbs: readonly Crumb[];
};

const DOCS_CRUMB: Crumb = { name: "Docs", path: "/docs/" };

export const CONTENT_COLLECTIONS: Readonly<Record<ContentCollectionId, CollectionConfig>> = {
  guides: { id: "guides", dir: "guides", label: "Guides", crumbs: [DOCS_CRUMB] },
  harnesses: { id: "harnesses", dir: "harnesses", label: "Harnesses", crumbs: [DOCS_CRUMB, { name: "Harnesses", path: "/docs/harnesses/" }] },
  providers: { id: "providers", dir: "providers", label: "Providers", crumbs: [DOCS_CRUMB, { name: "Providers", path: "/docs/providers/" }] },
  compare: { id: "compare", dir: "compare", label: "Compare", crumbs: [{ name: "Compare", path: "/compare/" }] },
  faq: { id: "faq", dir: null, label: "FAQ", crumbs: [] },
};

export const NAV_COLLECTIONS: readonly ContentCollectionId[] = ["guides", "harnesses", "providers", "compare"];

export const ENTRY_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SUBDIR_FILE = /^docs\/(guides|harnesses|providers|compare)\/([a-z0-9-]+)\.md$/;

const ROOT_FILE = /^docs\/([a-z0-9-]+)\.md$/;

export class CollectionError extends Error {
  constructor(problem: string) {
    super(`content collections: ${problem}`);
    this.name = "CollectionError";
  }
}

const isContentCollection = (value: string): value is ContentCollectionId =>
  (CONTENT_COLLECTION_IDS as readonly string[]).includes(value);

const markdownSlugs = (directory: string): readonly string[] => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.slice(0, -".md".length))
    .map((slug) => {
      if (!ENTRY_SLUG.test(slug)) throw new CollectionError(`${join(directory, slug)}.md is not a lowercase kebab-case file name`);
      return slug;
    })
    .toSorted();
};

const slugCache = new Map<CollectionId, readonly string[]>();

const readSlugs = (collection: CollectionId): readonly string[] => {
  if (collection === "docs") return DOC_SLUGS;
  if (collection === "faq") return existsSync(join(docsDir(), `${FAQ_SLUG}.md`)) ? [FAQ_SLUG] : [];
  const { dir } = CONTENT_COLLECTIONS[collection];
  return dir === null ? [] : markdownSlugs(join(docsDir(), dir));
};

export const collectionSlugs = (collection: CollectionId): readonly string[] => {
  const cached = slugCache.get(collection);
  if (cached !== undefined) return cached;
  const slugs = readSlugs(collection);
  slugCache.set(collection, slugs);
  return slugs;
};

export const collectionRefs = (collection: CollectionId): readonly EntryRef[] =>
  collectionSlugs(collection).map((slug) => ({ collection, slug }));

export const hasEntry = (ref: EntryRef): boolean => collectionSlugs(ref.collection).includes(ref.slug);

export const entryKey = (ref: EntryRef): string => `${ref.collection}/${ref.slug}`;

export const sameEntry = (left: EntryRef, right: EntryRef): boolean =>
  left.collection === right.collection && left.slug === right.slug;

export const entryRepoPath = ({ collection, slug }: EntryRef): string => {
  if (collection === "docs" || collection === "faq") return `docs/${slug}.md`;
  return `docs/${CONTENT_COLLECTIONS[collection].dir ?? collection}/${slug}.md`;
};

export const entryUrlPath = ({ collection, slug }: EntryRef): string => entryPath(collection, slug);

export const entryForRepoPath = (repoPath: string): EntryRef | null => {
  const nested = SUBDIR_FILE.exec(repoPath);
  if (nested !== null) {
    const [, collection = "", slug = ""] = nested;
    if (!isContentCollection(collection)) return null;
    const ref: EntryRef = { collection, slug };
    return hasEntry(ref) ? ref : null;
  }
  const slug = ROOT_FILE.exec(repoPath)?.[1];
  if (slug === undefined) return null;
  if (isDocSlug(slug)) return { collection: "docs", slug };
  const faq: EntryRef = { collection: "faq", slug };
  return slug === FAQ_SLUG && hasEntry(faq) ? faq : null;
};

export const contentEntryRefs = (): readonly EntryRef[] => CONTENT_COLLECTION_IDS.flatMap(collectionRefs);

export const allEntryRefs = (): readonly EntryRef[] => [...collectionRefs("docs"), ...contentEntryRefs()];

export const entryForUrlPath = (path: string): EntryRef | null =>
  contentEntryRefs().find((ref) => entryUrlPath(ref) === path) ?? null;

export const indexablePaths = (): readonly string[] => [...STATIC_PAGE_PATHS, ...contentEntryRefs().map(entryUrlPath)];
