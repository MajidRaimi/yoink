import { useCallback } from "react";

export const useAutoFocus = <TElement extends HTMLElement>(): ((node: TElement | null) => void) =>
  useCallback((node: TElement | null) => node?.focus({ preventScroll: true }), []);
