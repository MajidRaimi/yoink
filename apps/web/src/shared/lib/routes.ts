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
} as const satisfies Readonly<Record<string, Route>>;

export const isDocSlug = (value: string): value is DocSlug => (DOC_SLUGS as readonly string[]).includes(value);

export const docHref = (slug: DocSlug): Route => `/docs/${slug}` as Route;

export const docAliasTarget = (alias: DocAlias): Route => docHref(DOC_ALIASES[alias]);

export const withTrailingSlash = (path: string): string => (path.endsWith("/") ? path : `${path}/`);

export const canonicalPath = (href: Route): string => withTrailingSlash(href.split("#")[0] ?? href);

export const docPath = (slug: DocSlug): string => `/docs/${slug}/`;

export const INDEXABLE_PATHS: readonly string[] = [
  "/",
  "/download/",
  "/docs/",
  "/reference/",
  ...DOC_SLUGS.map(docPath),
];

export const absoluteUrl = (base: string, path: string): string => new URL(path, base).toString();
