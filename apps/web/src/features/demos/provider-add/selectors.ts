import type { DemoEvent } from "@/shared/contract";
import { harnessCount, harnessLabel, harnessRows } from "@/features/demos/provider-add/harness-rows";
import {
  defaultOptions,
  defaultTargets,
  filteredModels,
  reduce,
  type Phase,
  type State,
} from "@/features/demos/provider-add/machine";
import { PRESET_OPTIONS } from "@/features/demos/provider-add/sources";

export type RowWindow = {
  start: number;
  end: number;
  above: number;
  below: number;
};

export const rowWindow = (count: number, cursor: number, size: number): RowWindow => {
  if (count <= size) return { start: 0, end: count, above: 0, below: 0 };
  const start = Math.min(Math.max(0, cursor - Math.floor(size / 2)), count - size);
  const end = start + size;
  return { start, end, above: start, below: count - end };
};

export const optionId = (idPrefix: string, key: string): string => `${idPrefix}-option-${key}`;

const activeOptionKey = (state: State): string | undefined => {
  switch (state.phase) {
    case "preset":
      return PRESET_OPTIONS[state.presetCursor]?.id;
    case "models":
      return filteredModels(state)[state.modelCursor];
    case "harnesses":
      return harnessRows(state.source)[state.harnessCursor]?.id;
    case "claudeDefault":
    case "default":
      return defaultOptions(state)[state.defaultCursor];
    default:
      return undefined;
  }
};

export const activeOptionId = (state: State, idPrefix: string): string | undefined => {
  const key = activeOptionKey(state);
  return key === undefined ? undefined : optionId(idPrefix, key);
};

export const maskKey = (key: string): string => "•".repeat(key.length);

const joinLabels = (labels: readonly string[]): string => labels.join(", ");

const cursorOf = (state: State): number | null => {
  switch (state.phase) {
    case "preset":
      return state.presetCursor;
    case "models":
      return state.modelCursor;
    case "harnesses":
      return state.harnessCursor;
    case "claudeDefault":
    case "default":
      return state.defaultCursor;
    default:
      return null;
  }
};

const rowCount = (state: State): number => {
  switch (state.phase) {
    case "preset":
      return PRESET_OPTIONS.length;
    case "models":
      return filteredModels(state).length;
    case "harnesses":
      return harnessRows(state.source).length;
    case "claudeDefault":
    case "default":
      return defaultOptions(state).length;
    default:
      return 0;
  }
};

const ACTIVATE: Readonly<Record<Phase, DemoEvent>> = {
  preset: { type: "key", key: "enter" },
  key: { type: "key", key: "enter" },
  models: { type: "key", key: "space" },
  harnesses: { type: "key", key: "space" },
  claudeDefault: { type: "key", key: "enter" },
  default: { type: "key", key: "enter" },
  done: { type: "key", key: "enter" },
  cancelled: { type: "key", key: "enter" },
};

const DOWN: DemoEvent = { type: "key", key: "down" };

export const eventsToPick = (state: State, index: number): readonly DemoEvent[] => {
  const activate = ACTIVATE[state.phase];
  const start = cursorOf(state);
  if (start === null || start === index) return [activate];
  const limit = rowCount(state);
  const moves: DemoEvent[] = [];
  let probe = state;
  while (moves.length < limit) {
    probe = reduce(probe, DOWN);
    moves.push(DOWN);
    if (cursorOf(probe) === index) return [...moves, activate];
    if (cursorOf(probe) === start) return [];
  }
  return [];
};

const selectedWord = (checked: boolean): string => (checked ? "selected" : "not selected");

const modelsStatus = (state: State): string => {
  const model = filteredModels(state)[state.modelCursor];
  const total = `${state.draftModels.length} of ${state.source?.models.length ?? 0} models selected.`;
  if (model === undefined) return `No matches. ${total}`;
  return `${model}, ${selectedWord(state.draftModels.includes(model))}. ${total}`;
};

const harnessesStatus = (state: State): string => {
  const total = `${harnessCount(state.checked.length)} checked.`;
  const row = harnessRows(state.source)[state.harnessCursor];
  if (row === undefined) return total;
  const detail = row.reason ?? row.path;
  return `${row.label}, ${selectedWord(state.checked.includes(row.id))}, ${detail}. ${total}`;
};

const doneStatus = (state: State): string => {
  const labels = joinLabels(state.connected.map(harnessLabel));
  if (state.outcome === "resynced") {
    return state.connected.length === 0 ? "Models saved." : `Models saved. Re-synced ${labels}.`;
  }
  if (state.outcome === "connected") return `Connected ${labels}. Restart running harnesses to pick up the change.`;
  return "No changes.";
};

export const statusText = (state: State): string => {
  if (state.error !== null) return state.error;
  switch (state.phase) {
    case "preset":
      return `Which provider? ${PRESET_OPTIONS[state.presetCursor]?.label ?? ""}`;
    case "key":
      return `API key for ${state.source?.displayName ?? "the provider"}, ${state.key.length} characters typed, hidden.`;
    case "models":
      return modelsStatus(state);
    case "harnesses":
      return harnessesStatus(state);
    case "claudeDefault":
    case "default":
      return `Default model in ${joinLabels(defaultTargets(state).map(harnessLabel))}: ${defaultOptions(state)[state.defaultCursor] ?? ""}`;
    case "done":
      return doneStatus(state);
    case "cancelled":
      return state.message ?? "Cancelled.";
  }
};
