"use client";

import type { KeyboardEvent } from "react";
import { BIDIRECTIONAL_ROVING_KEYS, rovingTarget } from "@/shared/lib/roving-index";
import { useFocusRegistry } from "@/shared/lib/use-focus-registry";

export type RovingRadioItemProps = {
  role: "radio";
  "aria-checked": boolean;
  tabIndex: 0 | -1;
  onClick: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  ref: (node: HTMLElement | null) => void;
};

export type RovingRadio<Value extends string> = {
  itemProps: (option: Value) => RovingRadioItemProps;
};

export const useRovingRadio = <Value extends string>(
  options: readonly Value[],
  value: Value,
  onChange: (next: Value) => void,
): RovingRadio<Value> => {
  const { register, focus } = useFocusRegistry<Value>();

  const itemProps = (option: Value): RovingRadioItemProps => ({
    role: "radio",
    "aria-checked": option === value,
    tabIndex: option === value ? 0 : -1,
    onClick: () => onChange(option),
    onKeyDown: (event) => {
      const next = rovingTarget(options, option, event.key, BIDIRECTIONAL_ROVING_KEYS);
      if (next === undefined) return;
      event.preventDefault();
      onChange(next);
      focus(next);
    },
    ref: register(option),
  });

  return { itemProps };
};
