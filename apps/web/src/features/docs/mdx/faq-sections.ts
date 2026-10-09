import { isParent, textOf, type TreeNode } from "./syntax-tree";

export type FaqMode = "section" | "page";

export type FaqGroup = {
  readonly question: TreeNode;
  readonly answer: readonly TreeNode[];
};

export const FAQ_HEADING = "FAQ";

const isHeading = (node: TreeNode, depth: number): boolean => node.type === "heading" && node.depth === depth;

const faqRange = (children: readonly TreeNode[], mode: FaqMode): { start: number; end: number } | null => {
  if (mode === "page") return { start: 0, end: children.length };
  const heading = children.findIndex((node) => isHeading(node, 2) && textOf(node).trim() === FAQ_HEADING);
  if (heading === -1) return null;
  const next = children.findIndex((node, index) => index > heading && node.type === "heading" && (node.depth ?? 0) <= 2);
  return { start: heading + 1, end: next === -1 ? children.length : next };
};

export type FaqLayout = {
  readonly start: number;
  readonly end: number;
  readonly segments: readonly (TreeNode | FaqGroup)[];
};

export const isFaqGroup = (segment: TreeNode | FaqGroup): segment is FaqGroup => "question" in segment;

export const faqLayout = (tree: TreeNode, mode: FaqMode): FaqLayout | null => {
  if (!isParent(tree)) return null;
  const range = faqRange(tree.children, mode);
  if (range === null) return null;
  const segments: (TreeNode | FaqGroup)[] = [];
  for (const node of tree.children.slice(range.start, range.end)) {
    const last = segments.at(-1);
    if (isHeading(node, 3)) segments.push({ question: node, answer: [] });
    else if (node.type === "heading" || last === undefined || !isFaqGroup(last)) segments.push(node);
    else segments[segments.length - 1] = { question: last.question, answer: [...last.answer, node] };
  }
  return { ...range, segments };
};

export const faqGroups = (tree: TreeNode, mode: FaqMode): readonly FaqGroup[] =>
  (faqLayout(tree, mode)?.segments ?? []).filter(isFaqGroup);
