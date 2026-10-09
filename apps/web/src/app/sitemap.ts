import type { MetadataRoute } from "next";
import { canonicalUrl } from "@/features/seo/metadata";
import { pageDates } from "@/features/seo/page-dates";
import { INDEXABLE_PATHS } from "@/shared/lib/routes";

export const dynamic = "force-static";

const sitemap = (): MetadataRoute.Sitemap =>
  INDEXABLE_PATHS.map((path) => ({
    url: canonicalUrl(path),
    lastModified: pageDates(path).modified,
  }));

export default sitemap;
