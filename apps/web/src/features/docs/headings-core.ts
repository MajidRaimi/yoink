import GithubSlugger from "github-slugger";
import type { DocHeading } from "@/shared/contract";
import { parseDocBody } from "./mdx/parse-markdown";
import { textOf, walk, type TreeNode } from "./mdx/syntax-tree";

export type SluggedHeading = {
  node: TreeNode;
  id: string;
  text: string;
  depth: number;
};

const isTocDepth = (depth: number): depth is DocHeading["depth"] => depth === 2 || depth === 3;

export const sluggedHeadings = (tree: TreeNode): readonly SluggedHeading[] => {
  const slugger = new GithubSlugger();
  const headings: SluggedHeading[] = [];
  walk(tree, (node) => {
    if (node.type !== "heading" || typeof node.depth !== "number") return;
    const raw = textOf(node);
    headings.push({ node, id: slugger.slug(raw), text: raw.trim(), depth: node.depth });
  });
  return headings;
};

export const tocHeadings = (headings: readonly SluggedHeading[]): readonly DocHeading[] =>
  headings.flatMap(({ id, text, depth }) => (isTocDepth(depth) ? [{ id, text, depth }] : []));

export const extractHeadings = (body: string): readonly DocHeading[] => tocHeadings(sluggedHeadings(parseDocBody(body)));

export const headingIdSet = (body: string): ReadonlySet<string> =>
  new Set(sluggedHeadings(parseDocBody(body)).map((heading) => heading.id));
