import { computeFinal } from "@/features/demos/engine/frames";
import { menubarPanelDemo } from "@/features/demos/menubar-panel/definition";
import { MenubarPanelView } from "@/features/demos/menubar-panel/view";

const finalState = computeFinal(menubarPanelDemo);

export const MenubarPanelStatic = (): React.JSX.Element => (
  <MenubarPanelView state={finalState} idPrefix="menubar-panel-static" />
);
