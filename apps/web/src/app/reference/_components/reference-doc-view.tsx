import { DocToc } from "@/features/docs/components/doc-toc";
import { DocTocCollapsible } from "@/features/docs/components/doc-toc-collapsible";
import { CommandBrowser } from "@/features/reference/components/command-browser";
import {
  HarnessIdsSection,
  KeymapSection,
  PresetIdsSection,
  ToolIdsSection,
} from "@/features/reference/components/id-sections";
import { REFERENCE_TITLE } from "@/features/reference/components/reference-page";
import { docHref } from "@/shared/lib/routes";
import { InlineCode } from "@/shared/ui/code";
import { TextLink } from "@/shared/ui/link";
import { ReferenceBreadcrumb } from "./reference-breadcrumb";
import { REFERENCE_HEADINGS } from "./reference-headings";

export const ReferenceDocView = (): React.JSX.Element => (
  <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
    <article className="flex min-w-0 flex-col gap-8">
      <header className="flex max-w-[72ch] flex-col gap-4">
        <ReferenceBreadcrumb />
        <h1 className="display text-4xl">{REFERENCE_TITLE}</h1>
        <p className="text-lg text-muted">
          Every command the <InlineCode>yoink</InlineCode> binary accepts, grouped by what it works on. For walkthroughs
          and longer examples, see <TextLink href={docHref("usage")}>Usage</TextLink>.
        </p>
      </header>
      <DocTocCollapsible headings={REFERENCE_HEADINGS} className="xl:hidden" />
      <div className="flex min-w-0 flex-col gap-20">
        <CommandBrowser />
        <KeymapSection />
        <ToolIdsSection />
        <HarnessIdsSection />
        <PresetIdsSection />
      </div>
    </article>
    <aside aria-label="Table of contents" className="hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
        <DocToc headings={REFERENCE_HEADINGS} />
      </div>
    </aside>
  </div>
);
