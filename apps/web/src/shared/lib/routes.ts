import type { Route } from "next";

export const DOC_SLUGS = [
  "getting-started",
  "desktop",
  "interactive-menu",
  "subscriptions",
  "providers",
  "harnesses",
  "how-it-works",
  "security",
  "usage",
] as const;

export type DocSlug = (typeof DOC_SLUGS)[number];

export const DOC_ALIASES = {
  "external-providers": "providers",
  "menu-bar": "desktop",
} as const satisfies Readonly<Record<string, DocSlug>>;

export type DocAlias = keyof typeof DOC_ALIASES;

export const routes = {
  home: "/",
  download: "/download",
  reference: "/reference",
  docs: "/docs",
  install: "/#install",
  compare: "/compare",
  faq: "/faq",
} as const satisfies Readonly<Record<string, Route>>;

export const CONTENT_COLLECTION_IDS = ["guides", "harnesses", "providers", "compare", "faq"] as const;

export type ContentCollectionId = (typeof CONTENT_COLLECTION_IDS)[number];

export type CollectionId = "docs" | ContentCollectionId;

export const COLLECTION_ROUTE_BASES: Readonly<Record<CollectionId, string>> = {
  docs: "/docs/",
  guides: "/guides/",
  harnesses: "/harnesses/",
  providers: "/providers/",
  compare: "/compare/",
  faq: "/faq/",
};

export const COMPARE_INDEX_SLUG = "index";

export const FAQ_SLUG = "faq";

export const GUIDES_HUB_HREF = "/docs/#guides" as Route;

export const COLLECTION_ALIAS_TARGETS = {
  guides: GUIDES_HUB_HREF,
  harnesses: "/docs/harnesses/" as Route,
  providers: "/docs/providers/" as Route,
} as const satisfies Readonly<Partial<Record<ContentCollectionId, Route>>>;

export type CollectionAlias = keyof typeof COLLECTION_ALIAS_TARGETS;

export const isDocSlug = (value: string): value is DocSlug => (DOC_SLUGS as readonly string[]).includes(value);

export const docHref = (slug: DocSlug): Route => `/docs/${slug}` as Route;

export const docAliasTarget = (alias: DocAlias): Route => docHref(DOC_ALIASES[alias]);

export const withTrailingSlash = (path: string): string => (path.endsWith("/") ? path : `${path}/`);

export const canonicalPath = (href: Route): string => withTrailingSlash(href.split("#")[0] ?? href);

export const docPath = (slug: DocSlug): string => `/docs/${slug}/`;

export const guideHref = (slug: string): Route => entryPath("guides", slug) as Route;

export const entryPath = (collection: CollectionId, slug: string): string => {
  if (collection === "faq") return COLLECTION_ROUTE_BASES.faq;
  if (collection === "compare" && slug === COMPARE_INDEX_SLUG) return COLLECTION_ROUTE_BASES.compare;
  return `${COLLECTION_ROUTE_BASES[collection]}${slug}/`;
};

export const entryHref = (collection: CollectionId, slug: string): Route => entryPath(collection, slug) as Route;

export const STATIC_PAGE_PATHS: readonly string[] = [
  "/",
  "/download/",
  "/docs/",
  "/reference/",
  ...DOC_SLUGS.map(docPath),
];

export const absoluteUrl = (base: string, path: string): string => new URL(path, base).toString();
