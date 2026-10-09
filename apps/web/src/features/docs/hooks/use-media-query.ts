"use client";

import { useCallback, useSyncExternalStore } from "react";

const readServerMatch = (): boolean => false;

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const readMatch = useCallback((): boolean => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, readMatch, readServerMatch);
};
