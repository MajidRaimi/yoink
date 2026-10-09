import { presetFactRows, presetFacts, presetReachRows, PROVIDER_FACTS_SOURCE } from "./facts-model";
import { FactsSection } from "./facts-section";
import { FactsTable } from "./facts-table";

export type ProviderFactsProps = {
  id: string;
};

export const ProviderFacts = ({ id }: ProviderFactsProps): React.JSX.Element => {
  const { label } = presetFacts(id);
  return (
    <FactsSection source={PROVIDER_FACTS_SOURCE}>
      <FactsTable
        caption={`${label} preset facts`}
        header={["Fact", "Value"]}
        rows={presetFactRows(id).map((row) => [row.label, row.value] as const)}
      />
      <FactsTable
        caption={`Harnesses the ${label} preset reaches`}
        header={["Harness", "With this preset"]}
        rows={presetReachRows(id).map((row) => [row.label, row.note] as const)}
      />
    </FactsSection>
  );
};
