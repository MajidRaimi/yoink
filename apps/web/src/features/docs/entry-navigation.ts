import { COMPARE_INDEX_SLUG } from "@/shared/lib/routes";
import { CONTENT_COLLECTIONS, sameEntry, type Crumb, type EntryRef } from "./collections";
import { entryMeta, getEntries } from "./content";
import type { EntryMeta } from "./entry-types";

export const HOME_CRUMB: Crumb = { name: "Home", path: "/" };

const MAX_SIBLINGS = 3;

const MAX_RELATED = 6;

export const crumbLabel = (meta: EntryMeta): string =>
  meta.ref.collection === "harnesses" || meta.ref.collection === "providers" ? meta.nav : meta.title;

export const entryBreadcrumbs = (meta: EntryMeta): readonly Crumb[] => {
  const parents = meta.ref.collection === "docs" ? [{ name: "Docs", path: "/docs/" }] : CONTENT_COLLECTIONS[meta.ref.collection].crumbs;
  return [HOME_CRUMB, ...parents.filter((crumb) => crumb.path !== meta.path), { name: crumbLabel(meta), path: meta.path }];
};

const siblingsOf = (meta: EntryMeta): readonly EntryMeta[] => {
  const others = getEntries(meta.ref.collection).filter((entry) => !sameEntry(entry.ref, meta.ref));
  if (meta.ref.collection === "compare" && meta.ref.slug === COMPARE_INDEX_SLUG) return others;
  if (meta.ref.collection === "faq") return [];
  return others.slice(0, MAX_SIBLINGS);
};

export const relatedEntries = (meta: EntryMeta): readonly EntryMeta[] => {
  const explicit = meta.related.map((ref: EntryRef) => entryMeta(ref));
  const automatic = siblingsOf(meta).filter((sibling) => !explicit.some((entry) => sameEntry(entry.ref, sibling.ref)));
  return [...explicit, ...automatic].slice(0, Math.max(MAX_RELATED, explicit.length));
};
