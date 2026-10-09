import type { ComponentPropsWithoutRef } from "react";

export type DocTableProps = ComponentPropsWithoutRef<"table">;

export const DocTable = (props: DocTableProps): React.JSX.Element => (
  <div className="doc-table focus-visible:focus-ring" role="group" aria-label="Scrollable table" tabIndex={0}>
    <table {...props} />
  </div>
);
