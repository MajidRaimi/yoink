import { describe, expect, test } from "bun:test";
import { directionForKey, moveIndex } from "@/features/landing/hooks/roving-radio";

describe("roving radio", () => {
  test("maps arrow, home and end keys", () => {
    expect(directionForKey("ArrowRight")).toBe("next");
    expect(directionForKey("ArrowUp")).toBe("previous");
    expect(directionForKey("Home")).toBe("first");
    expect(directionForKey("Enter")).toBeUndefined();
  });

  test("wraps around both ends", () => {
    expect(moveIndex(1, 2, "next")).toBe(0);
    expect(moveIndex(0, 2, "previous")).toBe(1);
    expect(moveIndex(0, 3, "last")).toBe(2);
    expect(moveIndex(0, 0, "next")).toBe(-1);
  });
});
