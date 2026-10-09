import { describe, expect, test } from "bun:test";
import { themeColorFor, themeColors } from "./theme-colors";

describe("themeColorFor", () => {
  test("maps dark to the dark surface", () => {
    expect(themeColorFor("dark")).toBe(themeColors.dark);
  });

  test("falls back to light before the theme resolves", () => {
    expect(themeColorFor(undefined)).toBe(themeColors.light);
    expect(themeColorFor("light")).toBe(themeColors.light);
  });
});
