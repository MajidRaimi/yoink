import type { PageDates } from "./last-modified";
import { canonicalUrl } from "./metadata";
import {
  authorNode,
  ENTITY_IDS,
  idRef,
  ogImageUrl,
  softwareApplicationNode,
  subpageEntityNodes,
  webSiteNode,
  type JsonLdNode,
  type JsonLdValue,
} from "./entities";

export type { JsonLdNode, JsonLdValue };

export type JsonLdGraph = {
  readonly "@context": string;
  readonly "@graph": readonly JsonLdNode[];
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type PageLdInput = {
  title: string;
  description: string;
  path: string;
  dates: PageDates;
};

export type BreadcrumbPageLdInput = PageLdInput & {
  breadcrumbs: readonly BreadcrumbItem[];
};

export type WebPageType = "WebPage" | "CollectionPage" | "FAQPage";

export type FaqLdItem = {
  question: string;
  answer: string;
};

export type ListLdItem = {
  name: string;
  url: string;
};

export type WebPageLdInput = BreadcrumbPageLdInput & {
  pageType?: WebPageType;
};

const SCHEMA_CONTEXT = "https://schema.org";

const LANGUAGE = "en";

export const serializeJsonLd = (data: JsonLdGraph | JsonLdNode): string =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export const graphLd = (nodes: readonly JsonLdNode[]): JsonLdGraph => ({ "@context": SCHEMA_CONTEXT, "@graph": nodes });

const breadcrumbId = (path: string): string => `${canonicalUrl(path)}#breadcrumb`;

export const breadcrumbNode = (path: string, items: readonly BreadcrumbItem[]): JsonLdNode => ({
  "@type": "BreadcrumbList",
  "@id": breadcrumbId(path),
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: canonicalUrl(item.path),
  })),
});

const webPageNode = ({ title, description, path, dates, pageType = "WebPage" }: Omit<WebPageLdInput, "breadcrumbs">): JsonLdNode => ({
  "@type": pageType,
  "@id": canonicalUrl(path),
  url: canonicalUrl(path),
  name: title,
  description,
  inLanguage: LANGUAGE,
  isPartOf: idRef(ENTITY_IDS.website),
  about: idRef(ENTITY_IDS.software),
  primaryImageOfPage: { "@type": "ImageObject", url: ogImageUrl(path) },
  datePublished: dates.published,
  dateModified: dates.modified,
});

export const techArticleNode = ({ title, description, path, dates }: PageLdInput): JsonLdNode => ({
  "@type": "TechArticle",
  "@id": `${canonicalUrl(path)}#article`,
  headline: title,
  description,
  url: canonicalUrl(path),
  mainEntityOfPage: canonicalUrl(path),
  image: ogImageUrl(path),
  datePublished: dates.published,
  dateModified: dates.modified,
  inLanguage: LANGUAGE,
  author: idRef(ENTITY_IDS.author),
  publisher: idRef(ENTITY_IDS.author),
  isPartOf: idRef(ENTITY_IDS.website),
  about: idRef(ENTITY_IDS.software),
});

export const homeGraph = (input: Omit<PageLdInput, "path">): JsonLdGraph =>
  graphLd([authorNode(), softwareApplicationNode(), webSiteNode(), webPageNode({ ...input, path: "/" })]);

export const webPageGraph = ({ breadcrumbs, ...page }: WebPageLdInput): JsonLdGraph =>
  graphLd([{ ...webPageNode(page), breadcrumb: idRef(breadcrumbId(page.path)) }, breadcrumbNode(page.path, breadcrumbs), ...subpageEntityNodes()]);

const questionNodes = (items: readonly FaqLdItem[]): readonly JsonLdNode[] =>
  items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));

export const faqNode = (path: string, items: readonly FaqLdItem[]): JsonLdNode => ({
  "@type": "FAQPage",
  "@id": `${canonicalUrl(path)}#faq`,
  url: canonicalUrl(path),
  isPartOf: idRef(ENTITY_IDS.website),
  mainEntity: questionNodes(items),
});

export const itemListNode = (path: string, items: readonly ListLdItem[]): JsonLdNode => ({
  "@type": "ItemList",
  "@id": `${canonicalUrl(path)}#tools`,
  itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, url: item.url })),
});

export const techArticleGraph = ({ breadcrumbs, ...page }: BreadcrumbPageLdInput, extra: readonly JsonLdNode[] = []): JsonLdGraph =>
  graphLd([techArticleNode(page), breadcrumbNode(page.path, breadcrumbs), ...extra, ...subpageEntityNodes()]);

export const faqPageGraph = ({ breadcrumbs, items, ...page }: BreadcrumbPageLdInput & { items: readonly FaqLdItem[] }): JsonLdGraph =>
  graphLd([
    { ...webPageNode({ ...page, pageType: "FAQPage" }), breadcrumb: idRef(breadcrumbId(page.path)), mainEntity: questionNodes(items) },
    breadcrumbNode(page.path, breadcrumbs),
    ...subpageEntityNodes(),
  ]);

export type JsonLdProps = {
  data: JsonLdGraph;
};

export const JsonLd = ({ data }: JsonLdProps): React.JSX.Element => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
);
