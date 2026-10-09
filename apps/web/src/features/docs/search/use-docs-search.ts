"use client";

import { useMemo } from "react";
import { isDocSection } from "@/shared/contract";
import { isDocSlug } from "@/shared/lib/routes";
import { MIN_QUERY_LENGTH, SEARCH_RESULT_LIMIT, type SearchHit } from "./search-options";
import type { SearchIndexState } from "./use-search-index";

const textField = (value: unknown): string => (typeof value === "string" ? value : "");

export const useDocsSearch = (query: string, state: SearchIndexState): readonly SearchHit[] =>
  useMemo(() => {
    const term = query.trim();
    if (state.status !== "ready" || term.length < MIN_QUERY_LENGTH) return [];
    return state.index
      .search(term)
      .slice(0, SEARCH_RESULT_LIMIT)
      .flatMap((result): SearchHit[] => {
        const slug = textField(result.slug);
        const section: unknown = result.section;
        if (!isDocSlug(slug) || !isDocSection(section)) return [];
        return [
          {
            id: String(result.id),
            slug,
            title: textField(result.title),
            section,
            heading: textField(result.heading),
            anchor: textField(result.anchor),
          },
        ];
      });
  }, [query, state]);
