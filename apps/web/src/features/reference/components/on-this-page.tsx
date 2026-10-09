import { DocToc, DocTocCollapsible } from "@/features/docs/toc";
import type { DocHeading } from "@/shared/contract";
import { REFERENCE_SECTIONS } from "../sections";

const REFERENCE_HEADINGS: readonly DocHeading[] = REFERENCE_SECTIONS.map((section) => ({
  id: section.id,
  text: section.title,
  depth: 2,
}));

const RAIL_QUERY = "(min-width: 64rem)";

export const OnThisPage = (): React.JSX.Element => (
  <>
    <DocTocCollapsible headings={REFERENCE_HEADINGS} className="lg:hidden" />
    <div className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pb-6">
      <DocToc headings={REFERENCE_HEADINGS} activeQuery={RAIL_QUERY} />
    </div>
  </>
);
