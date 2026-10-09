import { site } from "@/shared/brand/site";
import { canonicalUrl } from "./metadata";

export type JsonLdValue = string | number | boolean | null | readonly JsonLdValue[] | { readonly [key: string]: JsonLdValue };

export type JsonLdDocument = { readonly [key: string]: JsonLdValue };

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type TechArticleInput = {
  title: string;
  description: string;
  path: string;
};

const SCHEMA_CONTEXT = "https://schema.org";

const author: JsonLdDocument = { "@type": "Person", name: site.author, url: site.repo };

export const serializeJsonLd = (data: JsonLdDocument): string =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const softwareApplicationLd = (): JsonLdDocument => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "SoftwareApplication",
  name: site.name,
  description: site.description,
  url: canonicalUrl("/"),
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  softwareVersion: site.version,
  downloadUrl: canonicalUrl("/download/"),
  installUrl: `${canonicalUrl("/")}#install`,
  license: "https://opensource.org/licenses/MIT",
  codeRepository: site.repo,
  author,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
});

export const webSiteLd = (): JsonLdDocument => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "WebSite",
  name: site.name,
  url: canonicalUrl("/"),
  description: site.description,
  inLanguage: "en",
  publisher: author,
});

export const techArticleLd = ({ title, description, path }: TechArticleInput): JsonLdDocument => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "TechArticle",
  headline: title,
  description,
  url: canonicalUrl(path),
  mainEntityOfPage: canonicalUrl(path),
  inLanguage: "en",
  author,
  publisher: author,
  about: { "@type": "SoftwareApplication", name: site.name, url: canonicalUrl("/") },
});

export const breadcrumbLd = (items: readonly BreadcrumbItem[]): JsonLdDocument => ({
  "@context": SCHEMA_CONTEXT,
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: canonicalUrl(item.path),
  })),
});

export type JsonLdProps = {
  data: JsonLdDocument;
};

export const JsonLd = ({ data }: JsonLdProps): React.JSX.Element => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
);
