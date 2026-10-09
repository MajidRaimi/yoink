"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { filterCommands, type CliCommand } from "../commands";

export type CommandFilter = {
  query: string;
  setQuery: (value: string) => void;
  clear: () => void;
  matches: readonly CliCommand[];
  isFiltering: boolean;
};

export const useCommandFilter = (commands: readonly CliCommand[]): CommandFilter => {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const matches = useMemo(() => filterCommands(commands, deferredQuery), [commands, deferredQuery]);
  const clear = useCallback((): void => setQuery(""), []);
  return { query, setQuery, clear, matches, isFiltering: deferredQuery.trim().length > 0 };
};
