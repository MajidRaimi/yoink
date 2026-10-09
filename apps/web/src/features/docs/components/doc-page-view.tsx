import { DemoSlot } from "@/features/demos/demo-slot";
import { routes, type DocSlug } from "@/shared/lib/routes";
import { adjacentDocs, docMeta } from "../content";
import { docHeadings } from "../headings";
import { DocContent } from "../mdx/doc-content";
import { DocBreadcrumb } from "./doc-breadcrumb";
import { DocEditLink } from "./doc-edit-link";
import { DocPager } from "./doc-pager";
import { DocToc } from "./doc-toc";
import { DocTocCollapsible } from "./doc-toc-collapsible";

export type DocUpdatedDate = {
  iso: string;
  label: string;
};

export type DocPageViewProps = {
  slug: DocSlug;
  updated: DocUpdatedDate;
};

export const DocPageView = ({ slug, updated }: DocPageViewProps): React.JSX.Element => {
  const doc = docMeta(slug);
  const headings = docHeadings(slug);
  const hasToc = headings.length > 0;
  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="flex min-w-0 max-w-[72ch] flex-col gap-8">
        <header className="flex flex-col gap-4">
          <DocBreadcrumb items={[{ label: "Docs", href: routes.docs }, { label: doc.section }, { label: doc.nav }]} />
          <h1 className="display text-4xl">{doc.title}</h1>
          <p className="text-lg text-muted">{doc.description}</p>
          <p className="text-sm text-muted">
            Updated{" "}
            <bdi>
              <time dateTime={updated.iso}>{updated.label}</time>
            </bdi>
          </p>
        </header>
        {hasToc ? <DocTocCollapsible headings={headings} className="xl:hidden" /> : null}
        {doc.demo === undefined ? null : <DemoSlot id={doc.demo} />}
        <DocContent slug={slug} />
        <footer className="flex flex-col gap-6 border-t border-hairline pt-6">
          <DocEditLink repoPath={`docs/${slug}.md`} />
          <DocPager adjacent={adjacentDocs(slug)} />
        </footer>
      </article>
      {hasToc ? (
        <aside aria-label="Table of contents" className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6">
            <DocToc key={slug} headings={headings} />
          </div>
        </aside>
      ) : null}
    </div>
  );
};
