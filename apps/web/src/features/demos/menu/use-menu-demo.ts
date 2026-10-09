"use client";

import { useMemo, useRef } from "react";
import { useDemo } from "@/features/demos/engine/use-demo";
import { useLinkedAccount } from "@/features/demos/linked/use-linked-account";
import { menuAccountAdapter } from "@/features/demos/menu/account";
import { menuDefinition } from "@/features/demos/menu/definition";
import { eventsToPick, type MenuState } from "@/features/demos/menu/machine";
import type { MenuViewControls } from "@/features/demos/menu/view";

export type MenuDemo = {
  state: MenuState;
  controls: MenuViewControls;
};

export const useMenuDemo = (linked: boolean): MenuDemo => {
  const demo = useDemo(menuDefinition);
  const { state, dispatch, replay, rootProps } = demo;
  const focusRef = useRef<HTMLDivElement | null>(null);
  useLinkedAccount(demo, menuAccountAdapter, linked);
  const controls = useMemo<MenuViewControls>(
    () => ({
      rootProps,
      focusRef,
      onReplay: replay,
      onPick: (index: number): void => eventsToPick(state, index).forEach(dispatch),
      onReopen: (): void => {
        dispatch({ type: "key", key: "enter" });
        focusRef.current?.focus();
      },
    }),
    [rootProps, replay, state, dispatch],
  );
  return { state, controls };
};
