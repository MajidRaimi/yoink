import type { MetadataRoute } from "next";
import { site } from "@/shared/brand/site";
import { themeColors } from "@/shared/ui/theme/theme-colors";

export const dynamic = "force-static";

const manifest = (): MetadataRoute.Manifest => ({
  id: "/",
  name: site.title,
  short_name: site.name,
  description: site.description,
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: themeColors.dark,
  theme_color: themeColors.dark,
  categories: ["developer", "productivity", "utilities"],
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
});

export default manifest;
