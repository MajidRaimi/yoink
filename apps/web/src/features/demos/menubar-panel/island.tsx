"use client";

import { useCallback, useId } from "react";
import type { DemoEvent } from "@/shared/contract";
import { useDemo } from "@/features/demos/engine/use-demo";
import { menubarPanelDemo } from "@/features/demos/menubar-panel/definition";
import { isTextMode } from "@/features/demos/menubar-panel/machine";
import { MenubarPanelView } from "@/features/demos/menubar-panel/view";

const DEMO_OPTIONS = { textMode: isTextMode } as const;

const MenubarPanelIsland = (): React.JSX.Element => {
  const idPrefix = useId();
  const demo = useDemo(menubarPanelDemo, DEMO_OPTIONS);
  const { dispatch } = demo;
  const onInput = useCallback(
    (events: readonly DemoEvent[]): void => events.forEach((event) => dispatch(event)),
    [dispatch],
  );
  return (
    <MenubarPanelView
      state={demo.state}
      idPrefix={idPrefix}
      onInput={onInput}
      onReplay={demo.replay}
      rootProps={demo.rootProps}
    />
  );
};

export default MenubarPanelIsland;
