import type { Metadata } from "next";
import { JsonLd, webPageGraph } from "@/features/seo/json-ld";
import { pageMetadata } from "@/features/seo/metadata";
import { pageDates } from "@/features/seo/page-dates";
import { DOWNLOAD_TITLE, DownloadPage } from "@/features/download/components/download-page";
import { canonicalPath, routes } from "@/shared/lib/routes";

const path = canonicalPath(routes.download);

const DOWNLOAD_SEO_TITLE = "Download Yoink: Mac menu bar app and AI coding CLI";

const DOWNLOAD_SEO_DESCRIPTION =
  "Download the Yoink menu bar app for macOS 12+ (Apple Silicon or Intel), or install the CLI on macOS, Linux and Windows with curl, PowerShell or npm.";

export const metadata: Metadata = pageMetadata({
  title: DOWNLOAD_TITLE,
  seoTitle: DOWNLOAD_SEO_TITLE,
  description: DOWNLOAD_SEO_DESCRIPTION,
  path,
});

const DownloadRoute = (): React.JSX.Element => (
  <>
    <JsonLd
      data={webPageGraph({
        title: DOWNLOAD_SEO_TITLE,
        description: DOWNLOAD_SEO_DESCRIPTION,
        path,
        dates: pageDates(path),
        breadcrumbs: [
          { name: "Home", path: canonicalPath(routes.home) },
          { name: DOWNLOAD_TITLE, path },
        ],
      })}
    />
    <DownloadPage />
  </>
);

export default DownloadRoute;
