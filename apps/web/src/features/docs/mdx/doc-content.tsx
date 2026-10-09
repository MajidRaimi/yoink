import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { DocSlug } from "@/shared/lib/routes";
import { DocAnchor } from "../components/doc-anchor";
import { DocBlockquote } from "../components/doc-blockquote";
import { DocPre } from "../components/doc-pre";
import { DocTable } from "../components/doc-table";
import { getDoc } from "../content";
import { docLinkContext, docRehypePlugins, docRemarkPlugins } from "./pipeline";

type MdxModule = Awaited<ReturnType<typeof evaluate>>;

type DocComponents = NonNullable<Parameters<MdxModule["default"]>[0]["components"]>;

const components: DocComponents = {
  a: DocAnchor,
  pre: DocPre,
  table: DocTable,
  blockquote: DocBlockquote,
};

export const renderDocBody = async (slug: DocSlug, body: string): Promise<MdxModule["default"]> => {
  const module = await evaluate(body, {
    ...runtime,
    format: "md",
    remarkPlugins: docRemarkPlugins(docLinkContext(slug)),
    rehypePlugins: docRehypePlugins(),
  });
  return module.default;
};

export type DocContentProps = {
  slug: DocSlug;
};

export const DocContent = async ({ slug }: DocContentProps): Promise<React.JSX.Element> => {
  const Content = await renderDocBody(slug, getDoc(slug).body);
  return (
    <div className="doc-prose">
      <Content components={components} />
    </div>
  );
};
