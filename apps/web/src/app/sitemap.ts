import type { MetadataRoute } from "next";
import { canonicalUrl } from "@/features/seo/metadata";
import { INDEXABLE_PATHS } from "@/shared/lib/routes";

export const dynamic = "force-static";

const priorityFor = (path: string): number => {
  if (path === "/") return 1;
  if (path === "/download/") return 0.9;
  if (path === "/docs/") return 0.8;
  if (path === "/reference/") return 0.7;
  return 0.6;
};

const sitemap = (): MetadataRoute.Sitemap =>
  INDEXABLE_PATHS.map((path) => ({
    url: canonicalUrl(path),
    changeFrequency: "weekly",
    priority: priorityFor(path),
  }));

export default sitemap;
