"use client";

import { useMemo } from "react";
import { MIN_QUERY_LENGTH, SEARCH_RESULT_LIMIT, type SearchHit } from "./search-options";
import type { SearchIndexState } from "./use-search-index";

const textField = (value: unknown): string => (typeof value === "string" ? value : "");

const isSitePath = (value: string): boolean => value.startsWith("/") && value.endsWith("/");

export const useDocsSearch = (query: string, state: SearchIndexState): readonly SearchHit[] =>
  useMemo(() => {
    const term = query.trim();
    if (state.status !== "ready" || term.length < MIN_QUERY_LENGTH) return [];
    return state.index
      .search(term)
      .slice(0, SEARCH_RESULT_LIMIT)
      .flatMap((result): SearchHit[] => {
        const path = textField(result.path);
        if (!isSitePath(path)) return [];
        return [
          {
            id: String(result.id),
            path,
            title: textField(result.title),
            group: textField(result.group),
            heading: textField(result.heading),
            anchor: textField(result.anchor),
          },
        ];
      });
  }, [query, state]);
