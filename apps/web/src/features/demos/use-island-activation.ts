"use client";

import { type FocusEvent, type RefObject, useCallback, useState } from "react";
import { useNearViewport } from "@/features/demos/use-near-viewport";

const FOCUS_TARGET_SELECTOR = [
  "[data-demo-focus]",
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type IslandActivation<Element extends HTMLElement> = {
  ref: RefObject<Element | null>;
  isActive: boolean;
  isReady: boolean;
  activateOnFocus: (event: FocusEvent<Element>) => void;
  handOffFocus: () => void;
};

const findFocusTarget = (container: HTMLElement): HTMLElement | null =>
  container.querySelector<HTMLElement>("[data-demo-focus]") ??
  container.querySelector<HTMLElement>(FOCUS_TARGET_SELECTOR);

export const useIslandActivation = <Element extends HTMLElement>(rootMargin: string): IslandActivation<Element> => {
  const { ref, isNear } = useNearViewport<Element>(rootMargin);
  const [isFocusRequested, setIsFocusRequested] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const activateOnFocus = useCallback(
    (event: FocusEvent<Element>): void => {
      if (event.target === ref.current) setIsFocusRequested(true);
    },
    [ref],
  );

  const handOffFocus = useCallback((): void => {
    const container = ref.current;
    if (container !== null && document.activeElement === container) {
      findFocusTarget(container)?.focus({ preventScroll: true });
    }
    setIsReady(true);
  }, [ref]);

  return { ref, isActive: isNear || isFocusRequested, isReady, activateOnFocus, handOffFocus };
};
