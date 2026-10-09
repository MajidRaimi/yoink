import type { DemoHint } from "@/features/demos/engine/demo-frame";

export const BROWSE_HINTS: readonly DemoHint[] = [
  { keys: ["←", "→"], action: "tool" },
  { keys: ["↑", "↓"], action: "login" },
  { keys: ["Enter"], action: "switch" },
  { keys: ["Space"], action: "toggle running" },
];

export const CONFIRM_HINTS: readonly DemoHint[] = [
  { keys: ["←", "→"], action: "choose" },
  { keys: ["Enter"], action: "answer" },
  { keys: ["Esc"], action: "cancel" },
];
