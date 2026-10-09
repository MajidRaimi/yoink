import { computeFinal } from "@/features/demos/engine/frames";
import { menuDefinition } from "@/features/demos/menu/definition";
import { MenuView } from "@/features/demos/menu/view";

const FINAL_STATE = computeFinal(menuDefinition);

type MenuStaticProps = {
  idPrefix: string;
};

export const MenuStatic = ({ idPrefix }: MenuStaticProps): React.JSX.Element => (
  <MenuView state={FINAL_STATE} idPrefix={idPrefix} />
);
