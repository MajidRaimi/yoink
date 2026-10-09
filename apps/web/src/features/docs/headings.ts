import GithubSlugger from "github-slugger";
import type { DocHeading } from "@/shared/contract";
import type { DocSlug } from "@/shared/lib/routes";
import { getDoc } from "./content";
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

const idCache = new Map<DocSlug, ReadonlySet<string>>();

export const headingIdsFor = (slug: DocSlug): ReadonlySet<string> => {
  const cached = idCache.get(slug);
  if (cached !== undefined) return cached;
  const ids = new Set(sluggedHeadings(parseDocBody(getDoc(slug).body)).map((heading) => heading.id));
  idCache.set(slug, ids);
  return ids;
};

export const docHeadings = (slug: DocSlug): readonly DocHeading[] => extractHeadings(getDoc(slug).body);
