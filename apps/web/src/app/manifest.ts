import type { MetadataRoute } from "next";
import { site } from "@/shared/brand/site";

export const dynamic = "force-static";

const manifest = (): MetadataRoute.Manifest => ({
  name: site.title,
  short_name: site.name,
  description: site.description,
  start_url: "/",
  display: "standalone",
  background_color: "#0a0908",
  theme_color: "#0a0908",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
  ],
});

export default manifest;
