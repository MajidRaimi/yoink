import type { DocMeta } from "@/shared/contract";
import { sluggedHeadings } from "../headings";
import { parseDocBody } from "../mdx/parse-markdown";
import { isParent, textOf, type TreeNode } from "../mdx/syntax-tree";
import type { SearchSection } from "./search-options";

type Draft = {
  heading: string;
  anchor: string;
  parts: string[];
};

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

const toSection = (meta: DocMeta, draft: Draft): SearchSection => ({
  id: draft.anchor.length === 0 ? meta.slug : `${meta.slug}#${draft.anchor}`,
  slug: meta.slug,
  title: meta.title,
  section: meta.section,
  heading: draft.heading,
  anchor: draft.anchor,
  text: collapse(draft.parts.join(" ")),
});

export const docSections = (meta: DocMeta, body: string): readonly SearchSection[] => {
  const tree = parseDocBody(body);
  const ids = new Map<TreeNode, string>(sluggedHeadings(tree).map((heading) => [heading.node, heading.id]));
  const drafts: Draft[] = [{ heading: meta.title, anchor: "", parts: [meta.description] }];
  for (const child of isParent(tree) ? tree.children : []) {
    const id = ids.get(child);
    if (child.type === "heading" && child.depth === 2 && id !== undefined) {
      drafts.push({ heading: collapse(textOf(child)), anchor: id, parts: [] });
      continue;
    }
    drafts.at(-1)?.parts.push(textOf(child));
  }
  return drafts.map((draft) => toSection(meta, draft)).filter((section) => section.anchor.length === 0 || section.text.length > 0);
};
