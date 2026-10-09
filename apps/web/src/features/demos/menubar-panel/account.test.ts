import { describe, expect, test } from "bun:test";
import { panelAccountAdapter } from "@/features/demos/menubar-panel/account";
import { connectionsFor, initialPanelState, reducePanel } from "@/features/demos/menubar-panel/machine";

describe("panel account adapter", () => {
  test("reads the active profile", () => {
    expect(panelAccountAdapter.read(initialPanelState)).toBe(initialPanelState.current);
  });

  test("writing a Claude account switches without a dialog", () => {
    const state = panelAccountAdapter.write(initialPanelState, "side");
    expect(state.current).toBe("side");
    expect(state.lastClaudeAccount).toBe("side");
    expect(state.dialog).toBeNull();
    expect(state.status).toBe("Claude Code is on side. The terminal switched it.");
  });

  test("writing a provider connects it to Claude Code and keeps the last account", () => {
    const state = panelAccountAdapter.write(initialPanelState, "openrouter");
    expect(state.current).toBe("openrouter");
    expect(state.lastClaudeAccount).toBe(initialPanelState.lastClaudeAccount);
    expect(connectionsFor(state, "openrouter")).toContain("claude-code");
  });

  test("a pending dialog closes when the other surface switches", () => {
    const asking = reducePanel({ ...initialPanelState, listIndex: 1 }, { type: "key", key: "enter" });
    expect(asking.dialog).not.toBeNull();
    expect(panelAccountAdapter.write(asking, "side").dialog).toBeNull();
  });

  test("unknown names and the current profile leave the state untouched", () => {
    expect(panelAccountAdapter.write(initialPanelState, "nobody")).toBe(initialPanelState);
    expect(panelAccountAdapter.write(initialPanelState, initialPanelState.current)).toBe(initialPanelState);
  });
});
