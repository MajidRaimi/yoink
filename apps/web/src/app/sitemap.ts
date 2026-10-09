import type { MetadataRoute } from "next";
import { site } from "@/shared/brand/site";
import { INDEXABLE_PATHS } from "@/shared/lib/routes";

export const dynamic = "force-static";

const priorityFor = (path: string): number => {
  if (path === "/") return 1;
  if (path === "/download/") return 0.8;
  if (path === "/reference/") return 0.6;
  return 0.7;
};

const sitemap = (): MetadataRoute.Sitemap => {
  const lastModified = new Date();
  return INDEXABLE_PATHS.map((path) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: priorityFor(path),
  }));
};

export default sitemap;
