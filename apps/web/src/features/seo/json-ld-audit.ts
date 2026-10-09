import { CROSS_PAGE_ENTITY_IDS, type JsonLdNode } from "./entities";

export type JsonLdProblem = {
  block: number;
  reason: string;
};

const JSON_LD_BLOCK = /<script\b[^>]*\btype="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

const FORBIDDEN_KEYS: readonly string[] = ["aggregateRating", "review"];

export const extractJsonLdBlocks = (html: string): readonly string[] =>
  [...html.matchAll(JSON_LD_BLOCK)].map((match) => match[1] ?? "");

const isNode = (value: unknown): value is JsonLdNode => typeof value === "object" && value !== null && !Array.isArray(value);

const isReference = (node: JsonLdNode): boolean => Object.keys(node).length === 1 && typeof node["@id"] === "string";

const collectNodes = (value: unknown): readonly JsonLdNode[] => {
  if (Array.isArray(value)) return value.flatMap(collectNodes);
  if (!isNode(value)) return [];
  return [value, ...Object.values(value).flatMap(collectNodes)];
};

export const auditJsonLdBlock = (text: string, block: number): readonly JsonLdProblem[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return [{ block, reason: `invalid JSON: ${reason}` }];
  }
  const nodes = collectNodes(parsed);
  const declared = new Set(
    nodes.filter((node) => !isReference(node)).flatMap((node) => (typeof node["@id"] === "string" ? [node["@id"]] : [])),
  );
  const dangling = nodes
    .filter(isReference)
    .map((node) => String(node["@id"]))
    .filter((id) => !declared.has(id) && !CROSS_PAGE_ENTITY_IDS.has(id))
    .map((id) => ({ block, reason: `@id ${id} is referenced but never declared` }));
  const forbidden = nodes
    .flatMap((node) => FORBIDDEN_KEYS.filter((key) => key in node))
    .map((key) => ({ block, reason: `"${key}" is not allowed: there are no real ratings or reviews to cite` }));
  return [...dangling, ...forbidden];
};

export const auditJsonLdHtml = (html: string): readonly JsonLdProblem[] =>
  extractJsonLdBlocks(html).flatMap((text, index) => auditJsonLdBlock(text, index + 1));
