"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { type CommandIndexEntry, matchesTerms, queryTerms } from "../command-query";

export type CommandFilter = {
  query: string;
  setQuery: (value: string) => void;
  clear: () => void;
  matchedIds: ReadonlySet<string>;
  isFiltering: boolean;
};

export const useCommandFilter = (index: readonly CommandIndexEntry[]): CommandFilter => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const terms = useMemo(() => queryTerms(deferredQuery), [deferredQuery]);
  const matchedIds = useMemo(
    () => new Set(index.filter((entry) => matchesTerms(entry.text, terms)).map((entry) => entry.id)),
    [index, terms],
  );
  const clear = useCallback((): void => setQuery(""), []);
  return { query, setQuery, clear, matchedIds, isFiltering: terms.length > 0 };
};
