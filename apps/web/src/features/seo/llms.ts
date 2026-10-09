import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { hasEntry, type CollectionId, type EntryRef } from "@/features/docs/collections";
import { getEntries } from "@/features/docs/content";
import { entryDocument } from "@/features/docs/entry-document";
import type { EntryMeta } from "@/features/docs/entry-types";
import type { HarnessFactsData } from "@/features/docs/facts/types";
import { docLinkContext } from "@/features/docs/mdx/pipeline";
import { rewriteDocUrl, rewriteImageUrl, type DocLinkContext } from "@/features/docs/mdx/remark-doc-links";
import { isParent, walk, type TreeNode } from "@/features/docs/mdx/syntax-tree";
import { HARNESS_FACTS, HARNESSES, PROVIDER_PRESETS } from "@/features/demos/data";
import { canonicalUrl } from "@/features/seo/metadata";
import { site } from "@/shared/brand/site";
import type { HarnessData, PresetData } from "@/shared/contract";
import { absoluteUrl, docPath, entryPath, routes, type DocSlug } from "@/shared/lib/routes";

export type LlmsLink = {
  readonly title: string;
  readonly url: string;
  readonly description: string;
  readonly markdownUrl?: string;
};

export type LlmsSection = {
  readonly title: string;
  readonly links: readonly LlmsLink[];
};

export type LlmsIndexInput = {
  readonly name: string;
  readonly summary: string;
  readonly details: readonly string[];
  readonly sections: readonly LlmsSection[];
};

export type LlmsDocument = {
  readonly title: string;
  readonly url: string;
  readonly markdown: string;
};

export type LlmsFullInput = {
  readonly name: string;
  readonly summary: string;
  readonly documents: readonly LlmsDocument[];
};

export type MarkdownTwin = {
  readonly path: string;
  readonly markdown: string;
};

type SourceSpan = {
  readonly start: number;
  readonly end: number;
};

type SpanReplacement = SourceSpan & {
  readonly text: string;
};

export class LlmsBuildError extends Error {
  constructor(problem: string) {
    super(`llms: ${problem}`);
    this.name = "LlmsBuildError";
  }
}

export const LLMS_SUMMARY =
  "Yoink for AI coding (yoink.codes) is an open source (MIT) CLI for macOS, Linux and Windows, plus a macOS menu bar app. It switches Claude Code accounts, switches ChatGPT (Codex), Kimi Code, Gemini and GitHub Copilot logins inside their own tools, and writes API-key providers (OpenAI, Kimi Code, Moonshot, OpenRouter, DeepSeek, z.ai, Ollama, or any OpenAI- or Anthropic-compatible URL) into 13 coding harnesses. npm package: yoink-cli. Source: https://github.com/MajidRaimi/yoink. Not related to the Yoink drag-and-drop app for Mac or the PyPI yoink-cli media downloader.";

export const HARNESS_TABLE_ANCHOR = "supported-harnesses";

export const PRESET_TABLE_ANCHOR = "presets";

const LLMS_FULL_ORDER: readonly CollectionId[] = ["docs", "guides", "harnesses", "providers", "compare", "faq"];

const MARKDOWN_TWIN_FILE = "index.md";

const LLMS_FULL_PATH = "/llms-full.txt";

const LINK_TYPES: ReadonlySet<string> = new Set(["link", "definition"]);

const markdownParser = createProcessor({ format: "md", remarkPlugins: [remarkGfm] });

const parseMarkdown = (markdown: string): TreeNode => markdownParser.parse(markdown);

const installLine = (): string =>
  `Install: \`${site.installCommand}\` (macOS, Linux), \`${site.installCommandWindows}\` (Windows), \`${site.installCommandNpm}\`, or the Mac app at ${canonicalUrl(routes.download)}.`;

const renderLink = ({ title, url, description, markdownUrl }: LlmsLink): string => {
  const markdownNote = markdownUrl === undefined ? "" : ` Markdown: ${markdownUrl}`;
  return `- [${title}](${url}): ${description}${markdownNote}`;
};

const renderSection = ({ title, links }: LlmsSection): string => [`## ${title}`, "", ...links.map(renderLink)].join("\n");

