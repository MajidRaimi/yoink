"use client";

import { useEffect, useState } from "react";
import { applyHeadingEntries, type HeadingEntry, type HeadingPositions, resolveActiveHeading } from "./heading-tracker";
import { useMediaQuery } from "./use-media-query";

const TOP_OFFSET = 72;
const BOTTOM_INSET_PERCENT = 65;
const OBSERVER_MARGIN = `-${TOP_OFFSET}px 0px -${BOTTOM_INSET_PERCENT}% 0px`;
const DOC_TOC_ACTIVE_QUERY = "(min-width: 80rem)";

const decodeFragment = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
};

const hashHeading = (ids: readonly string[]): string | null => {
  const hash = decodeFragment(window.location.hash.slice(1));
  return ids.includes(hash) ? hash : null;
};

const toHeadingEntry = (entry: IntersectionObserverEntry): HeadingEntry => ({
  id: entry.target.id,
  intersecting: entry.isIntersecting,
  top: entry.boundingClientRect.top,
  bandBottom: entry.rootBounds?.bottom ?? (window.innerHeight * (100 - BOTTOM_INSET_PERCENT)) / 100,
});

export const useActiveHeading = (ids: readonly string[], activeQuery: string = DOC_TOC_ACTIVE_QUERY): string | null => {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const wide = useMediaQuery(activeQuery);
  const key = ids.join("|");

  useEffect(() => {
    if (!wide) return;
    const headingIds = key.split("|");
    const targets = headingIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;
    let positions: HeadingPositions = new Map();
    let seeded = false;
    const observer = new IntersectionObserver(
      (entries) => {
        positions = applyHeadingEntries(positions, entries.map(toHeadingEntry));
        const resolved = resolveActiveHeading(headingIds, positions);
        setActive(seeded ? resolved : (hashHeading(headingIds) ?? resolved));
        seeded = true;
      },
      { rootMargin: OBSERVER_MARGIN, threshold: 0 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [key, wide]);

  return active;
};
