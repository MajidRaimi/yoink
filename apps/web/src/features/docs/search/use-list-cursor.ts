"use client";

import { useRef, useState, type RefObject } from "react";

export type ListCursor = {
  index: number;
  listRef: RefObject<HTMLUListElement | null>;
  move: (delta: number) => void;
  set: (index: number) => void;
};

export const useListCursor = (count: number, resetKey: string): ListCursor => {
  const [cursor, setCursor] = useState({ key: resetKey, index: 0 });
  const listRef = useRef<HTMLUListElement>(null);
  const raw = cursor.key === resetKey ? cursor.index : 0;
  const index = count === 0 ? -1 : Math.min(raw, count - 1);
  const set = (next: number): void => setCursor({ key: resetKey, index: next });
  const move = (delta: number): void => {
    if (count === 0) return;
    const next = (Math.max(index, 0) + delta + count) % count;
    set(next);
    listRef.current?.children.item(next)?.scrollIntoView({ block: "nearest" });
  };
  return { index, listRef, move, set };
};
