"use client";

import { useEffect, useRef } from "react";

const isEditable = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");

const isCommandK = (event: KeyboardEvent): boolean =>
  (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k";

const isSlash = (event: KeyboardEvent): boolean =>
  event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditable(event.target);

export const useSearchHotkey = (onTrigger: () => void): void => {
  const triggerRef = useRef(onTrigger);

  useEffect(() => {
    triggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || !(isCommandK(event) || isSlash(event))) return;
      event.preventDefault();
      triggerRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
