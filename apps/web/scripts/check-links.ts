import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { site } from "../src/shared/brand/site";
import { DOC_ALIASES, INDEXABLE_PATHS, type DocAlias } from "../src/shared/lib/routes";

export type LinkKind = "href" | "src" | "srcset" | "og:image" | "twitter:image" | "canonical" | "sitemap";

export type PageReference = {
  kind: LinkKind;
  value: string;
};

export type PageScan = {
  ids: ReadonlySet<string>;
  references: readonly PageReference[];
  ogImageCount: number;
};

export type LinkProblem = {
  source: string;
  kind: LinkKind | "required" | "indexable";
  value: string;
  reason: string;
};

export type ResolvedTarget =
  | { type: "skip" }
  | { type: "internal"; pathname: string; fragment: string };

const WEB_ROOT = resolve(import.meta.dir, "..");
const LOCAL_ORIGIN = "http://check-links.local";
const SITE_ORIGIN = new URL(site.url).origin;
const SKIPPED_PROTOCOLS: ReadonlySet<string> = new Set(["mailto:", "tel:", "javascript:", "data:", "blob:", "sms:"]);

const ALIAS_PAGES: readonly string[] = (Object.keys(DOC_ALIASES) as DocAlias[]).map((alias) => `docs/${alias}/index.html`);

export const REQUIRED_FILES: readonly string[] = [
  "install.sh",
  "install.ps1",
  "CNAME",
  ".nojekyll",
  "sitemap.xml",
  "robots.txt",
  "manifest.webmanifest",
  "search-index.json",
  ...ALIAS_PAGES,
];

const SOCIAL_IMAGE_KINDS: ReadonlySet<LinkKind> = new Set(["og:image", "twitter:image"]);

export type CheckLinksOptions = {
  indexablePaths?: readonly string[];
};

const URL_ATTRIBUTES: readonly { selector: string; attribute: string; kind: LinkKind }[] = [
  { selector: "a[href]", attribute: "href", kind: "href" },
  { selector: "area[href]", attribute: "href", kind: "href" },
  { selector: "link[href]", attribute: "href", kind: "href" },
  { selector: "script[src]", attribute: "src", kind: "src" },
  { selector: "img[src]", attribute: "src", kind: "src" },
  { selector: "source[src]", attribute: "src", kind: "src" },
  { selector: "video[src]", attribute: "src", kind: "src" },
  { selector: "video[poster]", attribute: "poster", kind: "src" },
  { selector: "iframe[src]", attribute: "src", kind: "src" },
  { selector: "img[srcset]", attribute: "srcset", kind: "srcset" },
  { selector: "source[srcset]", attribute: "srcset", kind: "srcset" },
];

const META_IMAGE_KEYS: Readonly<Record<string, LinkKind>> = {
  "og:image": "og:image",
  "og:image:url": "og:image",
  "og:image:secure_url": "og:image",
  "twitter:image": "twitter:image",
  "twitter:image:src": "twitter:image",
};

export const parseSrcset = (value: string): readonly string[] =>
  value
    .split(",")
    .map((candidate) => candidate.trim().split(/\s+/)[0] ?? "")
    .filter((url) => url.length > 0);

export const scanHtml = async (html: string): Promise<PageScan> => {
  const ids = new Set<string>();
  const references: PageReference[] = [];
  let ogImageCount = 0;
  const push = (kind: LinkKind, value: string | null): void => {
    if (value !== null && value.trim().length > 0) references.push({ kind, value: value.trim() });
  };

  let rewriter = new HTMLRewriter().on("[id]", {
    element(element) {
      const id = element.getAttribute("id");
      if (id !== null) ids.add(id);
    },
  });
  rewriter = rewriter.on("a[name]", {
    element(element) {
      const name = element.getAttribute("name");
      if (name !== null) ids.add(name);
    },
  });
  for (const { selector, attribute, kind } of URL_ATTRIBUTES) {
    rewriter = rewriter.on(selector, {
      element(element) {
        const value = element.getAttribute(attribute);
        if (kind === "srcset") {
          for (const url of parseSrcset(value ?? "")) push("srcset", url);
        } else if (selector.startsWith("link") && element.getAttribute("rel")?.split(/\s+/).includes("canonical")) {
          push("canonical", value);
        } else {
          push(kind, value);
        }
      },
    });
  }
  rewriter = rewriter.on("meta[content]", {
    element(element) {
      const key = element.getAttribute("property") ?? element.getAttribute("name") ?? "";
      const kind = META_IMAGE_KEYS[key];
      if (element.getAttribute("property") === "og:image") ogImageCount += 1;
      if (kind !== undefined) push(kind, element.getAttribute("content"));
    },
  });

  await rewriter.transform(new Response(html)).text();
  return { ids, references, ogImageCount };
};

export const pagePathFor = (relativeFile: string): string => {
  const posix = relativeFile.split(sep).join("/");
  if (posix === "index.html") return "/";
  if (posix.endsWith("/index.html")) return `/${posix.slice(0, -"index.html".length)}`;
  return `/${posix}`;
};

