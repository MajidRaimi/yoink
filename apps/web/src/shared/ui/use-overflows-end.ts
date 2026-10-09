"use client";

import { useEffect, useState, type RefObject } from "react";

export const useOverflowsEnd = (
  rootRef: RefObject<HTMLElement | null>,
  sentinelRef: RefObject<HTMLElement | null>,
): boolean => {
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const sentinel = sentinelRef.current;
    if (root === null || sentinel === null) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry !== undefined) setOverflows(!entry.isIntersecting);
      },
      { root, threshold: 1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [rootRef, sentinelRef]);

  return overflows;
};
