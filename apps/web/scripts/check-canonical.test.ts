import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkCanonical, jsonLdUrls, urlProblem } from "./check-canonical";

const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

const page = ({ canonical, ogUrl = canonical, noIndex = false, jsonLd = [] }: {
  canonical: string;
  ogUrl?: string;
  noIndex?: boolean;
  jsonLd?: readonly unknown[];
}): string =>
  [
    "<!doctype html><html><head>",
    `<meta name="robots" content="${noIndex ? "noindex, follow" : "index, follow"}"/>`,
    `<link rel="canonical" href="${canonical}"/>`,
    `<meta property="og:url" content="${ogUrl}"/>`,
    ...jsonLd.map((data) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`),
    "</head><body></body></html>",
  ].join("");

const sitemap = (urls: readonly string[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;

const buildOut = (files: Readonly<Record<string, string>>): string => {
  const dir = mkdtempSync(join(tmpdir(), "check-canonical-"));
  tempDirs.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
};

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "TechArticle", "@id": "https://yoink.codes/docs/usage/#article", url: "https://yoink.codes/docs/usage/", author: { "@id": "https://yoink.codes/#author" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, item: "https://yoink.codes/" }] },
    { "@type": "Person", "@id": "https://yoink.codes/#author", name: "Author" },
  ],
};

describe("urlProblem", () => {
  test("accepts apex https urls with a trailing slash, a fragment, or a file name", () => {
    expect(urlProblem("https://yoink.codes/docs/usage/", true)).toBeNull();
    expect(urlProblem("https://yoink.codes/#author", true)).toBeNull();
    expect(urlProblem("https://yoink.codes/docs/usage/opengraph-image.png", true)).toBeNull();
  });

  test("rejects a missing trailing slash, www, and http", () => {
    expect(urlProblem("https://yoink.codes/docs/usage", true)).toMatch(/trailing slash/);
    expect(urlProblem("https://yoink.codes/docs/usage#article", false)).toMatch(/trailing slash/);
    expect(urlProblem("https://www.yoink.codes/", false)).toMatch(/apex/);
    expect(urlProblem("http://yoink.codes/", false)).toMatch(/http:/);
  });

  test("only requires the site host where asked", () => {
    expect(urlProblem("https://github.com/MajidRaimi", false)).toBeNull();
    expect(urlProblem("https://github.com/MajidRaimi", true)).toMatch(/not on/);
    expect(urlProblem("/docs/", true)).toMatch(/absolute/);
  });
});

describe("jsonLdUrls", () => {
  test("collects url, @id and breadcrumb item values", () => {
    expect(jsonLdUrls(page({ canonical: "https://yoink.codes/", jsonLd: [graph] }))).toEqual([
      "https://yoink.codes/docs/usage/#article",
      "https://yoink.codes/docs/usage/",
      "https://yoink.codes/#author",
      "https://yoink.codes/",
      "https://yoink.codes/#author",
    ]);
  });
});

describe("checkCanonical", () => {
  test("passes a consistent build", async () => {
    const out = buildOut({
      "index.html": page({ canonical: "https://yoink.codes/" }),
      "docs/usage/index.html": page({ canonical: "https://yoink.codes/docs/usage/", jsonLd: [graph] }),
      "docs/menu-bar/index.html": page({ canonical: "https://yoink.codes/docs/desktop/", noIndex: true }),
      "404.html": "<html></html>",
      "_not-found/index.html": "<html></html>",
      "sitemap.xml": sitemap(["https://yoink.codes/", "https://yoink.codes/docs/usage/"]),
    });
    const result = await checkCanonical(out);
    expect(result.problems).toEqual([]);
    expect(result.pages).toBe(3);
  });

  test("reports drifted urls, missing sitemap entries, listed noindex pages and dangling ids", async () => {
    const out = buildOut({
      "index.html": page({ canonical: "https://yoink.codes", ogUrl: "https://www.yoink.codes/" }),
      "docs/usage/index.html": page({
        canonical: "https://yoink.codes/docs/usage/",
        jsonLd: [{ "@graph": [{ "@type": "WebPage", url: "http://yoink.codes/docs/usage/", isPartOf: { "@id": "https://yoink.codes/#gone" } }] }],
      }),
      "docs/menu-bar/index.html": page({ canonical: "https://yoink.codes/docs/desktop/", noIndex: true }),
      "sitemap.xml": sitemap(["https://yoink.codes/", "https://yoink.codes/docs/menu-bar/", "https://yoink.codes/missing/"]),
    });
    const reasons = (await checkCanonical(out)).problems.map(({ file, source, reason }) => `${file} ${source} ${reason}`);
    expect(reasons).toEqual(
      expect.arrayContaining([
        "index.html canonical has no trailing slash",
        "index.html og:url uses www.yoink.codes instead of the apex yoink.codes",
        "docs/usage/index.html json-ld uses http: instead of https:",
        "docs/usage/index.html json-ld @id https://yoink.codes/#gone is referenced but never declared",
        "docs/usage/index.html page indexable page is missing from the sitemap",
        "docs/menu-bar/index.html sitemap noindex page is listed in the sitemap",
        "sitemap.xml sitemap sitemap URL has no indexable page in the build",
      ]),
    );
  });
});
