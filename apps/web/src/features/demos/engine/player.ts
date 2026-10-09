import type { DemoDefinition, DemoEvent, DemoMode } from "@/shared/contract";
import { applyEvent, computeFinal } from "@/features/demos/engine/frames";

export type PlayerState<State> = {
  demo: State;
  mode: DemoMode;
  cursor: number;
};

export type PlayerAction<State> =
  | { type: "start" }
  | { type: "advance" }
  | { type: "settle" }
  | { type: "takeover" }
  | { type: "input"; event: DemoEvent }
  | { type: "patch"; update: (state: State) => State };

export const initPlayer = <State>(definition: DemoDefinition<State>): PlayerState<State> => ({
  demo: computeFinal(definition),
  mode: "idle",
  cursor: 0,
});

export const createPlayerReducer =
  <State>(definition: DemoDefinition<State>) =>
  (player: PlayerState<State>, action: PlayerAction<State>): PlayerState<State> => {
    switch (action.type) {
      case "start":
        return definition.script.length === 0
          ? { demo: definition.initial, mode: "done", cursor: 0 }
          : { demo: definition.initial, mode: "auto", cursor: 0 };
      case "advance": {
        if (player.mode !== "auto") return player;
        const step = definition.script[player.cursor];
        if (step === undefined) return { ...player, mode: "done" };
        const cursor = player.cursor + 1;
        return {
          demo: applyEvent(definition, player.demo, step.event),
          mode: cursor >= definition.script.length ? "done" : "auto",
          cursor,
        };
      }
      case "settle":
        return { demo: computeFinal(definition), mode: "done", cursor: definition.script.length };
      case "takeover":
        return player.mode === "user" ? player : { ...player, mode: "user" };
      case "input":
        return { ...player, demo: applyEvent(definition, player.demo, action.event), mode: "user" };
      case "patch": {
        const demo = action.update(player.demo);
        return demo === player.demo && player.mode === "user" ? player : { ...player, demo, mode: "user" };
      }
    }
  };
