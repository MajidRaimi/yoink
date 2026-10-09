import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { DocSlug } from "@/shared/lib/routes";
import type { EntryRef } from "../collections";
import { DocAnchor } from "../components/doc-anchor";
import { DocBlockquote } from "../components/doc-blockquote";
import { DocPre } from "../components/doc-pre";
import { DocTable } from "../components/doc-table";
import { getDoc } from "../content";
import type { FaqMode } from "./faq-sections";
import { docLinkContext, docRehypePlugins, docRemarkPlugins } from "./pipeline";

type MdxModule = Awaited<ReturnType<typeof evaluate>>;

type DocComponents = NonNullable<Parameters<MdxModule["default"]>[0]["components"]>;

const components: DocComponents = {
  a: DocAnchor,
  pre: DocPre,
  table: DocTable,
  blockquote: DocBlockquote,
};

export const renderMarkdown = async (source: EntryRef, markdown: string, faqMode: FaqMode | null = null): Promise<MdxModule["default"]> => {
  const module = await evaluate(markdown, {
    ...runtime,
    format: "md",
    remarkPlugins: docRemarkPlugins(docLinkContext(source), faqMode),
    rehypePlugins: docRehypePlugins(),
  });
  return module.default;
};

export type MarkdownContentProps = {
  source: EntryRef;
  markdown: string;
  faqMode?: FaqMode | null;
  className?: string;
};

export const MarkdownContent = async ({ source, markdown, faqMode = null, className = "doc-prose" }: MarkdownContentProps): Promise<React.JSX.Element> => {
  const Content = await renderMarkdown(source, markdown, faqMode);
  return (
    <div className={className}>
      <Content components={components} />
    </div>
  );
};

export type DocContentProps = {
  slug: DocSlug;
};

export const DocContent = ({ slug }: DocContentProps): Promise<React.JSX.Element> =>
  MarkdownContent({ source: { collection: "docs", slug }, markdown: getDoc(slug).body });
