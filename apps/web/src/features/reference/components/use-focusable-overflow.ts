"use client";

import { useEffect, useState, type RefObject } from "react";

const overflowsInline = (element: HTMLElement): boolean => element.scrollWidth > element.clientWidth;

export const useFocusableOverflow = (ref: RefObject<HTMLElement | null>): boolean => {
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return undefined;
    const measure = (): void => setOverflows(overflowsInline(element));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return overflows;
};
