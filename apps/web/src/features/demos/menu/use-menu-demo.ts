"use client";

import { useMemo } from "react";
import { useDemo } from "@/features/demos/engine/use-demo";
import { menuDefinition } from "@/features/demos/menu/definition";
import { eventsToPick, type MenuState } from "@/features/demos/menu/machine";
import type { MenuViewControls } from "@/features/demos/menu/view";

export type MenuDemo = {
  state: MenuState;
  controls: MenuViewControls;
};

export const useMenuDemo = (): MenuDemo => {
  const { state, dispatch, replay, rootProps } = useDemo(menuDefinition);
  const controls = useMemo<MenuViewControls>(
    () => ({
      rootProps,
      onReplay: replay,
      onPick: (index: number): void => eventsToPick(state, index).forEach(dispatch),
      onReopen: (): void => {
        dispatch({ type: "key", key: "enter" });
        rootProps.ref.current?.focus();
      },
    }),
    [rootProps, replay, state, dispatch],
  );
  return { state, controls };
};
