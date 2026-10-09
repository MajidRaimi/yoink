import { DOC_SLUGS, docPath, withTrailingSlash, type DocSlug } from "@/shared/lib/routes";
import { lastModified, type PageDates } from "./last-modified";

const WEB_SRC = "apps/web/src";

export const docSource = (slug: DocSlug): string => `docs/${slug}.md`;

const PAGE_SOURCES: Readonly<Record<string, readonly string[]>> = {
  "/": [`${WEB_SRC}/features/landing`, `${WEB_SRC}/app/page.tsx`, `${WEB_SRC}/shared/brand/site.ts`],
  "/download/": [`${WEB_SRC}/features/download`, `${WEB_SRC}/app/download`],
  "/docs/": [
    `${WEB_SRC}/features/docs/components/docs-index-view.tsx`,
    `${WEB_SRC}/app/docs/page.tsx`,
    ...DOC_SLUGS.map(docSource),
  ],
  "/reference/": [`${WEB_SRC}/features/reference`, `${WEB_SRC}/app/reference`],
  ...Object.fromEntries(DOC_SLUGS.map((slug) => [docPath(slug), [docSource(slug), `${WEB_SRC}/app/docs/[slug]/page.tsx`]])),
};

export const pageSources = (path: string): readonly string[] => PAGE_SOURCES[withTrailingSlash(path)] ?? [];

export const pageDates = (path: string): PageDates => lastModified(pageSources(path));
