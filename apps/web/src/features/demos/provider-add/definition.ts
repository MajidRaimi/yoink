import type { DemoDefinition } from "@/shared/contract";
import { initial, reduce, type State } from "@/features/demos/provider-add/machine";
import { script } from "@/features/demos/provider-add/script";

export const providerAddDemo: DemoDefinition<State> = {
  id: "provider-add",
  label: "Add a provider and connect it to harnesses",
  initial,
  reduce,
  script,
};
