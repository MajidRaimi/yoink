import { computeFinal } from "@/features/demos/engine/frames";
import { subscriptionSwitchDemo } from "@/features/demos/subscription-switch/definition";
import { SubscriptionSwitchView } from "@/features/demos/subscription-switch/view";

const FINAL_STATE = computeFinal(subscriptionSwitchDemo);

type SubscriptionSwitchStaticProps = {
  idPrefix: string;
};

export const SubscriptionSwitchStatic = ({ idPrefix }: SubscriptionSwitchStaticProps): React.JSX.Element => (
  <SubscriptionSwitchView state={FINAL_STATE} idPrefix={idPrefix} />
);
