import { describe, expect, test } from "bun:test";
import type { CommandIndexEntry } from "../command-query";
import { commandFilterCss } from "./command-filter-css";

const index: readonly CommandIndexEntry[] = [
  { id: "add", group: "accounts", text: "yoink add" },
  { id: "list", group: "accounts", text: "yoink list" },
  { id: "help", group: "info", text: "yoink help" },
];

describe("commandFilterCss", () => {
  test("emits nothing while not filtering", () => {
    expect(commandFilterCss(index, new Set(), false)).toBe("");
  });

  test("hides unmatched cards and reveals the empty state of groups with no matches", () => {
    expect(commandFilterCss(index, new Set(["add"]), true)).toBe(
      '[data-command-id="list"],[data-command-id="help"]{display:none}[data-command-empty="info"]{display:block}',
    );
  });

  test("hides nothing when every command matches", () => {
    expect(commandFilterCss(index, new Set(["add", "list", "help"]), true)).toBe("");
  });
});
