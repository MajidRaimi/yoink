import { describe, expect, test } from "bun:test";
import { parseDocBody } from "./parse-markdown";
import { CALLOUT_ATTRIBUTE, remarkCallouts } from "./remark-callouts";
import { textOf, type TreeNode } from "./syntax-tree";

const firstBlockquote = (markdown: string): TreeNode => {
  const tree = parseDocBody(markdown);
  remarkCallouts()(tree);
  const quote = tree.children?.find((node) => node.type === "blockquote");
  if (quote === undefined) throw new Error("no blockquote");
  return quote;
};

describe("remarkCallouts", () => {
  test("marks a bold Note marker and strips it", () => {
    const quote = firstBlockquote("> **Note**\n> Restart Claude Code after switching.");
    expect(quote.data?.hProperties?.[CALLOUT_ATTRIBUTE]).toBe("note");
    expect(textOf(quote).trim()).toBe("Restart Claude Code after switching.");
  });

  test("accepts an inline marker with a colon", () => {
    const quote = firstBlockquote("> **Warning:** keys are literal.");
    expect(quote.data?.hProperties?.[CALLOUT_ATTRIBUTE]).toBe("warning");
    expect(textOf(quote).trim()).toBe("keys are literal.");
  });

  test("accepts GitHub alert syntax", () => {
    const quote = firstBlockquote("> [!TIP]\n> Use --token-stdin.");
    expect(quote.data?.hProperties?.[CALLOUT_ATTRIBUTE]).toBe("tip");
    expect(textOf(quote).trim()).toBe("Use --token-stdin.");
  });

  test("leaves ordinary quotes alone", () => {
    const quote = firstBlockquote("> **Bold** opening that is not a callout.");
    expect(quote.data).toBeUndefined();
    expect(textOf(quote)).toContain("Bold");
  });
});
