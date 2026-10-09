import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { dropLeadingH1 } from "./remark-drop-leading-h1";
import type { TreeNode } from "./syntax-tree";

const parser = createProcessor({ format: "md", remarkPlugins: [remarkGfm] });

export const parseDocBody = (body: string): TreeNode => {
  const tree: TreeNode = parser.parse(body);
  dropLeadingH1(tree);
  return tree;
};
