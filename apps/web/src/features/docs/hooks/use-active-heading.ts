"use client";

import { useEffect, useState } from "react";

const TOP_OFFSET = 72;
const BOTTOM_INSET_PERCENT = 65;
const OBSERVER_MARGIN = `-${TOP_OFFSET}px 0px -${BOTTOM_INSET_PERCENT}% 0px`;

const topmostIntersecting = (entries: readonly IntersectionObserverEntry[]): string | null => {
  const visible = entries.filter((entry) => entry.isIntersecting);
  visible.sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
  return visible[0]?.target.id ?? null;
};

const lastPassedHeading = (targets: readonly HTMLElement[]): string | null => {
  const bandBottom = (window.innerHeight * (100 - BOTTOM_INSET_PERCENT)) / 100;
  const passed = targets.filter((target) => target.getBoundingClientRect().top <= bandBottom);
  return passed.at(-1)?.id ?? targets[0]?.id ?? null;
};

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

export const useActiveHeading = (ids: readonly string[]): string | null => {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join("|");

  useEffect(() => {
    const headingIds = key.split("|");
    const targets = headingIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;
    setActive(hashHeading(headingIds) ?? lastPassedHeading(targets));
    const observer = new IntersectionObserver(
      (entries) => {
        setActive(topmostIntersecting(entries) ?? lastPassedHeading(targets));
      },
      { rootMargin: OBSERVER_MARGIN, threshold: 0 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, [key]);

  return active;
};
