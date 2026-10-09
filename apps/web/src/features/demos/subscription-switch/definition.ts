import type { DemoDefinition } from "@/shared/contract";
import { initial, reduce, type SwitchState } from "@/features/demos/subscription-switch/machine";
import { script } from "@/features/demos/subscription-switch/script";

export const subscriptionSwitchDemo: DemoDefinition<SwitchState> = {
  id: "subscription-switch",
  label: "Switch Claude Code and subscription logins",
  initial,
  reduce,
  script,
};
