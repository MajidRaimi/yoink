import type { DemoDefinition } from "@/shared/contract";

export type CounterState = {
  index: number;
  text: string;
  confirmed: boolean;
};

export const counterDemo: DemoDefinition<CounterState> = {
  id: "menu",
  label: "Counter fixture",
  initial: { index: 0, text: "", confirmed: false },
  reduce: (state, event) => {
    if (event.type === "text") return { ...state, text: state.text + event.value };
    if (event.type !== "key") return state;
    if (event.key === "down") return { ...state, index: state.index + 1 };
    if (event.key === "up") return { ...state, index: Math.max(0, state.index - 1) };
    if (event.key === "enter") return { ...state, confirmed: true };
    return state;
  },
  script: [
    { wait: 100, event: { type: "key", key: "down" } },
    { wait: 200, event: { type: "key", key: "down" } },
    { wait: 300, event: { type: "text", value: "a" } },
    { wait: 400, event: { type: "key", key: "enter" } },
  ],
};
