"use client";

import { useCallback, useState } from "react";

export type Toggle = {
  on: boolean;
  toggle: () => void;
  set: (next: boolean) => void;
};

export const useToggle = (initial = false): Toggle => {
  const [on, set] = useState(initial);
  const toggle = useCallback((): void => set((value) => !value), []);
  return { on, toggle, set };
};
