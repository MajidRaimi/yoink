import { site } from "@/shared/brand/site";
import { sluggedHeadings } from "./headings-core";
import { faqGroups, type FaqMode } from "./mdx/faq-sections";
import { parseMarkdown } from "./mdx/parse-markdown";
import { isParent, textOf, type TreeNode } from "./mdx/syntax-tree";

export type EntryBodyParts = {
  readonly title: string;
  readonly leadMarkdown: string;
  readonly restMarkdown: string;
};

export type FaqQuestion = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export class EntryBodyError extends Error {
  constructor(source: string, problem: string) {
    super(`${source}: ${problem}`);
    this.name = "EntryBodyError";
  }
}

type Span = { readonly start: number; readonly end: number };

export const ALSO_AT_PREFIX = "Also at ";

const SKIPPED: ReadonlySet<string> = new Set(["yaml", "toml"]);

const spanOf = (node: TreeNode | undefined): Span | null => {
  if (node === undefined) return null;
  const position: unknown = Reflect.get(node, "position");
  if (typeof position !== "object" || position === null) return null;
  const start: unknown = Reflect.get(Reflect.get(position, "start") ?? {}, "offset");
  const end: unknown = Reflect.get(Reflect.get(position, "end") ?? {}, "offset");
  return typeof start === "number" && typeof end === "number" ? { start, end } : null;
};

export const alsoAtLine = (path: string): string => {
  const host = new URL(site.url).host;
  return `${ALSO_AT_PREFIX}[${host}${path}](${site.url}${path}).`;
};

const isAlsoAt = (node: TreeNode | undefined, path: string): boolean => {
  if (node?.type !== "paragraph") return false;
  const link = node.children?.find((child) => child.type === "link");
  const text = textOf(node).trim().replace(/\.$/, "");
  return link?.url === `${site.url}${path}` && text === `${ALSO_AT_PREFIX}${new URL(site.url).host}${path}`;
};

export const splitEntryBody = (source: string, body: string, path: string): EntryBodyParts => {
  const tree = parseMarkdown(body);
  const nodes = isParent(tree) ? tree.children.filter((node) => !SKIPPED.has(node.type)) : [];
  const [heading, alsoAt, lead] = nodes;
  if (heading?.type !== "heading" || heading.depth !== 1) throw new EntryBodyError(source, "must start with a single # h1");
  if (!isAlsoAt(alsoAt, path)) throw new EntryBodyError(source, `the line under the h1 must be exactly: ${alsoAtLine(path)}`);
  if (lead?.type !== "paragraph") throw new EntryBodyError(source, "the answer-first lead paragraph must follow the Also at line");
  const leadSpan = spanOf(lead);
  if (leadSpan === null) throw new EntryBodyError(source, "cannot locate the lead paragraph");
  return {
    title: textOf(heading).trim(),
    leadMarkdown: body.slice(leadSpan.start, leadSpan.end).trim(),
    restMarkdown: body.slice(leadSpan.end).trim(),
  };
};

export const composeEntryMarkdown = (parts: EntryBodyParts, factsMarkdown: string | null): string =>
  [`# ${parts.title}`, parts.leadMarkdown, ...(factsMarkdown === null ? [] : [factsMarkdown]), parts.restMarkdown]
    .filter((block) => block.length > 0)
    .join("\n\n")
    .concat("\n");

const collapse = (text: string): string => text.replace(/\s+/g, " ").trim();

export const faqQuestions = (markdown: string, mode: FaqMode): readonly FaqQuestion[] => {
  const tree = parseMarkdown(markdown);
  const ids = new Map(sluggedHeadings(tree).map((heading) => [heading.node, heading.id]));
  return faqGroups(tree, mode).map((group) => ({
    id: ids.get(group.question) ?? "",
    question: collapse(textOf(group.question)),
    answer: collapse(group.answer.map(textOf).join(" ")),
  }));
};

const PHRASING_PARENTS: ReadonlySet<string> = new Set(["paragraph", "heading", "tableCell", "emphasis", "strong", "link", "delete"]);

const proseText = (node: TreeNode): string => {
  if (node.type === "code" || node.type === "html") return "";
  if (typeof node.value === "string") return node.value;
  if (!isParent(node)) return "";
  return node.children.map(proseText).join(PHRASING_PARENTS.has(node.type) ? "" : " ");
};

export const wordCount = (markdown: string): number => {
  const text = collapse(proseText(parseMarkdown(markdown)));
  return text.length === 0 ? 0 : text.split(" ").length;
};
