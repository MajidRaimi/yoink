import { isParent, type TreeNode } from "./syntax-tree";

const SKIPPABLE: ReadonlySet<string> = new Set(["yaml", "toml"]);

export const dropLeadingH1 = (tree: TreeNode): void => {
  if (!isParent(tree)) return;
  const index = tree.children.findIndex((child) => !SKIPPABLE.has(child.type));
  const first = tree.children[index];
  if (first?.type === "heading" && first.depth === 1) tree.children.splice(index, 1);
};

export const remarkDropLeadingH1 = (): ((tree: TreeNode) => void) => dropLeadingH1;
