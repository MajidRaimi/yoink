import type { DemoKey, Step } from "@/shared/contract";

const press = (key: DemoKey, wait: number): Step => ({ wait, event: { type: "key", key } });

const type = (value: string, wait: number): Step => ({ wait, event: { type: "text", value } });

export const DEMO_KEY_PARTS = ["sk-or-v1-", "demo", "-key"] as const;

export const DEMO_KEY = DEMO_KEY_PARTS.join("");

export const script: readonly Step[] = [
  press("down", 700),
  press("down", 350),
  press("down", 350),
  press("enter", 600),
  type(DEMO_KEY_PARTS[0], 700),
  type(DEMO_KEY_PARTS[1], 400),
  type(DEMO_KEY_PARTS[2], 400),
  press("enter", 600),
  press("space", 900),
  press("down", 400),
  press("space", 400),
  type("deep", 600),
  press("space", 600),
  press("enter", 700),
  press("down", 800),
  press("space", 350),
  press("down", 350),
  press("down", 350),
  press("space", 350),
  press("down", 350),
  press("space", 350),
  press("enter", 700),
  press("enter", 900),
];
