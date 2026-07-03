import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { docsFlat } from "@/lib/navigation";

export const dynamic = "force-static";

const withTrailingSlash = (path: string) => (path.endsWith("/") ? path : `${path}/`);

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes = [
    { path: "/", priority: 1 },
    { path: "/docs/", priority: 0.7 },
    ...docsFlat.map((doc) => ({
      path: withTrailingSlash(doc.href),
      priority: doc.href === "/reference" ? 0.6 : 0.8,
    })),
  ];

  return routes.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}
