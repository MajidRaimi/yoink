import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { isParent, textOf, walk, type TreeNode } from "../mdx/syntax-tree";

export type HarnessTableRow = {
  readonly id: string;
  readonly configPath: string;
  readonly format: string;
  readonly defaultModel: string;
};

export class HarnessTableError extends Error {
  constructor(problem: string) {
    super(`docs/harnesses.md: ${problem}`);
    this.name = "HarnessTableError";
  }
}

export const HARNESS_ID_COLUMN = "Id";

export const HARNESS_CONFIG_COLUMN = "Config yoink writes";

const HARNESS_FORMAT_COLUMN = "Format";

const HARNESS_DEFAULT_COLUMN = "Default model";

const OVERRIDES_HEADING = "Paths and overrides";

const ENV_NAME = /^[A-Z][A-Z0-9_]*(?:\/[a-z0-9-]+)?$/;

const parser = createProcessor({ format: "md", remarkPlugins: [remarkGfm] });

const parse = (markdown: string): TreeNode => parser.parse(markdown);

export const cellMarkdown = (cell: TreeNode): string =>
  (cell.children ?? [])
    .map((child) => (child.type === "inlineCode" ? `\`${child.value ?? ""}\`` : textOf(child)))
    .join("")
    .trim();

const rowCells = (row: TreeNode | undefined): readonly TreeNode[] => row?.children ?? [];

const findTable = (tree: TreeNode): TreeNode | null => {
  let found: TreeNode | null = null;
  walk(tree, (node) => {
    if (found !== null || node.type !== "table") return;
    const header = rowCells(node.children?.[0]).map(textOf);
    if (header.includes(HARNESS_ID_COLUMN) && header.includes(HARNESS_CONFIG_COLUMN)) found = node;
  });
  return found;
};

const requireColumn = (columns: readonly string[], name: string): number => {
  const index = columns.indexOf(name);
  if (index === -1) throw new HarnessTableError(`the harness table has no "${name}" column`);
  return index;
};

export const parseHarnessTable = (markdown: string): ReadonlyMap<string, HarnessTableRow> => {
  const table = findTable(parse(markdown));
  if (table === null) throw new HarnessTableError(`no table with "${HARNESS_ID_COLUMN}" and "${HARNESS_CONFIG_COLUMN}" columns`);
  const [header, ...rows] = table.children ?? [];
  const columns = rowCells(header).map(textOf);
  const idColumn = requireColumn(columns, HARNESS_ID_COLUMN);
  const configColumn = requireColumn(columns, HARNESS_CONFIG_COLUMN);
  const formatColumn = requireColumn(columns, HARNESS_FORMAT_COLUMN);
  const defaultColumn = requireColumn(columns, HARNESS_DEFAULT_COLUMN);
  return new Map(
    rows.flatMap((row) => {
      const cells = rowCells(row);
      const cell = (index: number): string => {
        const node = cells[index];
        return node === undefined ? "" : cellMarkdown(node);
      };
      const id = textOf(cells[idColumn] ?? { type: "text", value: "" }).trim();
      if (id.length === 0) return [];
      return [[id, { id, configPath: cell(configColumn), format: cell(formatColumn), defaultModel: cell(defaultColumn) }] as const];
    }),
  );
};

const sectionAfterHeading = (tree: TreeNode, heading: string): readonly TreeNode[] => {
  if (!isParent(tree)) return [];
  const start = tree.children.findIndex((node) => node.type === "heading" && textOf(node).trim() === heading);
  if (start === -1) return [];
  const depth = tree.children[start]?.depth ?? 0;
  const rest = tree.children.slice(start + 1);
  const end = rest.findIndex((node) => node.type === "heading" && (node.depth ?? 0) <= depth);
  return end === -1 ? rest : rest.slice(0, end);
};

const overridesOf = (item: TreeNode): { label: string; names: readonly string[] } | null => {
  const paragraph = item.children?.[0];
  const parts = paragraph?.children ?? [];
  const [label, lead] = parts;
  if (label?.type !== "strong" || lead?.type !== "text" || !(lead.value ?? "").trimStart().startsWith("follows")) return null;
  const names: string[] = [];
  for (const part of parts.slice(1)) {
    if (part.type === "text" && (part.value ?? "").includes(".")) break;
    if (part.type === "inlineCode" && ENV_NAME.test(part.value ?? "")) names.push(part.value ?? "");
  }
  return { label: textOf(label).trim(), names };
};

export const parseEnvOverrides = (markdown: string): ReadonlyMap<string, readonly string[]> => {
  const section = sectionAfterHeading(parse(markdown), OVERRIDES_HEADING);
  const list = section.find((node) => node.type === "list");
  if (list === undefined) throw new HarnessTableError(`no list under "${OVERRIDES_HEADING}"`);
  return new Map((list.children ?? []).flatMap((item) => {
    const parsed = overridesOf(item);
    return parsed === null ? [] : [[parsed.label, parsed.names] as const];
  }));
};
