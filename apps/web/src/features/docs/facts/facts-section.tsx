import type { ReactNode } from "react";
import { AT_A_GLANCE_HEADING, AT_A_GLANCE_ID } from "./facts-model";

export type FactsSectionProps = {
  source: string;
  children: ReactNode;
};

export const FactsSection = ({ source, children }: FactsSectionProps): React.JSX.Element => (
  <section aria-labelledby={AT_A_GLANCE_ID} className="doc-prose">
    <h2 id={AT_A_GLANCE_ID}>
      <a href={`#${AT_A_GLANCE_ID}`} className="heading-anchor">
        {AT_A_GLANCE_HEADING}
      </a>
    </h2>
    {children}
    <p className="text-sm text-muted">Generated from the yoink CLI source and {source}.</p>
  </section>
);
