import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ENTITY_IDS, softwareApplicationNode } from "./entities";
import { auditFaqVisibility, auditJsonLdBlock, auditJsonLdHtml, extractJsonLdBlocks } from "./json-ld-audit";
import { faqNode, faqPageGraph, homeGraph, itemListNode, JsonLd, serializeJsonLd, techArticleGraph, webPageGraph, type JsonLdGraph } from "./json-ld";
import type { PageDates } from "./last-modified";

const dates: PageDates = { published: "2026-09-01T00:00:00.000Z", modified: "2026-10-01T00:00:00.000Z" };

const crumbs = (name: string, path: string): { name: string; path: string }[] => [
  { name: "Home", path: "/" },
  { name, path },
];

const PAGE_GRAPHS: readonly JsonLdGraph[] = [
  homeGraph({ title: "Yoink", description: "Home.", dates }),
  webPageGraph({ title: "Docs", description: "Docs.", path: "/docs/", dates, pageType: "CollectionPage", breadcrumbs: crumbs("Docs", "/docs/") }),
  webPageGraph({ title: "Download", description: "Download.", path: "/download/", dates, breadcrumbs: crumbs("Download", "/download/") }),
  techArticleGraph({ title: "Usage", description: "Commands.", path: "/docs/usage/", dates, breadcrumbs: crumbs("Usage", "/docs/usage/") }),
];

const renderFixture = (graphs: readonly JsonLdGraph[]): string =>
  `<!doctype html><html><head>${graphs.map((data) => renderToStaticMarkup(createElement(JsonLd, { data }))).join("")}</head><body></body></html>`;

const parse = (graph: JsonLdGraph): Record<string, unknown> => JSON.parse(serializeJsonLd(graph)) as Record<string, unknown>;

describe("entity graph", () => {
  test("the software application is free, versioned, and never rated", () => {
    const software = softwareApplicationNode();
    expect(software["@id"]).toBe("https://yoink.codes/#software");
    expect(software.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "USD" });
    expect(software.operatingSystem).toBe("macOS, Linux, Windows");
    expect(software.softwareVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(software.sameAs).toEqual(["https://github.com/MajidRaimi/yoink", "https://www.npmjs.com/package/yoink-cli"]);
    expect(software).not.toHaveProperty("aggregateRating");
    expect(software).not.toHaveProperty("review");
    expect(software).not.toHaveProperty("screenshot");
  });

  test("the home page declares the three site entities in one graph", () => {
    const graph = parse(PAGE_GRAPHS[0] as JsonLdGraph);
    const ids = (graph["@graph"] as { "@id": string }[]).map((node) => node["@id"]);
    expect(ids).toEqual([ENTITY_IDS.author, ENTITY_IDS.software, ENTITY_IDS.website, "https://yoink.codes/"]);
  });

  test("a tech article carries dates, image and entity references", () => {
    const [article] = (PAGE_GRAPHS[3] as JsonLdGraph)["@graph"];
    expect(article).toMatchObject({
      "@type": "TechArticle",
      url: "https://yoink.codes/docs/usage/",
      image: "https://yoink.codes/docs/usage/opengraph-image.png",
      datePublished: dates.published,
      dateModified: dates.modified,
      author: { "@id": ENTITY_IDS.author },
      publisher: { "@id": ENTITY_IDS.author },
      isPartOf: { "@id": ENTITY_IDS.website },
    });
  });

  test("every subpage graph declares the author and website it references", () => {
    for (const graph of PAGE_GRAPHS.slice(1)) {
      const nodes = parse(graph)["@graph"] as Record<string, unknown>[];
      expect(nodes).toContainEqual(expect.objectContaining({ "@type": "Person", "@id": ENTITY_IDS.author, name: expect.any(String) }));
      expect(nodes).toContainEqual(expect.objectContaining({ "@type": "WebSite", "@id": ENTITY_IDS.website, name: expect.any(String) }));
    }
  });

  test("the audit flags an author that is referenced but not declared", () => {
    const orphan = JSON.stringify({ "@graph": [{ "@type": "TechArticle", author: { "@id": ENTITY_IDS.author } }] });
    expect(auditJsonLdBlock(orphan, 1)).toEqual([{ block: 1, reason: `@id ${ENTITY_IDS.author} is referenced but never declared` }]);
  });

  test("breadcrumbs are numbered from one with trailing slash urls", () => {
    const [, breadcrumb] = (PAGE_GRAPHS[2] as JsonLdGraph)["@graph"];
    expect(breadcrumb).toMatchObject({
      "@id": "https://yoink.codes/download/#breadcrumb",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://yoink.codes/" },
        { "@type": "ListItem", position: 2, name: "Download", item: "https://yoink.codes/download/" },
      ],
    });
  });
});

