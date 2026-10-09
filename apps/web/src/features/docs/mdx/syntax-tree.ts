export type TreeData = {
  hName?: string;
  hProperties?: Record<string, unknown>;
};

export type TreeNode = {
  type: string;
  value?: string;
  url?: string;
  depth?: number;
  lang?: string | null;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: TreeNode[];
  data?: TreeData;
};

export type TreeParent = TreeNode & { children: TreeNode[] };

export const isParent = (node: TreeNode): node is TreeParent => Array.isArray(node.children);

export const walk = (node: TreeNode, visit: (node: TreeNode, parent: TreeParent | null) => void, parent: TreeParent | null = null): void => {
  visit(node, parent);
  if (!isParent(node)) return;
  for (const child of [...node.children]) walk(child, visit, node);
};

export const textOf = (node: TreeNode): string => {
  if (typeof node.value === "string") return node.value;
  if (!isParent(node)) return "";
  return node.children.map(textOf).join("");
};
