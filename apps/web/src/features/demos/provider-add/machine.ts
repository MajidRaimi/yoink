import type { DemoEvent, DemoKey } from "@/shared/contract";
import type { HarnessId } from "@/features/demos/data/harnesses.gen";
import { HARNESSES } from "@/features/demos/data/harnesses.gen";
import { harnessRows, isEnabledRow, setsDefaultModel } from "@/features/demos/provider-add/harness-rows";
import { PRESET_OPTIONS, sourceFor, type ProviderSource } from "@/features/demos/provider-add/sources";

export type Phase = "preset" | "key" | "models" | "harnesses" | "claudeDefault" | "default" | "done" | "cancelled";

export type Outcome = "connected" | "resynced" | "unchanged";

export type State = {
  phase: Phase;
  presetCursor: number;
  source: ProviderSource | null;
  key: string;
  query: string;
  modelCursor: number;
  draftModels: readonly string[];
  savedModels: readonly string[];
  editing: boolean;
  harnessCursor: number;
  checked: readonly HarnessId[];
  defaultCursor: number;
  claudeModel: string | null;
  connected: readonly HarnessId[];
  defaultModel: string | null;
  outcome: Outcome;
  syncRound: number;
  error: string | null;
  message: string | null;
};

export const KEEP_DEFAULT_LABEL = "Keep each harness's current default";
export const REQUIRED_MESSAGE = "This field is required";
export const SELECT_ONE_MESSAGE = "Please select at least one item";
export const CANCELLED_MESSAGE = "Cancelled.";
export const NO_CHANGES_MESSAGE = "No changes.";
export const STOPPED_MESSAGE = "Stopped before connecting.";

export const initial: State = {
  phase: "preset",
  presetCursor: 0,
  source: null,
  key: "",
  query: "",
  modelCursor: 0,
  draftModels: [],
  savedModels: [],
  editing: false,
  harnessCursor: 0,
  checked: [],
  defaultCursor: 0,
  claudeModel: null,
  connected: [],
  defaultModel: null,
  outcome: "unchanged",
  syncRound: 0,
  error: null,
  message: null,
};

const wrap = (index: number, length: number): number => (length === 0 ? 0 : (index + length) % length);

const stepFor = (key: DemoKey): number => {
  if (key === "down") return 1;
  if (key === "up") return -1;
  return 0;
};

const toggleIn = <Item extends string>(items: readonly Item[], item: Item, order: readonly Item[]): Item[] => {
  const next = items.includes(item) ? items.filter((existing) => existing !== item) : [...items, item];
  return order.filter((candidate) => next.includes(candidate));
};

export const filteredModels = (state: State): readonly string[] => {
  const models = state.source?.models ?? [];
  const query = state.query.trim().toLowerCase();
  return query === "" ? models : models.filter((model) => model.toLowerCase().includes(query));
};

const CLAUDE_CODE: HarnessId = "claude-code";

export const addedHarnesses = (state: State): readonly HarnessId[] =>
  state.checked.filter((id) => !state.connected.includes(id));

export const sharedDefaultTargets = (state: State): readonly HarnessId[] =>
  addedHarnesses(state).filter((id) => id !== CLAUDE_CODE && setsDefaultModel(id));

export const defaultTargets = (state: State): readonly HarnessId[] =>
  state.phase === "claudeDefault" ? [CLAUDE_CODE] : sharedDefaultTargets(state);

export const defaultOptions = (state: State): readonly string[] =>
  state.phase === "claudeDefault" ? state.savedModels : [KEEP_DEFAULT_LABEL, ...state.savedModels];

export const isTextPhase = (state: State): boolean => state.phase === "key" || state.phase === "models";

const cancel = (state: State, message: string): State => ({ ...initial, phase: "cancelled", message, syncRound: state.syncRound });

const reducePreset = (state: State, event: DemoEvent): State => {
  if (event.type !== "key") return state;
  if (event.key === "escape") return cancel(state, CANCELLED_MESSAGE);
  if (event.key === "enter") {
    const option = PRESET_OPTIONS[state.presetCursor];
    if (option === undefined) return state;
    return { ...state, phase: "key", source: sourceFor(option.id), key: "", error: null };
  }
  const step = stepFor(event.key);
  return step === 0 ? state : { ...state, presetCursor: wrap(state.presetCursor + step, PRESET_OPTIONS.length) };
};

const reduceKey = (state: State, event: DemoEvent): State => {
  if (event.type === "text") return { ...state, key: state.key + event.value, error: null };
  if (event.type !== "key") return state;
  if (event.key === "backspace") return { ...state, key: state.key.slice(0, -1), error: null };
  if (event.key === "escape") return cancel(state, CANCELLED_MESSAGE);
  if (event.key !== "enter") return state;
  if (state.key.trim() === "") return { ...state, error: REQUIRED_MESSAGE };
  return { ...state, phase: "models", query: "", modelCursor: 0, draftModels: [], error: null };
};

const toggleModel = (state: State): State => {
  const model = filteredModels(state)[state.modelCursor];
  if (model === undefined || state.source === null) return state;
  return { ...state, draftModels: toggleIn(state.draftModels, model, state.source.models), error: null };
};

