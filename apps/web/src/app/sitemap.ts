import type { MetadataRoute } from "next";
import { indexablePaths } from "@/features/docs/collections";
import { canonicalUrl } from "@/features/seo/metadata";
import { pageDates } from "@/features/seo/page-dates";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap =>
  indexablePaths().map((path) => ({
    url: canonicalUrl(path),
    lastModified: pageDates(path).modified,
  }));

export default sitemap;
