import { describe, expect, test } from "bun:test";
import { menuAccountAdapter } from "@/features/demos/menu/account";
import { cursorForCurrent, initial } from "@/features/demos/menu/machine";

describe("menu account adapter", () => {
  test("reads the active Claude Code profile", () => {
    expect(menuAccountAdapter.read(initial)).toBe(initial.current);
  });

  test("writing a known profile moves the active marker and the cursor", () => {
    const state = menuAccountAdapter.write(initial, "personal");
    expect(state.current).toBe("personal");
    expect(state.cursor).toBe(cursorForCurrent("personal"));
    expect(state.outcome).toEqual({ kind: "none" });
    expect(state.currentByTool).toEqual(initial.currentByTool);
  });

  test("writing a provider marks it as the Claude Code profile", () => {
    expect(menuAccountAdapter.write(initial, "fuse").current).toBe("fuse");
  });

  test("unknown names and the current profile leave the state untouched", () => {
    expect(menuAccountAdapter.write(initial, "nobody")).toBe(initial);
    expect(menuAccountAdapter.write(initial, initial.current ?? "")).toBe(initial);
    expect(menuAccountAdapter.write(initial, "codex-work")).toBe(initial);
  });
});
