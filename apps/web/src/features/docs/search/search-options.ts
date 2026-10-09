import type { Options } from "minisearch";
import type { DocSection } from "@/shared/contract";
import type { DocSlug } from "@/shared/lib/routes";

export const SEARCH_INDEX_PATH = "/search-index.json";

export type SearchSection = {
  id: string;
  slug: DocSlug;
  title: string;
  section: DocSection;
  heading: string;
  anchor: string;
  text: string;
};

export type SearchHit = Omit<SearchSection, "text">;

export const SEARCH_OPTIONS: Options<SearchSection> = {
  fields: ["heading", "title", "text"],
  storeFields: ["slug", "title", "section", "heading", "anchor"],
  searchOptions: {
    boost: { heading: 3, title: 2 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND",
  },
};

export const SEARCH_RESULT_LIMIT = 8;
