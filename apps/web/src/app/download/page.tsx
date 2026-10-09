import type { Metadata } from "next";
import { JsonLd, breadcrumbLd, softwareApplicationLd } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { DOWNLOAD_DESCRIPTION, DOWNLOAD_TITLE, DownloadPage } from "@/features/download/components/download-page";
import { canonicalPath, routes } from "@/shared/lib/routes";

const path = canonicalPath(routes.download);

export const metadata: Metadata = pageMetadata({
  title: DOWNLOAD_TITLE,
  description: DOWNLOAD_DESCRIPTION,
  path,
});

const DownloadRoute = (): React.JSX.Element => (
  <>
    <JsonLd data={softwareApplicationLd()} />
    <JsonLd
      data={breadcrumbLd([
        { name: "Home", path: canonicalPath(routes.home) },
        { name: DOWNLOAD_TITLE, path },
      ])}
    />
    <DownloadPage />
  </>
);

export default DownloadRoute;
