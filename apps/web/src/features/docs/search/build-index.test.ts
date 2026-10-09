import { describe, expect, test } from "bun:test";
import MiniSearch from "minisearch";
import { headingIdsFor } from "../headings";
import { allSearchSections, buildSearchIndex, serializeSearchIndex } from "./build-index";
import { SEARCH_OPTIONS, type SearchSection } from "./search-options";

describe("search index", () => {
  const sections = allSearchSections();

  test("indexes an intro plus every h2 section of each doc", () => {
    const security = sections.filter((section) => section.slug === "security").map((section) => section.anchor);
    expect(security[0]).toBe("");
    expect(security).toContain("git-tracked-configs");
    for (const section of sections) {
      if (section.anchor.length > 0) expect(headingIdsFor(section.slug).has(section.anchor)).toBe(true);
    }
  });

  test("round-trips through JSON and finds sections", () => {
    const json = serializeSearchIndex(buildSearchIndex(sections));
    const index = MiniSearch.loadJSON<SearchSection>(json, SEARCH_OPTIONS);
    const top = index.search("allow tracked")[0];
    expect(top?.slug).toBe("security");
    expect(index.search("global shortcut").some((hit) => hit.slug === "desktop")).toBe(true);
  });
});
