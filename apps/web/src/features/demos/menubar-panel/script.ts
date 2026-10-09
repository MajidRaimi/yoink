import type { DemoKey, Step } from "@/shared/contract";

const press = (key: DemoKey, wait: number): Step => ({ wait, event: { type: "key", key } });

export const menubarPanelScript: readonly Step[] = [
  press("down", 900),
  press("enter", 700),
  press("enter", 1500),
  press("down", 1300),
  press("down", 450),
  press("enter", 800),
  press("down", 1100),
  press("down", 350),
  press("down", 350),
  press("space", 800),
  press("escape", 1600),
];
