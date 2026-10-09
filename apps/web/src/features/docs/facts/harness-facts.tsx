import { harnessFactRows, harnessFacts, HARNESS_FACTS_SOURCE } from "./facts-model";
import { FactsSection } from "./facts-section";
import { FactsTable } from "./facts-table";

export type HarnessFactsProps = {
  id: string;
};

export const HarnessFacts = ({ id }: HarnessFactsProps): React.JSX.Element => (
  <FactsSection source={HARNESS_FACTS_SOURCE}>
    <FactsTable
      caption={`${harnessFacts(id).label} facts`}
      header={["Fact", "Value"]}
      rows={harnessFactRows(id).map((row) => [row.label, row.value] as const)}
    />
  </FactsSection>
);
