import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { collectionRefs, entryKey, entryRepoPath, type ContentCollectionId, type EntryRef } from "./collections";
import { repoRoot } from "./docs-dir";
import type { Entry, EntryMeta } from "./entry-types";
import { HARNESS_IDS, PRESET_IDS } from "./facts/facts-model";
import { assertUniqueEntryOrder, parseEntryMeta } from "./frontmatter";

const readContentEntry = (ref: EntryRef): Entry => {
  const parsed = matter(readFileSync(join(repoRoot(), entryRepoPath(ref)), "utf8"));
  return { meta: parseEntryMeta(ref, parsed.data, { harnessIds: HARNESS_IDS, presetIds: PRESET_IDS }), body: parsed.content };
};

const cache = new Map<ContentCollectionId, ReadonlyMap<string, Entry>>();

const loadCollection = (collection: ContentCollectionId): ReadonlyMap<string, Entry> => {
  const entries = collectionRefs(collection).map(readContentEntry);
  assertUniqueEntryOrder(entries.map((entry) => entry.meta));
  return new Map(entries.map((entry) => [entry.meta.ref.slug, entry]));
};

const collectionEntries = (collection: ContentCollectionId): ReadonlyMap<string, Entry> => {
  const cached = cache.get(collection);
  if (cached !== undefined) return cached;
  const loaded = loadCollection(collection);
  cache.set(collection, loaded);
  return loaded;
};

export const readContentCollectionEntry = (collection: ContentCollectionId, slug: string): Entry => {
  const entry = collectionEntries(collection).get(slug);
  if (entry === undefined) throw new Error(`Unknown entry "${entryKey({ collection, slug })}"`);
  return entry;
};

export const contentCollectionMetas = (collection: ContentCollectionId): readonly EntryMeta[] =>
  [...collectionEntries(collection).values()].map((entry) => entry.meta).sort((left, right) => left.order - right.order);
