import type { Metadata } from "next";
import { JsonLd, techArticleGraph } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { pageDates } from "@/features/seo/page-dates";
import { REFERENCE_TITLE } from "@/features/reference/components/reference-page";
import { canonicalPath, routes } from "@/shared/lib/routes";
import { ReferenceDocView } from "./_components/reference-doc-view";

const path = canonicalPath(routes.reference);

const REFERENCE_SEO_TITLE = "Yoink CLI reference: every command, flag and alias";

const REFERENCE_SEO_DESCRIPTION =
  "Every yoink command, alias and flag with an example: add, use, connect, import, models, probe. Plus the menu keymap and harness, tool and preset ids.";

export const metadata: Metadata = pageMetadata({
  title: REFERENCE_TITLE,
  seoTitle: REFERENCE_SEO_TITLE,
  description: REFERENCE_SEO_DESCRIPTION,
  path,
  type: "article",
});

const ReferenceRoute = (): React.JSX.Element => (
  <>
    <JsonLd
      data={techArticleGraph({
        title: REFERENCE_TITLE,
        description: REFERENCE_SEO_DESCRIPTION,
        path,
        dates: pageDates(path),
        breadcrumbs: [
          { name: "Home", path: "/" },
          { name: "Docs", path: canonicalPath(routes.docs) },
          { name: REFERENCE_TITLE, path },
        ],
      })}
    />
    <ReferenceDocView />
  </>
);

export default ReferenceRoute;