const confirmModels = (state: State): State => {
  if (state.draftModels.length === 0) return { ...state, error: SELECT_ONE_MESSAGE };
  const committed = { ...state, savedModels: state.draftModels, query: "", error: null };
  if (state.editing) {
    return { ...committed, phase: "done", editing: false, outcome: "resynced", syncRound: state.syncRound + 1 };
  }
  return { ...committed, phase: "harnesses", harnessCursor: firstEnabledHarness(state.source), checked: [] };
};

const leaveModels = (state: State): State =>
  state.editing
    ? { ...state, phase: "done", editing: false, query: "", draftModels: state.savedModels, outcome: "unchanged", error: null }
    : cancel(state, CANCELLED_MESSAGE);

const reduceModels = (state: State, event: DemoEvent): State => {
  if (event.type === "text") {
    if (event.value === " ") return toggleModel(state);
    return { ...state, query: state.query + event.value, modelCursor: 0, error: null };
  }
  if (event.type !== "key") return state;
  switch (event.key) {
    case "space":
      return toggleModel(state);
    case "backspace":
      return { ...state, query: state.query.slice(0, -1), modelCursor: 0 };
    case "enter":
      return confirmModels(state);
    case "escape":
      return leaveModels(state);
    default: {
      const step = stepFor(event.key);
      const count = filteredModels(state).length;
      return step === 0 ? state : { ...state, modelCursor: wrap(state.modelCursor + step, count) };
    }
  }
};

const firstEnabledHarness = (source: ProviderSource | null): number =>
  Math.max(0, harnessRows(source).findIndex(isEnabledRow));

const nextEnabledHarness = (state: State, step: number): number => {
  const rows = harnessRows(state.source);
  const offsets = rows.map((_, index) => index + 1);
  const target = offsets
    .map((offset) => wrap(state.harnessCursor + step * offset, rows.length))
    .find((index) => {
      const row = rows[index];
      return row !== undefined && isEnabledRow(row);
    });
  return target ?? state.harnessCursor;
};

const harnessOrder: readonly HarnessId[] = HARNESSES.map((harness) => harness.id);

const toggleHarness = (state: State): State => {
  const row = harnessRows(state.source)[state.harnessCursor];
  if (row === undefined || !isEnabledRow(row)) return state;
  return { ...state, checked: toggleIn(state.checked, row.id, harnessOrder) };
};

const finishConnecting = (state: State, defaultModel: string | null): State => ({
  ...state,
  phase: "done",
  connected: state.checked,
  defaultModel,
  outcome: "connected",
  syncRound: state.syncRound + 1,
});

const askSharedDefault = (state: State): State =>
  sharedDefaultTargets(state).length === 0
    ? finishConnecting(state, null)
    : { ...state, phase: "default", defaultCursor: 0 };

const confirmHarnesses = (state: State): State => {
  const added = addedHarnesses(state);
  if (added.length === 0) return { ...state, phase: "done", outcome: "unchanged" };
  if (added.includes(CLAUDE_CODE)) return { ...state, phase: "claudeDefault", defaultCursor: 0, claudeModel: null };
  return askSharedDefault(state);
};

const reduceHarnesses = (state: State, event: DemoEvent): State => {
  if (event.type === "text") return event.value === " " ? toggleHarness(state) : state;
  if (event.type !== "key") return state;
  switch (event.key) {
    case "space":
      return toggleHarness(state);
    case "enter":
      return confirmHarnesses(state);
    case "escape":
      return cancel(state, NO_CHANGES_MESSAGE);
    default: {
      const step = stepFor(event.key);
      return step === 0 ? state : { ...state, harnessCursor: nextEnabledHarness(state, step) };
    }
  }
};

const confirmClaudeDefault = (state: State): State => {
  const model = defaultOptions(state)[state.defaultCursor];
  if (model === undefined) return state;
  return askSharedDefault({ ...state, claudeModel: model });
};

const confirmSharedDefault = (state: State): State => {
  const choice = defaultOptions(state)[state.defaultCursor];
  if (choice === undefined) return state;
  return finishConnecting(state, choice === KEEP_DEFAULT_LABEL ? null : choice);
};

const reduceDefaultWith =
  (confirm: (state: State) => State) =>
  (state: State, event: DemoEvent): State => {
    if (event.type !== "key") return state;
    if (event.key === "enter") return confirm(state);
    if (event.key === "escape") return cancel(state, STOPPED_MESSAGE);
    const step = stepFor(event.key);
    return step === 0 ? state : { ...state, defaultCursor: wrap(state.defaultCursor + step, defaultOptions(state).length) };
  };

const reduceDone = (state: State, event: DemoEvent): State => {
  if (event.type !== "key" || event.key !== "enter") return state;
  return { ...state, phase: "models", editing: true, query: "", modelCursor: 0, draftModels: state.savedModels, error: null };
};

const reduceCancelled = (state: State, event: DemoEvent): State =>
  event.type === "key" && event.key === "enter" ? initial : state;

const REDUCERS: Readonly<Record<Phase, (state: State, event: DemoEvent) => State>> = {
  preset: reducePreset,
  key: reduceKey,
  models: reduceModels,
  harnesses: reduceHarnesses,
  claudeDefault: reduceDefaultWith(confirmClaudeDefault),
  default: reduceDefaultWith(confirmSharedDefault),
  done: reduceDone,
  cancelled: reduceCancelled,
};

export const reduce = (state: State, event: DemoEvent): State =>
  event.type === "reset" ? initial : REDUCERS[state.phase](state, event);
