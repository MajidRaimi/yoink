import MiniSearch from "minisearch";
import { allEntryRefs, CONTENT_COLLECTIONS } from "../collections";
import { entryDocument } from "../entry-document";
import { SEARCH_OPTIONS, type SearchSection } from "./search-options";
import { docSections } from "./sections";

export const allSearchSections = (): readonly SearchSection[] =>
  allEntryRefs().flatMap((ref) => {
    const { meta, markdown } = entryDocument(ref);
    const group = meta.section ?? (ref.collection === "docs" ? "Docs" : CONTENT_COLLECTIONS[ref.collection].label);
    return docSections({ path: meta.path, title: meta.title, description: meta.description, group }, markdown);
  });

export const buildSearchIndex = (sections: readonly SearchSection[] = allSearchSections()): MiniSearch<SearchSection> => {
  const index = new MiniSearch<SearchSection>(SEARCH_OPTIONS);
  index.addAll([...sections]);
  return index;
};

export const serializeSearchIndex = (index: MiniSearch<SearchSection>): string => JSON.stringify(index);
