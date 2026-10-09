"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

type NearViewport<Element extends HTMLElement> = {
  ref: RefObject<Element | null>;
  isNear: boolean;
};

export const useNearViewport = <Element extends HTMLElement>(rootMargin: string): NearViewport<Element> => {
  const ref = useRef<Element | null>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (isNear || element === null) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return (): void => observer.disconnect();
  }, [isNear, rootMargin]);

  return { ref, isNear };
};
