import type { KeyboardEvent } from "react";

export const submitOnModEnter =
  (onSubmit: () => void, enabled: boolean): ((event: KeyboardEvent<HTMLElement>) => void) =>
  (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey) || !enabled) return;
    event.preventDefault();
    onSubmit();
  };
