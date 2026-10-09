import type { DemoDefinition } from "@/shared/contract";
import { initialPanelState, reducePanel, type PanelState } from "@/features/demos/menubar-panel/machine";
import { menubarPanelScript } from "@/features/demos/menubar-panel/script";

export const menubarPanelDemo: DemoDefinition<PanelState> = {
  id: "menubar-panel",
  label: "Yoink menu bar app panel",
  initial: initialPanelState,
  reduce: reducePanel,
  script: menubarPanelScript,
};
