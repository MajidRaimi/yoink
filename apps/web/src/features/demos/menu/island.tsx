"use client";

import { useMenuDemo } from "@/features/demos/menu/use-menu-demo";
import { MenuView } from "@/features/demos/menu/view";

const MenuIsland = (): React.JSX.Element => {
  const { state, controls } = useMenuDemo();
  return <MenuView state={state} controls={controls} />;
};

export default MenuIsland;
