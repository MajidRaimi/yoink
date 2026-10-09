import type { DemoEvent, DemoKey } from "@/shared/contract";

export type KeyInput = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
};

export type KeymapOptions = {
  textMode?: boolean;
};

const NAMED_KEYS: Readonly<Record<string, DemoKey>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "enter",
  Escape: "escape",
  Esc: "escape",
  Backspace: "backspace",
};

const VIM_KEYS: Readonly<Record<string, DemoKey>> = {
  j: "down",
  k: "up",
};

const isPrintable = (key: string): boolean => [...key].length === 1;

export const toDemoEvent = (input: KeyInput, options: KeymapOptions = {}): DemoEvent | null => {
  if (input.metaKey === true || input.ctrlKey === true || input.altKey === true) return null;
  const named = NAMED_KEYS[input.key];
  if (named !== undefined) return { type: "key", key: named };
  if (input.key === " " || input.key === "Spacebar") {
    return options.textMode === true ? { type: "text", value: " " } : { type: "key", key: "space" };
  }
  if (!isPrintable(input.key)) return null;
  const vim = options.textMode === true ? undefined : VIM_KEYS[input.key];
  if (vim !== undefined) return { type: "key", key: vim };
  return { type: "text", value: input.key };
};

export const keyLabel = (key: DemoKey): string => {
  const labels: Readonly<Record<DemoKey, string>> = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    enter: "Enter",
    space: "Space",
    escape: "Esc",
    backspace: "⌫",
    tab: "Tab",
  };
  return labels[key];
};
