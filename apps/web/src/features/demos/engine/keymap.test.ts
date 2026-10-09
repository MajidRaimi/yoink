import { describe, expect, test } from "bun:test";
import { keyLabel, toDemoEvent } from "@/features/demos/engine/keymap";

describe("toDemoEvent", () => {
  test.each([
    ["ArrowUp", "up"],
    ["ArrowDown", "down"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
    ["Enter", "enter"],
    ["Escape", "escape"],
    ["Backspace", "backspace"],
    [" ", "space"],
  ] as const)("maps %s to %s", (key, expected) => {
    expect(toDemoEvent({ key })).toEqual({ type: "key", key: expected });
  });

  test("maps j and k to down and up outside text mode", () => {
    expect(toDemoEvent({ key: "j" })).toEqual({ type: "key", key: "down" });
    expect(toDemoEvent({ key: "k" })).toEqual({ type: "key", key: "up" });
  });

  test("keeps j, k and space as text in text mode", () => {
    expect(toDemoEvent({ key: "j" }, { textMode: true })).toEqual({ type: "text", value: "j" });
    expect(toDemoEvent({ key: "k" }, { textMode: true })).toEqual({ type: "text", value: "k" });
    expect(toDemoEvent({ key: " " }, { textMode: true })).toEqual({ type: "text", value: " " });
  });

  test("named keys still work in text mode", () => {
    expect(toDemoEvent({ key: "Enter" }, { textMode: true })).toEqual({ type: "key", key: "enter" });
  });

  test("other printable characters become text", () => {
    expect(toDemoEvent({ key: "a" })).toEqual({ type: "text", value: "a" });
    expect(toDemoEvent({ key: "7" })).toEqual({ type: "text", value: "7" });
  });

  test("ignores modified keys, Tab and other non printable keys", () => {
    expect(toDemoEvent({ key: "c", metaKey: true })).toBeNull();
    expect(toDemoEvent({ key: "j", ctrlKey: true })).toBeNull();
    expect(toDemoEvent({ key: "j", altKey: true })).toBeNull();
    expect(toDemoEvent({ key: "Tab" })).toBeNull();
    expect(toDemoEvent({ key: "Shift" })).toBeNull();
    expect(toDemoEvent({ key: "F5" })).toBeNull();
  });

  test("keyLabel returns readable labels", () => {
    expect(keyLabel("enter")).toBe("Enter");
    expect(keyLabel("down")).toBe("↓");
  });
});
