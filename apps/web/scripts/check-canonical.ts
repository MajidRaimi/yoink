import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { auditFaqVisibility, auditJsonLdHtml, extractJsonLdBlocks } from "../src/features/seo/json-ld-audit";
import { site } from "../src/shared/brand/site";
import { pagePathFor, parseSitemap } from "./check-links";

export type CanonicalSource = "canonical" | "og:url" | "json-ld" | "sitemap" | "page";

export type CanonicalProblem = {
  file: string;
  source: CanonicalSource;
  value: string;
  reason: string;
};

export type PageHead = {
  canonical: string | null;
  ogUrl: string | null;
  noIndex: boolean;
};

export type CheckCanonicalResult = {
  pages: number;
  sitemapUrls: number;
  problems: readonly CanonicalProblem[];
};

const WEB_ROOT = resolve(import.meta.dir, "..");
const SITE_ORIGIN = new URL(site.url).origin;
const SITE_HOST = new URL(site.url).host;
const NON_PAGE_FILES: ReadonlySet<string> = new Set(["404.html"]);
const NON_PAGE_DIRS: readonly string[] = ["_next", "_not-found", "404"];
const JSON_LD_URL_KEYS: ReadonlySet<string> = new Set(["@id", "url", "item", "mainEntityOfPage", "downloadUrl", "installUrl"]);

const isSiteHost = (host: string): boolean => host === SITE_HOST || host === `www.${SITE_HOST}`;

const looksLikeFile = (pathname: string): boolean => extname(pathname.split("/").at(-1) ?? "").length > 0;

export const urlProblem = (value: string, requireSiteHost: boolean): string | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "is not an absolute URL";
  }
  if (!isSiteHost(url.host)) return requireSiteHost ? `is not on ${SITE_ORIGIN}` : null;
  if (url.protocol !== "https:") return `uses ${url.protocol} instead of https:`;
  if (url.host !== SITE_HOST) return `uses ${url.host} instead of the apex ${SITE_HOST}`;
  const hasExplicitPath = /^[a-z]+:\/\/[^/?#]+\//i.test(value);
  if (!hasExplicitPath || (!url.pathname.endsWith("/") && !looksLikeFile(url.pathname))) return "has no trailing slash";
  return null;
};

export const readPageHead = async (html: string): Promise<PageHead> => {
  const head: { canonical: string | null; ogUrl: string | null; noIndex: boolean } = { canonical: null, ogUrl: null, noIndex: false };
  await new HTMLRewriter()
    .on("link[rel]", {
      element(element) {
        if (element.getAttribute("rel")?.split(/\s+/).includes("canonical")) head.canonical = element.getAttribute("href");
      },
    })
    .on("meta[content]", {
      element(element) {
        const content = element.getAttribute("content") ?? "";
        if (element.getAttribute("property") === "og:url") head.ogUrl = content;
        if (element.getAttribute("name") === "robots" && /\bnoindex\b/i.test(content)) head.noIndex = true;
      },
    })
    .transform(new Response(html))
    .text();
  return head;
};

const collectJsonLdUrls = (value: unknown, key: string | null): readonly string[] => {
  if (Array.isArray(value)) return value.flatMap((item) => collectJsonLdUrls(item, key));
  if (typeof value === "string") return key !== null && JSON_LD_URL_KEYS.has(key) ? [value] : [];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([childKey, child]) => collectJsonLdUrls(child, childKey));
};

export const jsonLdUrls = (html: string): readonly string[] =>
  extractJsonLdBlocks(html).flatMap((block) => {
    try {
      return collectJsonLdUrls(JSON.parse(block), null);
    } catch {
      return [];
    }
  });

const walkPages = (directory: string, outDir: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return directory === outDir && NON_PAGE_DIRS.includes(entry.name) ? [] : walkPages(path, outDir);
    const isPage = entry.isFile() && extname(entry.name) === ".html" && !(directory === outDir && NON_PAGE_FILES.has(entry.name));
    return isPage ? [path] : [];
  });

