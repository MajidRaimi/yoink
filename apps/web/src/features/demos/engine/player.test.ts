import { describe, expect, test } from "bun:test";
import { computeFinal } from "@/features/demos/engine/frames";
import { counterDemo } from "@/features/demos/engine/test-fixtures";
import { createPlayerReducer, initPlayer, type PlayerState } from "@/features/demos/engine/player";
import type { CounterState } from "@/features/demos/engine/test-fixtures";

const reduce = createPlayerReducer(counterDemo);

const advanceAll = (player: PlayerState<CounterState>): PlayerState<CounterState> =>
  counterDemo.script.reduce((current) => reduce(current, { type: "advance" }), player);

describe("player", () => {
  test("starts idle on the final frame", () => {
    const player = initPlayer(counterDemo);
    expect(player.mode).toBe("idle");
    expect(player.demo).toEqual(computeFinal(counterDemo));
  });

  test("start resets to the initial frame and enters auto mode", () => {
    const player = reduce(initPlayer(counterDemo), { type: "start" });
    expect(player).toEqual({ demo: counterDemo.initial, mode: "auto", cursor: 0 });
  });

  test("advancing through the script ends done on the final frame", () => {
    const player = advanceAll(reduce(initPlayer(counterDemo), { type: "start" }));
    expect(player.mode).toBe("done");
    expect(player.cursor).toBe(counterDemo.script.length);
    expect(player.demo).toEqual(computeFinal(counterDemo));
  });

  test("advance is ignored outside auto mode", () => {
    const idle = initPlayer(counterDemo);
    expect(reduce(idle, { type: "advance" })).toBe(idle);
  });

  test("user input switches to user mode and stops autoplay", () => {
    const started = reduce(initPlayer(counterDemo), { type: "start" });
    const typed = reduce(started, { type: "input", event: { type: "key", key: "down" } });
    expect(typed.mode).toBe("user");
    expect(typed.demo.index).toBe(1);
    expect(reduce(typed, { type: "advance" })).toBe(typed);
  });

  test("takeover keeps the current frame", () => {
    const started = reduce(reduce(initPlayer(counterDemo), { type: "start" }), { type: "advance" });
    const taken = reduce(started, { type: "takeover" });
    expect(taken.mode).toBe("user");
    expect(taken.demo).toEqual(started.demo);
  });

  test("settle jumps to the final frame", () => {
    const started = reduce(initPlayer(counterDemo), { type: "start" });
    const settled = reduce(started, { type: "settle" });
    expect(settled.mode).toBe("done");
    expect(settled.demo).toEqual(computeFinal(counterDemo));
  });
});
