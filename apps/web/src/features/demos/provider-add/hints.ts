import type { DemoHint } from "@/features/demos/engine/demo-frame";
import type { Phase } from "@/features/demos/provider-add/machine";

const MOVE: DemoHint = { keys: ["↑", "↓"], action: "move" };
const CONFIRM: DemoHint = { keys: ["Enter"], action: "confirm" };
const TOGGLE: DemoHint = { keys: ["Space"], action: "toggle" };

export const PHASE_HINTS: Readonly<Record<Phase, readonly DemoHint[]>> = {
  preset: [MOVE, CONFIRM],
  key: [{ keys: ["abc"], action: "key" }, CONFIRM],
  models: [TOGGLE, CONFIRM],
  harnesses: [TOGGLE, CONFIRM],
  claudeDefault: [MOVE, CONFIRM],
  default: [MOVE, CONFIRM],
  done: [{ keys: ["Enter"], action: "edit models" }],
  cancelled: [{ keys: ["Enter"], action: "start over" }],
};
