"use client";

import { useCallback, useRef, type KeyboardEvent } from "react";
import { directionForKey, moveIndex } from "@/features/landing/hooks/roving-radio";

export type RovingRadioItemProps = {
  role: "radio";
  "aria-checked": boolean;
  tabIndex: 0 | -1;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  ref: (node: HTMLButtonElement | null) => void;
};

export type RovingRadio<Value extends string> = {
  itemProps: (option: Value) => RovingRadioItemProps;
};

export const useRovingRadio = <Value extends string>(
  options: readonly Value[],
  value: Value,
  onChange: (next: Value) => void,
): RovingRadio<Value> => {
  const nodes = useRef(new Map<Value, HTMLButtonElement>());

  const select = useCallback(
    (option: Value): void => {
      onChange(option);
      nodes.current.get(option)?.focus();
    },
    [onChange],
  );

  const itemProps = (option: Value): RovingRadioItemProps => ({
    role: "radio",
    "aria-checked": option === value,
    tabIndex: option === value ? 0 : -1,
    onClick: () => onChange(option),
    onKeyDown: (event) => {
      const direction = directionForKey(event.key);
      if (direction === undefined) return;
      event.preventDefault();
      const next = options[moveIndex(options.indexOf(option), options.length, direction)];
      if (next !== undefined) select(next);
    },
    ref: (node) => {
      if (node === null) nodes.current.delete(option);
      else nodes.current.set(option, node);
    },
  });

  return { itemProps };
};
