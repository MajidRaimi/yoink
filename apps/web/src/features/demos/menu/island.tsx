"use client";

import { useId } from "react";
import type { DemoIslandProps } from "@/features/demos/linked/types";
import { useMenuDemo } from "@/features/demos/menu/use-menu-demo";
import { MenuView } from "@/features/demos/menu/view";

const MenuIsland = ({ linked = false }: DemoIslandProps): React.JSX.Element => {
  const idPrefix = useId();
  const { state, controls } = useMenuDemo(linked);
  return <MenuView state={state} idPrefix={idPrefix} controls={controls} />;
};

export default MenuIsland;
