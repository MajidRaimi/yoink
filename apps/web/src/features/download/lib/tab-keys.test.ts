import { describe, expect, test } from "bun:test";
import { targetIndex } from "./tab-keys";

describe("targetIndex", () => {
  test("moves with the arrow keys and wraps around", () => {
    expect(targetIndex("ArrowRight", 0, 4)).toBe(1);
    expect(targetIndex("ArrowRight", 3, 4)).toBe(0);
    expect(targetIndex("ArrowLeft", 2, 4)).toBe(1);
    expect(targetIndex("ArrowLeft", 0, 4)).toBe(3);
  });

  test("jumps with Home and End", () => {
    expect(targetIndex("Home", 2, 4)).toBe(0);
    expect(targetIndex("End", 1, 4)).toBe(3);
  });

  test("ignores other keys and empty lists", () => {
    expect(targetIndex("Enter", 1, 4)).toBeNull();
    expect(targetIndex("ArrowDown", 1, 4)).toBeNull();
    expect(targetIndex("Tab", 1, 4)).toBeNull();
    expect(targetIndex("ArrowRight", 0, 0)).toBeNull();
  });
});
