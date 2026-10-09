import type { Step } from "@/shared/contract";

const down: Step["event"] = { type: "key", key: "down" };
const enter: Step["event"] = { type: "key", key: "enter" };

export const script: readonly Step[] = [
  { wait: 1100, event: down },
  { wait: 550, event: down },
  { wait: 900, event: enter },
  { wait: 1800, event: down },
  { wait: 450, event: down },
  { wait: 450, event: down },
  { wait: 450, event: down },
  { wait: 900, event: enter },
];
