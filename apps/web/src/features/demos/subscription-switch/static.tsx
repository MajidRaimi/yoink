import { computeFinal } from "@/features/demos/engine/frames";
import { subscriptionSwitchDemo } from "@/features/demos/subscription-switch/definition";
import { SubscriptionSwitchView } from "@/features/demos/subscription-switch/view";

const FINAL_STATE = computeFinal(subscriptionSwitchDemo);

export const SubscriptionSwitchStatic = (): React.JSX.Element => (
  <SubscriptionSwitchView state={FINAL_STATE} idPrefix="subscription-switch-static" />
);
