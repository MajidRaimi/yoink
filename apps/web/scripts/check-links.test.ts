import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DOC_ALIASES } from "../src/shared/lib/routes";
import { checkLinks, type LinkKind, pagePathFor, parseSrcset, REQUIRED_FILES, resolveReference, resolveToFile, scanHtml } from "./check-links";

const page = (body: string, head = ""): string =>
  `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

const writeTree = (root: string, files: Readonly<Record<string, string>>): void => {
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
};

describe("pure helpers", () => {
  test("maps out files to page paths", () => {
    expect(pagePathFor("index.html")).toBe("/");
    expect(pagePathFor("docs/providers/index.html")).toBe("/docs/providers/");
    expect(pagePathFor("404.html")).toBe("/404.html");
  });

  test("skips external and non navigational links", () => {
    expect(resolveReference("https://github.com/MajidRaimi/yoink", "/").type).toBe("skip");
    expect(resolveReference("mailto:me@example.com", "/").type).toBe("skip");
    expect(resolveReference("https://yoink.codes/docs/", "/")).toEqual({
      type: "internal",
      pathname: "/docs/",
      fragment: "",
    });
    expect(resolveReference("../usage/#flags", "/docs/providers/")).toEqual({
      type: "internal",
      pathname: "/docs/usage/",
      fragment: "flags",
    });
  });

  test("parses srcset candidates", () => {
    expect(parseSrcset("/a.png 1x, /b.png 2x")).toEqual(["/a.png", "/b.png"]);
  });

  test("collects ids, references, canonical and og images", async () => {
    const scan = await scanHtml(
      page(
        '<h2 id="one">One</h2><a href="/docs/">Docs</a><img src="/a.png" srcset="/b.png 2x">',
        '<link rel="canonical" href="https://yoink.codes/"><meta property="og:image" content="/og.png">',
      ),
    );
    expect([...scan.ids]).toEqual(["one"]);
    expect(scan.references.map((reference) => reference.kind).toSorted()).toEqual(
      (["canonical", "href", "og:image", "src", "srcset"] as const satisfies readonly LinkKind[]).toSorted(),
    );
  });
});

describe("checkLinks", () => {
  let root = "";

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "check-links-"));
    writeTree(root, {
      ...Object.fromEntries(REQUIRED_FILES.map((file) => [file, file.endsWith(".html") ? page("") : "x"])),
      "index.html": page(
        '<section id="install"></section><a href="/docs/#intro">Docs</a><a href="/download">Download</a>',
        '<meta property="og:image" content="/og/home.png"><meta name="twitter:image" content="/og/home.png">',
      ),
      "og/home.png": "png",
      "opengraph-image": "raw",
      "docs/index.html": page(
        '<h2 id="intro">Intro</h2><a href="#missing">Bad</a><a href="/gone/">Gone</a>',
        '<meta property="og:image" content="/opengraph-image?abc"><meta property="og:image" content="/og/home.png">',
      ),
      "download/index.html": page("", '<meta property="og:image" content="https://yoink.codes/og/download.png">'),
      "sitemap.xml": "<urlset><url><loc>https://yoink.codes/docs/</loc></url><url><loc>https://yoink.codes/nope/</loc></url></urlset>",
    });
  });

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  test("resolves directories, trailing slashes and missing targets", () => {
    expect(resolveToFile(root, "/download")).toBe(join(root, "download", "index.html"));
    expect(resolveToFile(root, "/download/")).toBe(join(root, "download", "index.html"));
    expect(resolveToFile(root, "/gone/")).toBeNull();
  });

  test("reports missing fragments, files, og images and sitemap entries", async () => {
    const result = await checkLinks(root, { indexablePaths: ["/", "/docs/", "/download/", "/reference/"] });
    expect(result.problems.map((problem) => `${problem.source} ${problem.kind} ${problem.value}`).toSorted()).toEqual(
      [
        "docs/index.html href #missing",
        "docs/index.html href /gone/",
        "docs/index.html og:image /opengraph-image?abc",
        "docs/index.html indexable /docs/",
        "download/index.html og:image https://yoink.codes/og/download.png",
        "out indexable /reference/",
        "sitemap.xml sitemap https://yoink.codes/nope/",
      ].toSorted(),
    );
  });

  test("counts og:image tags per page", async () => {
    const scan = await scanHtml(page("", '<meta property="og:image" content="/a.png"><meta property="og:image:width" content="1200">'));
    expect(scan.ogImageCount).toBe(1);
  });

  test("requires the search index and every alias page", () => {
    expect(REQUIRED_FILES).toContain("search-index.json");
    for (const alias of Object.keys(DOC_ALIASES)) expect(REQUIRED_FILES).toContain(`docs/${alias}/index.html`);
  });
});
