import type { DemoDefinition, DemoEvent, Step } from "@/shared/contract";

export const applyEvent = <State>(definition: DemoDefinition<State>, state: State, event: DemoEvent): State =>
  event.type === "reset" ? definition.initial : definition.reduce(state, event);

export const foldSteps = <State>(definition: DemoDefinition<State>, from: State, steps: readonly Step[]): State =>
  steps.reduce((state, step) => applyEvent(definition, state, step.event), from);

export const computeFinal = <State>(definition: DemoDefinition<State>): State =>
  foldSteps(definition, definition.initial, definition.script);

export const computeFrames = <State>(definition: DemoDefinition<State>): State[] =>
  definition.script.reduce<State[]>(
    (frames, step) => [...frames, applyEvent(definition, frames[frames.length - 1] ?? definition.initial, step.event)],
    [definition.initial],
  );

export const scriptDuration = (script: readonly Step[]): number => script.reduce((total, step) => total + step.wait, 0);
