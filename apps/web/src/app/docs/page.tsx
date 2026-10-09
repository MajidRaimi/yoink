import type { Metadata } from "next";
import { DOCS_INDEX_TITLE, DocsIndexView } from "@/features/docs/components/docs-index-view";
import { JsonLd, webPageGraph } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { pageDates } from "@/features/seo/page-dates";
import { canonicalPath, routes } from "@/shared/lib/routes";

const path = canonicalPath(routes.docs);

const DOCS_SEO_TITLE = "Yoink docs: switch AI coding accounts and connect providers";

const DOCS_DESCRIPTION =
  "Yoink documentation: install the CLI or Mac app, switch Claude Code and subscription logins, connect API keys to 13 harnesses, and see every file it writes.";

export const metadata: Metadata = pageMetadata({ title: DOCS_INDEX_TITLE, seoTitle: DOCS_SEO_TITLE, description: DOCS_DESCRIPTION, path });

const DocsIndexPage = (): React.JSX.Element => (
  <>
    <JsonLd
      data={webPageGraph({
        title: DOCS_INDEX_TITLE,
        description: DOCS_DESCRIPTION,
        path,
        dates: pageDates(path),
        pageType: "CollectionPage",
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Docs", path },
        ],
      })}
    />
    <DocsIndexView />
  </>
);

export default DocsIndexPage;
