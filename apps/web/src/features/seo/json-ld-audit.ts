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

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

const normalizeText = (text: string): string => text.replace(/\s+/g, " ").trim();

export const visibleText = (html: string): string =>
  normalizeText(
    html
      .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&(?:amp|lt|gt|quot|nbsp|#x27|#39);/g, (entity) => HTML_ENTITIES[entity] ?? entity),
  );

const faqTexts = (node: JsonLdNode): readonly string[] => {
  const entities = node.mainEntity;
  if (!Array.isArray(entities)) return [];
  return entities.flatMap((entity: unknown) => {
    if (!isNode(entity)) return [];
    const answer = entity.acceptedAnswer;
    const answerText = isNode(answer) && typeof answer.text === "string" ? [answer.text] : [];
    return [...(typeof entity.name === "string" ? [entity.name] : []), ...answerText];
  });
};

export const auditFaqVisibility = (html: string): readonly JsonLdProblem[] => {
  const visible = visibleText(html);
  return extractJsonLdBlocks(html).flatMap((text, index) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return [];
    }
    return collectNodes(parsed)
      .filter((node) => node["@type"] === "FAQPage")
      .flatMap(faqTexts)
      .filter((value) => !visible.includes(normalizeText(value)))
      .map((value) => ({ block: index + 1, reason: `FAQPage text is not visible on the page: "${value.slice(0, 80)}"` }));
  });
};
