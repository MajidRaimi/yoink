"use client";

import { useCallback, useState } from "react";

export type Disclosure = {
  open: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
};

export const useDisclosure = (initial = false): Disclosure => {
  const [open, setOpen] = useState(initial);
  const show = useCallback((): void => setOpen(true), []);
  const hide = useCallback((): void => setOpen(false), []);
  const toggle = useCallback((): void => setOpen((value) => !value), []);
  return { open, show, hide, toggle };
};
