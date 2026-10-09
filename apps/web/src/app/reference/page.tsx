import type { Metadata } from "next";
import { JsonLd, breadcrumbLd, techArticleLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { REFERENCE_DESCRIPTION, REFERENCE_TITLE, ReferencePage } from "@/features/reference/components/reference-page";
import { canonicalPath, routes } from "@/shared/lib/routes";

const path = canonicalPath(routes.reference);

export const metadata: Metadata = pageMetadata({
  title: REFERENCE_TITLE,
  description: REFERENCE_DESCRIPTION,
  path,
  type: "article",
});

const ReferenceRoute = (): React.JSX.Element => (
  <>
    <JsonLd data={techArticleLd({ title: REFERENCE_TITLE, description: REFERENCE_DESCRIPTION, path })} />
    <JsonLd
      data={breadcrumbLd([
        { name: "Home", path: "/" },
        { name: REFERENCE_TITLE, path },
      ])}
    />
    <ReferencePage />
  </>
);

export default ReferenceRoute;
