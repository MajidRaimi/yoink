"use client";

import { useCallback, useRef } from "react";

export type FocusRegistry<Key> = {
  register: (key: Key) => (node: HTMLElement | null) => void;
  focus: (key: Key) => void;
};

export const useFocusRegistry = <Key>(): FocusRegistry<Key> => {
  const nodes = useRef(new Map<Key, HTMLElement>());

  const register = useCallback(
    (key: Key) =>
      (node: HTMLElement | null): void => {
        if (node === null) nodes.current.delete(key);
        else nodes.current.set(key, node);
      },
    [],
  );

  const focus = useCallback((key: Key): void => nodes.current.get(key)?.focus(), []);

  return { register, focus };
};
