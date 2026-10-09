import { isParent, textOf, walk, type TreeNode } from "./syntax-tree";

export const COPY_ATTRIBUTE = "data-copy";

const isFigure = (node: TreeNode): boolean =>
  node.type === "element" &&
  node.tagName === "figure" &&
  node.properties !== undefined &&
  "data-rehype-pretty-code-figure" in node.properties;

export const codeTextOf = (pre: TreeNode): string => textOf(pre).replace(/\n$/, "");

export const rehypeCodeCopy =
  (): ((tree: TreeNode) => void) =>
  (tree) => {
    walk(tree, (node) => {
      if (!isFigure(node) || !isParent(node)) return;
      for (const child of node.children) {
        if (child.type === "element" && child.tagName === "pre") {
          child.properties = { ...child.properties, [COPY_ATTRIBUTE]: codeTextOf(child) };
        }
      }
    });
  };
