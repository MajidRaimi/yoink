import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { allSearchSections, buildSearchIndex, serializeSearchIndex } from "@/features/docs/search/build-index";
import { SEARCH_INDEX_PATH } from "@/features/docs/search/search-options";

const WEB_ROOT = resolve(import.meta.dir, "..");

export const searchIndexFile = (): string => join(WEB_ROOT, "public", SEARCH_INDEX_PATH.replace(/^\//, ""));

export const writeSearchIndex = (target: string = searchIndexFile()): number => {
  const sections = allSearchSections();
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, serializeSearchIndex(buildSearchIndex(sections)));
  return sections.length;
};

if (import.meta.main) {
  const count = writeSearchIndex();
  console.log(`search index: ${count} sections -> ${searchIndexFile()}`);
}
