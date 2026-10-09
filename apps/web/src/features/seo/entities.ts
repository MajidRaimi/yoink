import { site } from "@/shared/brand/site";
import { canonicalUrl } from "./metadata";

export type JsonLdValue = string | number | boolean | null | readonly JsonLdValue[] | JsonLdNode;

export type JsonLdNode = { readonly [key: string]: JsonLdValue };

const SITE_ROOT = canonicalUrl("/");

export const ENTITY_IDS = {
  author: `${SITE_ROOT}#author`,
  software: `${SITE_ROOT}#software`,
  website: `${SITE_ROOT}#website`,
} as const;

export const CROSS_PAGE_ENTITY_IDS: ReadonlySet<string> = new Set([ENTITY_IDS.software]);

export const idRef = (id: string): JsonLdNode => ({ "@id": id });

export const ogImageUrl = (path: string): string => `${canonicalUrl(path)}opengraph-image.png`;

export const SOFTWARE_ALTERNATE_NAMES: readonly string[] = [
  "Yoink CLI",
  site.qualifiedName,
  site.npmPackage,
  new URL(site.url).host,
];

export const SOFTWARE_SUBCATEGORY = "AI coding account switcher and provider manager";

export const SOFTWARE_FEATURES: readonly string[] = [
  "Switch Claude Code accounts (macOS Keychain or ~/.claude/.credentials.json)",
  "Switch ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins",
  "Connect API-key providers to 13 coding harnesses",
  "Presets: OpenAI, Kimi Code, Moonshot, OpenRouter, DeepSeek, z.ai, Ollama",
  "Endpoint probing for any OpenAI- or Anthropic-compatible URL",
  "Import providers already configured in harnesses",
  "Asks before writing keys into git-tracked configs; scripted commands refuse without --allow-tracked",
  "macOS menu bar app",
];

export const authorNode = (): JsonLdNode => ({
  "@type": "Person",
  "@id": ENTITY_IDS.author,
  name: site.author,
  url: site.authorUrl,
  sameAs: [site.authorUrl],
});

export const softwareApplicationNode = (): JsonLdNode => ({
  "@type": "SoftwareApplication",
  "@id": ENTITY_IDS.software,
  name: site.name,
  alternateName: SOFTWARE_ALTERNATE_NAMES,
  description: site.metaDescription,
  url: SITE_ROOT,
  image: ogImageUrl("/"),
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: SOFTWARE_SUBCATEGORY,
  operatingSystem: "macOS, Linux, Windows",
  softwareVersion: site.version,
  featureList: SOFTWARE_FEATURES,
  downloadUrl: canonicalUrl("/download/"),
  installUrl: `${SITE_ROOT}#install`,
  license: site.licenseUrl,
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  sameAs: [site.repo, site.npmUrl],
  author: idRef(ENTITY_IDS.author),
  publisher: idRef(ENTITY_IDS.author),
});

export const webSiteNode = (): JsonLdNode => ({
  "@type": "WebSite",
  "@id": ENTITY_IDS.website,
  name: site.name,
  alternateName: site.qualifiedName,
  url: SITE_ROOT,
  description: site.description,
  inLanguage: "en",
  about: idRef(ENTITY_IDS.software),
  publisher: idRef(ENTITY_IDS.author),
});

export const webSiteSummaryNode = (): JsonLdNode => ({
  "@type": "WebSite",
  "@id": ENTITY_IDS.website,
  name: site.name,
  url: SITE_ROOT,
});

export const subpageEntityNodes = (): readonly JsonLdNode[] => [authorNode(), webSiteSummaryNode()];
