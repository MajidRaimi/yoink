import { describe, expect, test } from "bun:test";
import {
  BIDIRECTIONAL_ROVING_KEYS,
  HORIZONTAL_ROVING_KEYS,
  directionForKey,
  moveIndex,
  rovingTarget,
} from "@/shared/lib/roving-index";

describe("roving index", () => {
  test("maps arrow, home and end keys", () => {
    expect(directionForKey("ArrowRight", BIDIRECTIONAL_ROVING_KEYS)).toBe("next");
    expect(directionForKey("ArrowUp", BIDIRECTIONAL_ROVING_KEYS)).toBe("previous");
    expect(directionForKey("Home", BIDIRECTIONAL_ROVING_KEYS)).toBe("first");
    expect(directionForKey("Enter", BIDIRECTIONAL_ROVING_KEYS)).toBeUndefined();
    expect(directionForKey("toString", BIDIRECTIONAL_ROVING_KEYS)).toBeUndefined();
  });

  test("horizontal keys ignore vertical arrows", () => {
    expect(directionForKey("ArrowDown", HORIZONTAL_ROVING_KEYS)).toBeUndefined();
    expect(directionForKey("ArrowLeft", HORIZONTAL_ROVING_KEYS)).toBe("previous");
  });

  test("wraps around both ends", () => {
    expect(moveIndex(1, 2, "next")).toBe(0);
    expect(moveIndex(0, 2, "previous")).toBe(1);
    expect(moveIndex(0, 3, "last")).toBe(2);
    expect(moveIndex(0, 0, "next")).toBe(-1);
  });

  test("resolves the target item for a key", () => {
    const items = ["a", "b", "c", "d"] as const;
    expect(rovingTarget(items, "d", "ArrowRight", HORIZONTAL_ROVING_KEYS)).toBe("a");
    expect(rovingTarget(items, "a", "ArrowLeft", HORIZONTAL_ROVING_KEYS)).toBe("d");
    expect(rovingTarget(items, "c", "Home", HORIZONTAL_ROVING_KEYS)).toBe("a");
    expect(rovingTarget(items, "b", "End", HORIZONTAL_ROVING_KEYS)).toBe("d");
    expect(rovingTarget(items, "b", "ArrowDown", HORIZONTAL_ROVING_KEYS)).toBeUndefined();
    expect(rovingTarget(items, "b", "Tab", HORIZONTAL_ROVING_KEYS)).toBeUndefined();
    expect(rovingTarget([], "a", "ArrowRight", HORIZONTAL_ROVING_KEYS)).toBeUndefined();
  });
});
