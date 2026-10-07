import { useEffect, useRef, type RefObject } from "react";

export const useScrollIntoView = <TElement extends HTMLElement>(active: boolean): RefObject<TElement | null> => {
  const ref = useRef<TElement>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);
  return ref;
};
