import { DocTable } from "../components/doc-table";
import { InlineCodeText } from "./inline-code-text";

export type FactsTableProps = {
  caption: string;
  header: readonly [string, string];
  rows: readonly (readonly [string, string])[];
};

export const FactsTable = ({ caption, header, rows }: FactsTableProps): React.JSX.Element => (
  <DocTable>
    <caption className="sr-only">{caption}</caption>
    <thead>
      <tr>
        <th scope="col">{header[0]}</th>
        <th scope="col">{header[1]}</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(([label, value]) => (
        <tr key={label}>
          <th scope="row">
            <InlineCodeText text={label} />
          </th>
          <td>
            <InlineCodeText text={value} />
          </td>
        </tr>
      ))}
    </tbody>
  </DocTable>
);
