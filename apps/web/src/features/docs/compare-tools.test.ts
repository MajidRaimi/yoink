import { describe, expect, test } from "bun:test";
import { compareToolList } from "./compare-tools";

describe("compareToolList", () => {
  test("lists the linked tools from the first column of the Tool table", () => {
    const markdown = [
      "| Feature | x |",
      "| --- | --- |",
      "| [ignored](https://a.example) | y |",
      "",
      "| Tool | Kind |",
      "| --- | --- |",
      "| [claude-swap](https://github.com/realiti4/claude-swap) | CLI |",
      "| plain text | CLI |",
      "| [local](../usage.md) | CLI |",
    ].join("\n");
    expect(compareToolList(markdown)).toEqual([{ name: "claude-swap", url: "https://github.com/realiti4/claude-swap" }]);
  });
});
