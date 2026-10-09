import { computeFinal } from "@/features/demos/engine/frames";
import { menuDefinition } from "@/features/demos/menu/definition";
import { MenuView } from "@/features/demos/menu/view";

const FINAL_STATE = computeFinal(menuDefinition);

export const MenuStatic = (): React.JSX.Element => <MenuView state={FINAL_STATE} idPrefix="menu-static" />;
