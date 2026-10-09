import type { MetadataRoute } from "next";
import { site } from "@/shared/brand/site";

export const dynamic = "force-static";

const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: "*", allow: "/" }],
  sitemap: `${site.url}/sitemap.xml`,
  host: site.url,
});

export default robots;
