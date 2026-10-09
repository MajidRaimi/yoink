import type { Route } from "next";
import type { EntryRef } from "../collections";
import { entryDocument } from "../entry-document";
import { entryBreadcrumbs, relatedEntries } from "../entry-navigation";
import { HarnessFacts } from "../facts/harness-facts";
import { ProviderFacts } from "../facts/provider-facts";
import { entryHeadings } from "../headings";
import { MarkdownContent } from "../mdx/doc-content";
import { DocBreadcrumb } from "./doc-breadcrumb";
import { DocEditLink } from "./doc-edit-link";
import type { DocUpdatedDate } from "./doc-page-view";
import { DocToc } from "./doc-toc";
import { DocTocCollapsible } from "./doc-toc-collapsible";
import { LastChecked } from "./last-checked";
import { RelatedLinks } from "./related-links";

export type EntryPageViewProps = {
  entryRef: EntryRef;
  updated: DocUpdatedDate;
};

export const EntryPageView = ({ entryRef, updated }: EntryPageViewProps): React.JSX.Element => {
  const { meta, parts, faqMode } = entryDocument(entryRef);
  const headings = entryHeadings(entryRef);
  const hasToc = headings.length > 0;
  const trail = entryBreadcrumbs(meta);
  const crumbs = (trail.length > 2 ? trail.slice(1) : trail).map((crumb, index, all) => ({
    label: crumb.name,
    ...(index < all.length - 1 ? { href: crumb.path as Route } : {}),
  }));
  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="flex min-w-0 max-w-[72ch] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <DocBreadcrumb items={crumbs} />
          <h1 className="display text-4xl">{meta.title}</h1>
          <LastChecked meta={meta} />
        </header>
        {parts === null ? null : <MarkdownContent source={entryRef} markdown={parts.leadMarkdown} className="doc-prose doc-lead" />}
        {hasToc ? <DocTocCollapsible headings={headings} className="xl:hidden" /> : null}
        {meta.harness === undefined ? null : <HarnessFacts id={meta.harness} />}
        {meta.preset === undefined ? null : <ProviderFacts id={meta.preset} />}
        {parts === null ? null : <MarkdownContent source={entryRef} markdown={parts.restMarkdown} faqMode={faqMode} />}
        <RelatedLinks entries={relatedEntries(meta)} />
        <footer className="flex flex-col gap-4 border-t border-hairline pt-6">
          <p className="text-sm text-muted">
            Updated{" "}
            <bdi>
              <time dateTime={updated.iso}>{updated.label}</time>
            </bdi>
          </p>
          <DocEditLink repoPath={meta.repoPath} />
        </footer>
      </article>
      {hasToc ? (
        <aside aria-label="Table of contents" className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
            <DocToc key={meta.path} headings={headings} />
          </div>
        </aside>
      ) : null}
    </div>
  );
};
