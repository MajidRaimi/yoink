import type { Metadata } from "next";
import { DocsIndexView } from "@/features/docs/components/docs-index-view";
import { JsonLd, breadcrumbLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { canonicalPath, routes } from "@/shared/lib/routes";

const path = canonicalPath(routes.docs);

const DOCS_DESCRIPTION =
  "Guides for yoink: install the CLI or the menu bar app, switch accounts and subscription logins, connect providers to 13 harnesses, and see every file it writes.";

export const metadata: Metadata = pageMetadata({ title: "Docs", description: DOCS_DESCRIPTION, path });

const DocsIndexPage = (): React.JSX.Element => (
  <>
    <JsonLd
      data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Docs", path },
      ])}
    />
    <DocsIndexView />
  </>
);

export default DocsIndexPage;
