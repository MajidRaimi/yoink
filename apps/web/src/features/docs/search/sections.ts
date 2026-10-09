import { sluggedHeadings } from "../headings-core";
import { parseDocBody } from "../mdx/parse-markdown";
import { isParent, textOf, type TreeNode } from "../mdx/syntax-tree";
import type { SearchSection } from "./search-options";

export type SearchPage = {
  path: string;
  title: string;
  description: string;
  group: string;
};

type Draft = {
  heading: string;
  anchor: string;
  parts: string[];
};

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

const toSection = (page: SearchPage, draft: Draft): SearchSection => ({
  id: draft.anchor.length === 0 ? page.path : `${page.path}#${draft.anchor}`,
  path: page.path,
  title: page.title,
  group: page.group,
  heading: draft.heading,
  anchor: draft.anchor,
  text: collapse(draft.parts.join(" ")),
});

export const docSections = (page: SearchPage, body: string): readonly SearchSection[] => {
  const tree: TreeNode = parseDocBody(body);
  const ids = new Map<TreeNode, string>(sluggedHeadings(tree).map((heading) => [heading.node, heading.id]));
  const drafts: Draft[] = [{ heading: page.title, anchor: "", parts: [page.description] }];
  for (const child of isParent(tree) ? tree.children : []) {
    const id = ids.get(child);
    if (child.type === "heading" && child.depth === 2 && id !== undefined) {
      drafts.push({ heading: collapse(textOf(child)), anchor: id, parts: [] });
      continue;
    }
    drafts.at(-1)?.parts.push(textOf(child));
  }
  return drafts.map((draft) => toSection(page, draft)).filter((section) => section.anchor.length === 0 || section.text.length > 0);
};