export const renderLlmsIndex = ({ name, summary, details, sections }: LlmsIndexInput): string =>
  [
    `# ${name}`,
    `> ${summary}`,
    ...details,
    ...sections.filter((section) => section.links.length > 0).map(renderSection),
  ].join("\n\n") + "\n";

export const renderLlmsDocument = ({ title, url, markdown }: LlmsDocument): string =>
  `# ${title}\n\nSource: ${url}\n\n${markdown.trim()}\n`;

export const renderLlmsFull = ({ name, summary, documents }: LlmsFullInput): string =>
  [`# ${name}\n\n> ${summary}\n`, ...documents.map(renderLlmsDocument)].join("\n");

const spanOf = (node: TreeNode): SourceSpan | null => {
  const position: unknown = Reflect.get(node, "position");
  if (typeof position !== "object" || position === null) return null;
  const start: unknown = Reflect.get(Reflect.get(position, "start") ?? {}, "offset");
  const end: unknown = Reflect.get(Reflect.get(position, "end") ?? {}, "offset");
  return typeof start === "number" && typeof end === "number" ? { start, end } : null;
};

const applyReplacements = (source: string, replacements: readonly SpanReplacement[]): string =>
  [...replacements]
    .sort((left, right) => right.start - left.start)
    .reduce((text, { start, end, text: value }) => text.slice(0, start) + value + text.slice(end), source);

const absolutize = (rewritten: string, pageUrl: string): string => {
  if (rewritten.startsWith("#")) return `${pageUrl}${rewritten}`;
  if (rewritten.startsWith("/")) return absoluteUrl(site.url, rewritten);
  return rewritten;
};

const rewriteNodeUrl = (node: TreeNode, url: string, context: DocLinkContext, pageUrl: string): string =>
  LINK_TYPES.has(node.type) ? absolutize(rewriteDocUrl(url, context), pageUrl) : rewriteImageUrl(url, context);

const urlReplacement = (source: string, node: TreeNode, context: DocLinkContext, pageUrl: string): SpanReplacement | null => {
  const url = node.url;
  const span = spanOf(node);
  if (url === undefined || span === null) return null;
  const rewritten = rewriteNodeUrl(node, url, context, pageUrl);
  if (rewritten === url) return null;
  const index = source.slice(span.start, span.end).lastIndexOf(url);
  if (index === -1) throw new LlmsBuildError(`${context.sourceRepoPath}: cannot locate "${url}" in its source`);
  const start = span.start + index;
  return { start, end: start + url.length, text: rewritten };
};

const leadingHeadingRemoval = (tree: TreeNode): SpanReplacement | null => {
  if (!isParent(tree)) return null;
  const first = tree.children.find((child) => child.type !== "yaml" && child.type !== "toml");
  if (first?.type !== "heading" || first.depth !== 1) return null;
  const span = spanOf(first);
  return span === null ? null : { ...span, text: "" };
};

export const absolutizeDocMarkdown = (body: string, context: DocLinkContext, pageUrl: string): string => {
  const tree = parseMarkdown(body);
  const replacements: SpanReplacement[] = [];
  walk(tree, (node) => {
    if (typeof node.url !== "string" || !(LINK_TYPES.has(node.type) || node.type === "image")) return;
    const replacement = urlReplacement(body, node, context, pageUrl);
    if (replacement !== null) replacements.push(replacement);
  });
  const heading = leadingHeadingRemoval(tree);
  if (heading !== null) replacements.push(heading);
  return applyReplacements(body, replacements).trim();
};

export const reachableHarnesses = (preset: PresetData, harnesses: readonly HarnessData[]): readonly HarnessData[] => {
  const spoken = new Set(preset.endpoints.map((endpoint) => endpoint.protocol));
  return harnesses.filter((harness) => harness.protocols.some((protocol) => spoken.has(protocol)));
};

export type LlmsPageTarget = Pick<LlmsLink, "url" | "markdownUrl">;

export type LlmsPageResolver = (id: string) => LlmsPageTarget;

export const harnessLinks = (harnesses: readonly HarnessFactsData[], pageFor: LlmsPageResolver): readonly LlmsLink[] =>
  harnesses.map((harness) => {
    const status = harness.experimental ? " (experimental)" : "";
    return {
      title: harness.label,
      ...pageFor(harness.id),
      description: `id \`${harness.id}\`${status}, writes ${harness.configPath}; speaks ${harness.protocols.join(", ")}.`,
    };
  });

