import type { DemoEvent, DemoKey, Step } from "@/shared/contract";

const press = (key: DemoKey): DemoEvent => ({ type: "key", key });

export const script: readonly Step[] = [
  { wait: 900, event: press("down") },
  { wait: 700, event: press("enter") },
  { wait: 2400, event: press("right") },
  { wait: 700, event: press("down") },
  { wait: 800, event: press("space") },
  { wait: 800, event: press("enter") },
  { wait: 1800, event: press("enter") },
  { wait: 1500, event: press("space") },
  { wait: 800, event: press("enter") },
];
