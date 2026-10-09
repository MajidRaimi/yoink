import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ProcessorOptions } from "@mdx-js/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { entryForRepoPath, entryRepoPath, type EntryRef } from "../collections";
import { repoRoot } from "../docs-dir";
import { headingIdsFor } from "../headings";
import type { FaqMode } from "./faq-sections";
import { rehypeCodeCopy } from "./rehype-code-copy";
import { remarkCallouts } from "./remark-callouts";
import { remarkDocLinks, type DocLinkContext } from "./remark-doc-links";
import { remarkDropLeadingH1 } from "./remark-drop-leading-h1";
import { remarkFaq } from "./remark-faq";

export type PluginList = NonNullable<ProcessorOptions["remarkPlugins"]>;

export const CODE_THEMES = { light: "github-light-default", dark: "github-dark-default" } as const;

const prettyCodeOptions: PrettyCodeOptions = {
  theme: CODE_THEMES,
  keepBackground: false,
  bypassInlineCode: true,
  defaultLang: { block: "plaintext" },
};

export const docLinkContext = (source: EntryRef): DocLinkContext => ({
  source,
  sourceRepoPath: entryRepoPath(source),
  resolveEntry: entryForRepoPath,
  headingIds: headingIdsFor,
  repoFileExists: (repoPath) => existsSync(join(repoRoot(), repoPath)),
});

export const docRemarkPlugins = (context: DocLinkContext, faqMode: FaqMode | null = null): PluginList => [
  remarkGfm,
  remarkDropLeadingH1,
  [remarkDocLinks, context],
  remarkCallouts,
  [remarkFaq, faqMode],
];

export const docRehypePlugins = (): PluginList => [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["heading-anchor"] } }],
  [rehypePrettyCode, prettyCodeOptions],
  rehypeCodeCopy,
];
