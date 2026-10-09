import { describe, expect, test } from "bun:test";
import { applyEvent, computeFinal, computeFrames, scriptDuration } from "@/features/demos/engine/frames";
import { counterDemo } from "@/features/demos/engine/test-fixtures";

describe("frames", () => {
  test("computeFinal folds the whole script through reduce", () => {
    expect(computeFinal(counterDemo)).toEqual({ index: 2, text: "a", confirmed: true });
  });

  test("computeFinal of an empty script is the initial state", () => {
    expect(computeFinal({ ...counterDemo, script: [] })).toBe(counterDemo.initial);
  });

  test("reset events return the initial state", () => {
    const moved = applyEvent(counterDemo, counterDemo.initial, { type: "key", key: "down" });
    expect(applyEvent(counterDemo, moved, { type: "reset" })).toBe(counterDemo.initial);
  });

  test("computeFrames returns one frame per step plus the initial frame", () => {
    const frames = computeFrames(counterDemo);
    expect(frames).toHaveLength(counterDemo.script.length + 1);
    expect(frames[0]).toBe(counterDemo.initial);
    expect(frames.at(-1)).toEqual(computeFinal(counterDemo));
  });

  test("scriptDuration sums every wait", () => {
    expect(scriptDuration(counterDemo.script)).toBe(1000);
  });
});
