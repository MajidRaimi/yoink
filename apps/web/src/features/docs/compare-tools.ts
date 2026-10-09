import { parseMarkdown } from "./mdx/parse-markdown";
import { textOf, walk, type TreeNode } from "./mdx/syntax-tree";

export type ComparedTool = {
  readonly name: string;
  readonly url: string;
};

export const TOOL_COLUMN = "Tool";

const firstLink = (cell: TreeNode | undefined): TreeNode | undefined => {
  let found: TreeNode | undefined;
  if (cell === undefined) return undefined;
  walk(cell, (node) => {
    if (found === undefined && node.type === "link") found = node;
  });
  return found;
};

export const compareToolList = (markdown: string): readonly ComparedTool[] => {
  let table: TreeNode | undefined;
  walk(parseMarkdown(markdown), (node) => {
    if (table !== undefined || node.type !== "table") return;
    const header = node.children?.[0]?.children?.[0];
    if (header !== undefined && textOf(header).trim() === TOOL_COLUMN) table = node;
  });
  return (table?.children ?? []).slice(1).flatMap((row) => {
    const link = firstLink(row.children?.[0]);
    const url = link?.url ?? "";
    return link !== undefined && url.startsWith("https://") ? [{ name: textOf(link).trim(), url }] : [];
  });
};
