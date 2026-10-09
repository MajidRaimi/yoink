import { computeFinal } from "@/features/demos/engine/frames";
import { providerAddDemo } from "@/features/demos/provider-add/definition";
import { statusText } from "@/features/demos/provider-add/selectors";
import { ProviderAddView } from "@/features/demos/provider-add/view";

const finalState = computeFinal(providerAddDemo);

type ProviderAddStaticProps = {
  idPrefix: string;
};

export const ProviderAddStatic = ({ idPrefix }: ProviderAddStaticProps): React.JSX.Element => (
  <ProviderAddView state={finalState} status={statusText(finalState)} idPrefix={idPrefix} />
);
