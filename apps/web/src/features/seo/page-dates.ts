import { entryForUrlPath, entryRepoPath } from "@/features/docs/collections";
import { DOC_SLUGS, docPath, withTrailingSlash, type DocSlug } from "@/shared/lib/routes";
import { lastModified, type PageDates } from "./last-modified";

const WEB_SRC = "apps/web/src";

const FACT_SOURCES: Readonly<Record<string, string>> = {
  harnesses: `${WEB_SRC}/features/demos/data/harness-facts.gen.ts`,
  providers: `${WEB_SRC}/features/demos/data/preset-facts.gen.ts`,
};

export const docSource = (slug: DocSlug): string => `docs/${slug}.md`;

const PAGE_SOURCES: Readonly<Record<string, readonly string[]>> = {
  "/": [`${WEB_SRC}/features/landing`, `${WEB_SRC}/app/page.tsx`, `${WEB_SRC}/shared/brand/site.ts`],
  "/download/": [`${WEB_SRC}/features/download`, `${WEB_SRC}/app/download`],
  "/docs/": [
    `${WEB_SRC}/features/docs/components/docs-index-view.tsx`,
    `${WEB_SRC}/app/docs/page.tsx`,
    ...DOC_SLUGS.map(docSource),
    "docs/guides",
    "docs/harnesses",
    "docs/providers",
    "docs/compare",
  ],
  "/reference/": [`${WEB_SRC}/features/reference`, `${WEB_SRC}/app/reference`],
  ...Object.fromEntries(DOC_SLUGS.map((slug) => [docPath(slug), [docSource(slug), `${WEB_SRC}/app/docs/[slug]/page.tsx`]])),
};

const entrySources = (path: string): readonly string[] => {
  const ref = entryForUrlPath(path);
  if (ref === null) return [];
  const facts = FACT_SOURCES[ref.collection];
  return [entryRepoPath(ref), `${WEB_SRC}/app/${ref.collection}`, ...(facts === undefined ? [] : [facts])];
};

export const pageSources = (path: string): readonly string[] => {
  const normalized = withTrailingSlash(path);
  return PAGE_SOURCES[normalized] ?? entrySources(normalized);
};

export const pageDates = (path: string): PageDates => lastModified(pageSources(path));