describe("built html fixture", () => {
  const html = renderFixture(PAGE_GRAPHS);

  test("every ld+json block is valid JSON with one @graph", () => {
    const blocks = extractJsonLdBlocks(html);
    expect(blocks).toHaveLength(PAGE_GRAPHS.length);
    for (const block of blocks) {
      const parsed = JSON.parse(block) as Record<string, unknown>;
      expect(parsed["@context"]).toBe("https://schema.org");
      expect(Array.isArray(parsed["@graph"])).toBe(true);
    }
  });

  test("every referenced @id is declared in its graph or is a site entity", () => {
    expect(auditJsonLdHtml(html)).toEqual([]);
  });

  test("the audit catches invalid JSON, dangling ids and ratings", () => {
    expect(auditJsonLdBlock("{", 1)[0]?.reason).toMatch(/invalid JSON/);
    const dangling = JSON.stringify({ "@graph": [{ "@type": "WebPage", isPartOf: { "@id": "https://yoink.codes/#nope" } }] });
    expect(auditJsonLdBlock(dangling, 2)).toEqual([{ block: 2, reason: "@id https://yoink.codes/#nope is referenced but never declared" }]);
    const rated = JSON.stringify({ "@type": "SoftwareApplication", aggregateRating: { ratingValue: 5 } });
    expect(auditJsonLdBlock(rated, 3)[0]?.reason).toMatch(/aggregateRating/);
  });
});

describe("serializeJsonLd", () => {
  test("serialization cannot close the script element", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("faq and item lists", () => {
  const items = [{ question: "Do I need to log out?", answer: "No. yoink swaps the stored login." }];

  test("a page FAQ hangs off the article with a fragment id", () => {
    const graph = techArticleGraph({ title: "G", description: "d", path: "/guides/x/", dates, breadcrumbs: crumbs("G", "/guides/x/") }, [
      faqNode("/guides/x/", items),
      itemListNode("/guides/x/", [{ name: "claude-swap", url: "https://github.com/realiti4/claude-swap" }]),
    ]);
    const nodes = parse(graph)["@graph"] as Record<string, unknown>[];
    expect(nodes).toContainEqual(
      expect.objectContaining({
        "@type": "FAQPage",
        "@id": "https://yoink.codes/guides/x/#faq",
        mainEntity: [{ "@type": "Question", name: items[0]?.question, acceptedAnswer: { "@type": "Answer", text: items[0]?.answer } }],
      }),
    );
    expect(nodes).toContainEqual(
      expect.objectContaining({
        "@type": "ItemList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "claude-swap", url: "https://github.com/realiti4/claude-swap" }],
      }),
    );
    expect(auditJsonLdBlock(serializeJsonLd(graph), 1)).toEqual([]);
  });

  test("the faq page itself is a FAQPage", () => {
    const [page] = faqPageGraph({ title: "FAQ", description: "d", path: "/faq/", dates, breadcrumbs: crumbs("FAQ", "/faq/"), items })["@graph"];
    expect(page).toMatchObject({ "@type": "FAQPage", "@id": "https://yoink.codes/faq/", breadcrumb: { "@id": "https://yoink.codes/faq/#breadcrumb" } });
  });

  test("FAQPage text must be visible on the page", () => {
    const graph = faqPageGraph({ title: "FAQ", description: "d", path: "/faq/", dates, breadcrumbs: crumbs("FAQ", "/faq/"), items });
    const head = renderToStaticMarkup(createElement(JsonLd, { data: graph }));
    const visible = `<html><head>${head}</head><body><h3>Do I need to log out?</h3><p>No. yoink swaps the <code>stored</code> login.</p></body></html>`;
    expect(auditFaqVisibility(visible)).toEqual([]);
    const hidden = `<html><head>${head}</head><body><h3>Do I need to log out?</h3></body></html>`;
    expect(auditFaqVisibility(hidden)).toHaveLength(1);
  });
});
