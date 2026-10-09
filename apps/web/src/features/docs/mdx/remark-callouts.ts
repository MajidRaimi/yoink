import { isParent, textOf, walk, type TreeNode, type TreeParent } from "./syntax-tree";

export const CALLOUT_KINDS = ["note", "tip", "important", "warning", "caution"] as const;

export type CalloutKind = (typeof CALLOUT_KINDS)[number];

export const CALLOUT_ATTRIBUTE = "data-callout";

const isCalloutKind = (value: string): value is CalloutKind => (CALLOUT_KINDS as readonly string[]).includes(value);

const ALERT_MARKER = /^\[!([A-Za-z]+)\]\s*/;
const LEADING_SEPARATOR = /^[\s:.]+/;

const trimLeadingText = (paragraph: TreeParent): void => {
  const first = paragraph.children[0];
  if (first === undefined || first.type !== "text" || typeof first.value !== "string") return;
  first.value = first.value.replace(LEADING_SEPARATOR, "");
  if (first.value.length === 0) paragraph.children.shift();
};

const takeStrongMarker = (paragraph: TreeParent): CalloutKind | null => {
  const first = paragraph.children[0];
  if (first === undefined || first.type !== "strong") return null;
  const kind = textOf(first).trim().replace(/:$/, "").toLowerCase();
  if (!isCalloutKind(kind)) return null;
  paragraph.children.shift();
  trimLeadingText(paragraph);
  return kind;
};

const takeAlertMarker = (paragraph: TreeParent): CalloutKind | null => {
  const first = paragraph.children[0];
  if (first === undefined || first.type !== "text" || typeof first.value !== "string") return null;
  const match = ALERT_MARKER.exec(first.value);
  const kind = match?.[1]?.toLowerCase();
  if (match === null || kind === undefined || !isCalloutKind(kind)) return null;
  first.value = first.value.slice(match[0].length);
  trimLeadingText(paragraph);
  return kind;
};

const markCallout = (blockquote: TreeParent): void => {
  const paragraph = blockquote.children[0];
  if (paragraph === undefined || paragraph.type !== "paragraph" || !isParent(paragraph)) return;
  const kind = takeAlertMarker(paragraph) ?? takeStrongMarker(paragraph);
  if (kind === null) return;
  if (paragraph.children.length === 0) blockquote.children.shift();
  blockquote.data = { ...blockquote.data, hProperties: { ...blockquote.data?.hProperties, [CALLOUT_ATTRIBUTE]: kind } };
};

export const remarkCallouts =
  (): ((tree: TreeNode) => void) =>
  (tree) => {
    walk(tree, (node) => {
      if (node.type === "blockquote" && isParent(node)) markCallout(node);
    });
  };