export const resolveReference = (value: string, pagePath: string): ResolvedTarget => {
  let url: URL;
  try {
    url = new URL(value, `${LOCAL_ORIGIN}${pagePath}`);
  } catch {
    return { type: "internal", pathname: value, fragment: "" };
  }
  if (SKIPPED_PROTOCOLS.has(url.protocol)) return { type: "skip" };
  const isLocal = url.origin === LOCAL_ORIGIN || url.origin === SITE_ORIGIN;
  if (!isLocal) return { type: "skip" };
  let pathname = url.pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    pathname = url.pathname;
  }
  return { type: "internal", pathname, fragment: url.hash.replace(/^#/, "") };
};

const isFile = (path: string): boolean => existsSync(path) && statSync(path).isFile();

export const resolveToFile = (outDir: string, pathname: string): string | null => {
  const base = join(outDir, ...pathname.split("/").filter((segment) => segment.length > 0));
  if (!base.startsWith(outDir)) return null;
  if (pathname.endsWith("/")) {
    const index = join(base, "index.html");
    return isFile(index) ? index : null;
  }
  if (isFile(base)) return base;
  const directoryIndex = join(base, "index.html");
  if (isFile(directoryIndex)) return directoryIndex;
  const htmlSibling = `${base}.html`;
  return isFile(htmlSibling) ? htmlSibling : null;
};

const walkHtml = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkHtml(path);
    return entry.isFile() && extname(entry.name) === ".html" ? [path] : [];
  });

export const parseSitemap = (xml: string): readonly string[] =>
  [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1] ?? "").filter((loc) => loc.length > 0);

export type CheckLinksResult = {
  pages: number;
  references: number;
  problems: readonly LinkProblem[];
};

export const checkLinks = async (outDir: string, options: CheckLinksOptions = {}): Promise<CheckLinksResult> => {
  const { indexablePaths = INDEXABLE_PATHS } = options;
  const problems: LinkProblem[] = [];
  for (const required of REQUIRED_FILES) {
    if (!isFile(join(outDir, required))) {
      problems.push({ source: "out", kind: "required", value: required, reason: "required file is missing" });
    }
  }

  const htmlFiles = walkHtml(outDir);
  const scans = new Map<string, PageScan>();
  for (const file of htmlFiles) scans.set(file, await scanHtml(readFileSync(file, "utf8")));

  const scanFor = async (file: string): Promise<PageScan> => {
    const cached = scans.get(file);
    if (cached !== undefined) return cached;
    const scan = await scanHtml(readFileSync(file, "utf8"));
    scans.set(file, scan);
    return scan;
  };

  for (const path of indexablePaths) {
    const file = resolveToFile(outDir, path);
    if (file === null) {
      problems.push({ source: "out", kind: "indexable", value: path, reason: "indexable page is missing" });
      continue;
    }
    const { ogImageCount } = await scanFor(file);
    if (ogImageCount !== 1) {
      problems.push({
        source: relative(outDir, file),
        kind: "indexable",
        value: path,
        reason: `expected exactly one og:image, found ${ogImageCount}`,
      });
    }
  }

  const verify = async (source: string, pagePath: string, reference: PageReference): Promise<void> => {
    const target = resolveReference(reference.value, pagePath);
    if (target.type === "skip") return;
    const file = resolveToFile(outDir, target.pathname);
    if (file === null) {
      problems.push({ source, kind: reference.kind, value: reference.value, reason: `no file for ${target.pathname}` });
      return;
    }
    if (SOCIAL_IMAGE_KINDS.has(reference.kind) && extname(file) !== ".png") {
      problems.push({
        source,
        kind: reference.kind,
        value: reference.value,
        reason: `social image ${relative(outDir, file)} is not a .png`,
      });
      return;
    }
    if (target.fragment.length === 0 || extname(file) !== ".html") return;
    const { ids } = await scanFor(file);
    if (!ids.has(target.fragment)) {
      problems.push({
        source,
        kind: reference.kind,
        value: reference.value,
        reason: `#${target.fragment} not found in ${relative(outDir, file)}`,
      });
    }
  };

  let referenceCount = 0;
  for (const file of htmlFiles) {
    const scan = scans.get(file);
    if (scan === undefined) continue;
    const source = relative(outDir, file);
    const pagePath = pagePathFor(source);
    for (const reference of scan.references) {
      referenceCount += 1;
      await verify(source, pagePath, reference);
    }
  }

  const sitemapFile = join(outDir, "sitemap.xml");
  if (isFile(sitemapFile)) {
    for (const loc of parseSitemap(readFileSync(sitemapFile, "utf8"))) {
      referenceCount += 1;
      await verify("sitemap.xml", "/", { kind: "sitemap", value: loc });
    }
  }

  return { pages: htmlFiles.length, references: referenceCount, problems };
};

export const formatLinkReport = (result: CheckLinksResult): string => {
  const summary = `${result.pages} page(s), ${result.references} reference(s)`;
  if (result.problems.length === 0) return `check:links passed (${summary})`;
  const bySource = Map.groupBy(result.problems, (problem) => problem.source);
  const sections = [...bySource.entries()].map(([source, problems]) => {
    const lines = Map.groupBy(problems, (problem) => `  [${problem.kind}] ${problem.value}  ${problem.reason}`);
    return [source, ...[...lines.entries()].map(([line, group]) => (group.length > 1 ? `${line} (x${group.length})` : line))].join(
      "\n",
    );
  });
  return [...sections, "", `check:links failed: ${result.problems.length} problem(s) across ${summary}`].join("\n");
};

if (import.meta.main) {
  const outDir = resolve(WEB_ROOT, process.argv[2] ?? "out");
  if (!existsSync(outDir)) {
    console.error(`check:links failed: ${relative(process.cwd(), outDir)} does not exist, run the build first`);
    process.exit(1);
  }
  const result = await checkLinks(outDir);
  const report = formatLinkReport(result);
  if (result.problems.length === 0) {
    console.log(report);
  } else {
    console.error(report);
    process.exit(1);
  }
}
