import type { MetadataRoute } from "next";
import { site } from "@/shared/brand/site";

export const dynamic = "force-static";

const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
];

const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: "*", allow: "/" }, ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/" }))],
  sitemap: `${site.url}/sitemap.xml`,
});

export default robots;
