"use client";

import type MiniSearch from "minisearch";
import { useEffect, useState } from "react";
import { SEARCH_INDEX_PATH, SEARCH_OPTIONS, type SearchSection } from "./search-options";

type LoadResult = { status: "ready"; index: MiniSearch<SearchSection> } | { status: "error" };

export type SearchIndexState = LoadResult | { status: "idle" } | { status: "loading" };

class SearchIndexLoadError extends Error {
  constructor(status: number) {
    super(`Search index request failed with ${status}`);
    this.name = "SearchIndexLoadError";
  }
}

let pending: Promise<MiniSearch<SearchSection>> | null = null;

const fetchIndex = async (): Promise<MiniSearch<SearchSection>> => {
  const [response, { default: MiniSearchClass }] = await Promise.all([fetch(SEARCH_INDEX_PATH), import("minisearch")]);
  if (!response.ok) throw new SearchIndexLoadError(response.status);
  return MiniSearchClass.loadJSON<SearchSection>(await response.text(), SEARCH_OPTIONS);
};

const loadIndex = (): Promise<MiniSearch<SearchSection>> => {
  pending ??= fetchIndex().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
};

export const useSearchIndex = (enabled: boolean): SearchIndexState => {
  const [result, setResult] = useState<LoadResult | null>(null);
  const shouldLoad = enabled && result?.status !== "ready";

  useEffect(() => {
    if (!shouldLoad) return;
    let live = true;
    loadIndex().then(
      (index) => {
        if (live) setResult({ status: "ready", index });
      },
      () => {
        if (live) setResult({ status: "error" });
      },
    );
    return () => {
      live = false;
    };
  }, [shouldLoad]);

  if (result?.status === "ready") return result;
  if (!enabled) return { status: "idle" };
  return result ?? { status: "loading" };
};