export const presetLinks = (
  presets: readonly PresetData[],
  harnesses: readonly HarnessData[],
  pageFor: LlmsPageResolver,
): readonly LlmsLink[] =>
  presets.map((preset) => {
    const endpoints = preset.endpoints.map(({ protocol, baseUrl }) => `${protocol} at ${baseUrl}`).join(", ");
    const reach = reachableHarnesses(preset, harnesses).length;
    return {
      title: preset.label,
      ...pageFor(preset.id),
      description: `preset \`${preset.id}\`, ${endpoints}; connects to ${reach} of ${harnesses.length} harnesses.`,
    };
  });

export const markdownTwinPath = (path: string): string => `${path}${MARKDOWN_TWIN_FILE}`;

export const markdownTwinUrl = (path: string): string => absoluteUrl(site.url, markdownTwinPath(path));

const docUrl = (slug: DocSlug): string => canonicalUrl(docPath(slug));

const entryLink = (meta: EntryMeta): LlmsLink => ({
  title: meta.title,
  url: canonicalUrl(meta.path),
  description: meta.description,
  markdownUrl: markdownTwinUrl(meta.path),
});

const collectionLinks = (collection: CollectionId): readonly LlmsLink[] => getEntries(collection).map(entryLink);

const entryPageOr =
  (collection: CollectionId, fallbackUrl: string): LlmsPageResolver =>
  (id) => {
    if (!hasEntry({ collection, slug: id })) return { url: fallbackUrl };
    const path = entryPath(collection, id);
    return { url: canonicalUrl(path), markdownUrl: markdownTwinUrl(path) };
  };

const optionalLinks = (): readonly LlmsLink[] => [
  {
    title: "CLI reference",
    url: canonicalUrl(routes.reference),
    description: "every yoink command, alias and flag, with the harness, tool and preset ids.",
  },
  ...getEntries("faq").map((meta) => ({ title: meta.title, url: canonicalUrl(meta.path), description: meta.description })),
  {
    title: "Full text",
    url: absoluteUrl(site.url, LLMS_FULL_PATH),
    description: "every documentation page above in one Markdown file.",
  },
];

const llmsSections = (): readonly LlmsSection[] => [
  { title: "Docs", links: collectionLinks("docs") },
  { title: "Guides", links: collectionLinks("guides") },
  {
    title: "Harnesses",
    links: harnessLinks(HARNESS_FACTS, entryPageOr("harnesses", `${docUrl("harnesses")}#${HARNESS_TABLE_ANCHOR}`)),
  },
  {
    title: "Providers",
    links: presetLinks(PROVIDER_PRESETS, HARNESSES, entryPageOr("providers", `${docUrl("providers")}#${PRESET_TABLE_ANCHOR}`)),
  },
  { title: "Compare", links: collectionLinks("compare") },
  { title: "Optional", links: optionalLinks() },
];

export const llmsIndex = (): string =>
  renderLlmsIndex({ name: site.name, summary: LLMS_SUMMARY, details: [installLine()], sections: llmsSections() });

const entryLlmsDocument = (ref: EntryRef): LlmsDocument => {
  const { meta, markdown } = entryDocument(ref);
  const url = canonicalUrl(meta.path);
  return { title: meta.title, url, markdown: absolutizeDocMarkdown(markdown, docLinkContext(ref), url) };
};

export const llmsDocuments = (): readonly LlmsDocument[] =>
  LLMS_FULL_ORDER.flatMap((collection) => getEntries(collection).map((meta) => entryLlmsDocument(meta.ref)));

export const llmsFull = (): string =>
  renderLlmsFull({ name: site.name, summary: LLMS_SUMMARY, documents: llmsDocuments() });

export const markdownTwins = (): readonly MarkdownTwin[] =>
  LLMS_FULL_ORDER.flatMap((collection) =>
    getEntries(collection).map((meta) => ({ path: meta.path, markdown: renderLlmsDocument(entryLlmsDocument(meta.ref)) })),
  );
