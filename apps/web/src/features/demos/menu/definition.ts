import type { DemoDefinition } from "@/shared/contract";
import { initial, reduce, type MenuState } from "@/features/demos/menu/machine";
import { script } from "@/features/demos/menu/script";

export const menuDefinition: DemoDefinition<MenuState> = {
  id: "menu",
  label: "Interactive yoink menu",
  initial,
  reduce,
  script,
};
