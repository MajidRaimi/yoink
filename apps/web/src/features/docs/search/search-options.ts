import type { Options } from "minisearch";

export const SEARCH_INDEX_PATH = "/search-index.json";

export type SearchSection = {
  id: string;
  path: string;
  title: string;
  group: string;
  heading: string;
  anchor: string;
  text: string;
};

export type SearchHit = Omit<SearchSection, "text">;

export const SEARCH_OPTIONS: Options<SearchSection> = {
  fields: ["heading", "title", "text"],
  storeFields: ["path", "title", "group", "heading", "anchor"],
  searchOptions: {
    boost: { heading: 3, title: 2 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND",
  },
};

export const SEARCH_RESULT_LIMIT = 8;

export const MIN_QUERY_LENGTH = 2;
