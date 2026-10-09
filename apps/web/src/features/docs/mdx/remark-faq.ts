import { faqLayout, isFaqGroup, type FaqGroup, type FaqMode } from "./faq-sections";
import { isParent, type TreeNode } from "./syntax-tree";

const element = (type: string, className: string, children: TreeNode[]): TreeNode => ({
  type,
  children,
  data: { hName: "div", hProperties: { className: [className] } },
});

const faqItem = ({ question, answer }: FaqGroup): TreeNode =>
  element("faqItem", "doc-faq-item", [question, element("faqAnswer", "doc-faq-answer", [...answer])]);

export const transformFaq = (tree: TreeNode, mode: FaqMode): void => {
  const layout = faqLayout(tree, mode);
  if (layout === null || !isParent(tree)) return;
  const replaced = layout.segments.map((segment) => (isFaqGroup(segment) ? faqItem(segment) : segment));
  tree.children.splice(layout.start, layout.end - layout.start, ...replaced);
};

export const remarkFaq =
  (mode: FaqMode | null): ((tree: TreeNode) => void) =>
  (tree) => {
    if (mode !== null) transformFaq(tree, mode);
  };
