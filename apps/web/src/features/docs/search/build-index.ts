import MiniSearch from "minisearch";
import { getDoc, getDocs } from "../content";
import { SEARCH_OPTIONS, type SearchSection } from "./search-options";
import { docSections } from "./sections";

export const allSearchSections = (): readonly SearchSection[] =>
  getDocs().flatMap((meta) => docSections(meta, getDoc(meta.slug).body));

export const buildSearchIndex = (sections: readonly SearchSection[] = allSearchSections()): MiniSearch<SearchSection> => {
  const index = new MiniSearch<SearchSection>(SEARCH_OPTIONS);
  index.addAll([...sections]);
  return index;
};

export const serializeSearchIndex = (index: MiniSearch<SearchSection>): string => JSON.stringify(index);
