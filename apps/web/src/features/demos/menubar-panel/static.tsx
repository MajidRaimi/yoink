import { computeFinal } from "@/features/demos/engine/frames";
import { menubarPanelDemo } from "@/features/demos/menubar-panel/definition";
import { MenubarPanelView } from "@/features/demos/menubar-panel/view";

const finalState = computeFinal(menubarPanelDemo);

type MenubarPanelStaticProps = {
  idPrefix: string;
};

export const MenubarPanelStatic = ({ idPrefix }: MenubarPanelStaticProps): React.JSX.Element => (
  <MenubarPanelView state={finalState} idPrefix={idPrefix} />
);
