import { describe, expect, test } from "bun:test";
import { parseMarkdown } from "./parse-markdown";
import { transformFaq } from "./remark-faq";
import type { TreeNode } from "./syntax-tree";

const types = (tree: TreeNode): readonly string[] => (tree.children ?? []).map((node) => node.data?.hName ?? node.type);

describe("transformFaq", () => {
  test("groups each FAQ question with its answer in a visible block", () => {
    const tree = parseMarkdown("## Setup\n\nText.\n\n## FAQ\n\n### One?\n\nYes.\n\nMore.\n\n### Two?\n\nNo.\n\n## After\n\nEnd.");
    transformFaq(tree, "section");
    expect(types(tree)).toEqual(["heading", "paragraph", "heading", "div", "div", "heading", "paragraph"]);
    const [question, answer] = tree.children?.[3]?.children ?? [];
    expect(question?.type).toBe("heading");
    expect(answer?.children).toHaveLength(2);
  });

  test("leaves a page without a FAQ heading untouched", () => {
    const tree = parseMarkdown("## Setup\n\n### Step\n\nText.");
    transformFaq(tree, "section");
    expect(types(tree)).toEqual(["heading", "heading", "paragraph"]);
  });
});
