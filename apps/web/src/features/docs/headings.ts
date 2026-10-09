import type { DocHeading } from "@/shared/contract";
import type { DocSlug } from "@/shared/lib/routes";
import { entryKey, type EntryRef } from "./collections";
import { getDoc } from "./content";
import { entryDocument } from "./entry-document";
import { extractHeadings, headingIdSet } from "./headings-core";

export { extractHeadings, sluggedHeadings, tocHeadings, type SluggedHeading } from "./headings-core";

const idCache = new Map<string, ReadonlySet<string>>();

export const headingIdsFor = (ref: EntryRef): ReadonlySet<string> => {
  const key = entryKey(ref);
  const cached = idCache.get(key);
  if (cached !== undefined) return cached;
  const ids = headingIdSet(entryDocument(ref).markdown);
  idCache.set(key, ids);
  return ids;
};

export const docHeadings = (slug: DocSlug): readonly DocHeading[] => extractHeadings(getDoc(slug).body);

export const entryHeadings = (ref: EntryRef): readonly DocHeading[] => extractHeadings(entryDocument(ref).markdown);