export const checkCanonical = async (outDir: string): Promise<CheckCanonicalResult> => {
  const problems: CanonicalProblem[] = [];
  const report = (file: string, source: CanonicalSource, value: string, reason: string): void => {
    problems.push({ file, source, value, reason });
  };

  const sitemapFile = join(outDir, "sitemap.xml");
  const sitemapUrls = existsSync(sitemapFile) ? parseSitemap(readFileSync(sitemapFile, "utf8")) : [];
  if (sitemapUrls.length === 0) report("sitemap.xml", "sitemap", "", "sitemap.xml is missing or lists no URLs");
  for (const loc of sitemapUrls) {
    const problem = urlProblem(loc, true);
    if (problem !== null) report("sitemap.xml", "sitemap", loc, problem);
  }
  const inSitemap = new Set(sitemapUrls);
  const indexableUrls = new Set<string>();

  const pages = walkPages(outDir, outDir);
  for (const file of pages) {
    const source = relative(outDir, file);
    const html = readFileSync(file, "utf8");
    const pageUrl = new URL(pagePathFor(source), SITE_ORIGIN).toString();
    const head = await readPageHead(html);

    for (const [kind, value] of [["canonical", head.canonical], ["og:url", head.ogUrl]] as const) {
      if (value === null) {
        report(source, kind, "", `missing ${kind}`);
        continue;
      }
      const problem = urlProblem(value, true);
      if (problem !== null) report(source, kind, value, problem);
    }
    for (const url of jsonLdUrls(html)) {
      const problem = urlProblem(url, false);
      if (problem !== null) report(source, "json-ld", url, problem);
    }
    for (const { block, reason } of [...auditJsonLdHtml(html), ...auditFaqVisibility(html)]) {
      report(source, "json-ld", `block ${block}`, reason);
    }

    if (head.noIndex) {
      if (inSitemap.has(pageUrl)) report(source, "sitemap", pageUrl, "noindex page is listed in the sitemap");
      continue;
    }
    indexableUrls.add(pageUrl);
    if (head.canonical !== null && head.canonical !== pageUrl) {
      report(source, "canonical", head.canonical, `indexable page is not self-canonical (expected ${pageUrl})`);
    }
    if (head.ogUrl !== null && head.ogUrl !== pageUrl) report(source, "og:url", head.ogUrl, `og:url does not match ${pageUrl}`);
    if (!inSitemap.has(pageUrl)) report(source, "page", pageUrl, "indexable page is missing from the sitemap");
  }

  for (const loc of sitemapUrls) {
    if (!indexableUrls.has(loc)) report("sitemap.xml", "sitemap", loc, "sitemap URL has no indexable page in the build");
  }

  return { pages: pages.length, sitemapUrls: sitemapUrls.length, problems };
};

export const formatCanonicalReport = (result: CheckCanonicalResult): string => {
  const summary = `${result.pages} page(s), ${result.sitemapUrls} sitemap URL(s)`;
  if (result.problems.length === 0) return `check:canonical passed (${summary})`;
  const lines = result.problems.map(({ file, source, value, reason }) => `${file}  [${source}] ${value}  ${reason}`);
  return [...lines, "", `check:canonical failed: ${result.problems.length} problem(s) across ${summary}`].join("\n");
};

if (import.meta.main) {
  const outDir = resolve(WEB_ROOT, process.argv[2] ?? "out");
  if (!existsSync(outDir)) {
    console.error(`check:canonical failed: ${relative(process.cwd(), outDir)} does not exist, run the build first`);
    process.exit(1);
  }
  const result = await checkCanonical(outDir);
  const report = formatCanonicalReport(result);
  if (result.problems.length === 0) {
    console.log(report);
  } else {
    console.error(report);
    process.exit(1);
  }
}
