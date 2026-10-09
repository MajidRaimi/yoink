import type { DemoEvent, DemoKey } from "@/shared/contract";
import { HARNESSES, type HarnessId } from "@/features/demos/data/harnesses.gen";
import {
  HARNESS_ORDER,
  INITIAL_CURRENT,
  INITIAL_LINKS,
  NOT_INSTALLED,
  PANEL_PROFILES,
  WITHOUT_DEFAULT_MODEL,
  configPathFor,
  harnessLabel,
  protocolRequirement,
  supportsProtocol,
  type PanelProfile,
  type ProviderLinks,
  type ProviderPanelProfile,
} from "@/features/demos/menubar-panel/panel-data";

export type PanelView = "list" | "harnesses";

export type DialogButton = "cancel" | "confirm";

export type PanelDialog =
  | { kind: "switch"; name: string }
  | { kind: "connect"; provider: string; harness: HarnessId };

export type PanelState = {
  view: PanelView;
  current: string;
  lastClaudeAccount: string;
  claudeRunning: boolean;
  query: string;
  listIndex: number;
  provider: string | null;
  harnessIndex: number;
  harnessOffset: number;
  links: Readonly<Record<string, ProviderLinks>>;
  dialog: PanelDialog | null;
  dialogFocus: DialogButton;
  status: string;
};

export type HarnessRowState = {
  id: HarnessId;
  label: string;
  installed: boolean;
  compatible: boolean;
  connected: boolean;
  selectable: boolean;
  exclusive: boolean;
  experimental: boolean;
  setsDefaultModel: boolean;
  defaultModel: string | null;
  stateLabel: string;
  detail: string;
};

export const HARNESS_ROW_HEIGHT = 48;

export const HARNESS_PICKER_HEIGHT = 30;

export const HARNESS_VIEWPORT_HEIGHT = 280;

const CLAUDE_CODE: HarnessId = "claude-code";

export const initialPanelState: PanelState = {
  view: "list",
  current: INITIAL_CURRENT,
  lastClaudeAccount: INITIAL_CURRENT,
  claudeRunning: true,
  query: "",
  listIndex: 0,
  provider: null,
  harnessIndex: 0,
  harnessOffset: 0,
  links: INITIAL_LINKS,
  dialog: null,
  dialogFocus: "confirm",
  status: "Claude Code is running. Pick an account or a provider.",
};

const harnessSummary = (count: number): string => `${count} ${count === 1 ? "harness" : "harnesses"}`;

const clampIndex = (value: number, count: number): number => (count === 0 ? 0 : Math.max(0, Math.min(value, count - 1)));

const matchesQuery = (profile: PanelProfile, term: string): boolean => {
  const fields = profile.type === "claude" ? [profile.name, profile.email] : [profile.name, profile.provider];
  return fields.some((field) => field.toLowerCase().includes(term));
};

export const visibleProfiles = (state: PanelState): readonly PanelProfile[] => {
  const term = state.query.trim().toLowerCase();
  return term.length === 0 ? PANEL_PROFILES : PANEL_PROFILES.filter((profile) => matchesQuery(profile, term));
};

export const selectedProfileIndex = (state: PanelState): number => {
  const count = visibleProfiles(state).length;
  return count === 0 ? -1 : clampIndex(state.listIndex, count);
};

export const linksFor = (state: PanelState, provider: string): ProviderLinks =>
  state.links[provider] ?? { connections: [], defaults: {} };

const sortConnections = (connections: readonly HarnessId[]): readonly HarnessId[] =>
  HARNESS_ORDER.filter((id) => connections.includes(id));

export const connectionsFor = (state: PanelState, provider: string): readonly HarnessId[] => {
  const linked = linksFor(state, provider).connections.filter((id) => id !== CLAUDE_CODE);
  return sortConnections(state.current === provider ? [...linked, CLAUDE_CODE] : linked);
};

export const providerProfile = (name: string | null): ProviderPanelProfile | null =>
  PANEL_PROFILES.find((profile): profile is ProviderPanelProfile => profile.type === "external" && profile.name === name) ??
  null;

const stateLabelFor = (row: Omit<HarnessRowState, "stateLabel" | "detail">): string => {
  if (row.connected) return "connected";
  if (!row.installed) return "not installed";
  if (!row.compatible) return "incompatible";
  return "";
};

export const harnessRows = (state: PanelState, provider: ProviderPanelProfile): readonly HarnessRowState[] => {
  const links = linksFor(state, provider.name);
  const connections = connectionsFor(state, provider.name);
  return HARNESSES.map((harness): HarnessRowState => {
    const connected = connections.includes(harness.id);
    const installed = !NOT_INSTALLED.has(harness.id);
    const compatible = supportsProtocol(harness, provider.protocol);
    const base = {
      id: harness.id,
      label: harness.label,
      installed,
      compatible,
      connected,
      selectable: connected || (installed && compatible),
      exclusive: harness.exclusive,
      experimental: harness.experimental,
      setsDefaultModel: !WITHOUT_DEFAULT_MODEL.has(harness.id),
      defaultModel: links.defaults[harness.id] ?? null,
    };
    const detail =
      !connected && installed && !compatible ? protocolRequirement(harness) : configPathFor(harness.id);
    return { ...base, stateLabel: stateLabelFor(base), detail };
  });
};

export const showsDefaultModel = (row: HarnessRowState, provider: ProviderPanelProfile): boolean =>
  row.connected && row.setsDefaultModel && provider.models.length > 0;

const harnessRowHeight = (row: HarnessRowState, provider: ProviderPanelProfile): number =>
  HARNESS_ROW_HEIGHT + (showsDefaultModel(row, provider) ? HARNESS_PICKER_HEIGHT : 0);

const harnessHeights = (state: PanelState, provider: ProviderPanelProfile): readonly number[] =>
  harnessRows(state, provider).map((row) => harnessRowHeight(row, provider));

const spanHeight = (heights: readonly number[], from: number, to: number): number =>
  heights.slice(from, to + 1).reduce((total, height) => total + height, 0);

const fittedOffset = (heights: readonly number[], index: number, offset: number): number => {
  const start = Math.min(offset, index);
  return start < index && spanHeight(heights, start, index) > HARNESS_VIEWPORT_HEIGHT
    ? fittedOffset(heights, index, start + 1)
    : start;
};

export const visibleHarnessCount = (state: PanelState, provider: ProviderPanelProfile): number => {
  const heights = harnessHeights(state, provider).slice(state.harnessOffset);
  const fitting = heights.findIndex((_, end) => spanHeight(heights, 0, end) > HARNESS_VIEWPORT_HEIGHT);
  return Math.max(1, fitting === -1 ? heights.length : fitting);
};

const settleWindow = (state: PanelState): PanelState => {
  const provider = state.view === "harnesses" ? providerProfile(state.provider) : null;
  if (provider === null) return state;
  const harnessOffset = fittedOffset(harnessHeights(state, provider), state.harnessIndex, state.harnessOffset);
  return harnessOffset === state.harnessOffset ? state : { ...state, harnessOffset };
};

const withLinks = (state: PanelState, provider: string, links: ProviderLinks): PanelState => ({
  ...state,
  links: { ...state.links, [provider]: links },
});

const withoutDefault = (state: PanelState, provider: string, harness: HarnessId): PanelState => {
  const links = linksFor(state, provider);
  const defaults = Object.fromEntries(Object.entries(links.defaults).filter(([id]) => id !== harness));
  return withLinks(state, provider, { connections: links.connections.filter((id) => id !== harness), defaults });
};

const connectHarness = (state: PanelState, provider: string, harness: HarnessId): PanelState => {
  if (harness === CLAUDE_CODE) {
    return {
      ...state,
      current: provider,
      status: `Connected ${provider} to Claude Code. ${provider} is now the active profile.`,
    };
  }
  const links = linksFor(state, provider);
  return {
    ...withLinks(state, provider, {
      connections: sortConnections([...links.connections, harness]),
      defaults: links.defaults,
    }),
    status: `Connected ${provider} to ${harnessLabel(harness)}`,
  };
};

const disconnectHarness = (state: PanelState, provider: string, harness: HarnessId): PanelState => {
  const released = withoutDefault(state, provider, harness);
  if (harness === CLAUDE_CODE) {
    return {
      ...released,
      current: state.lastClaudeAccount,
      status: `Disconnected ${provider} from Claude Code. ${state.lastClaudeAccount} is active again.`,
    };
  }
  return { ...released, status: `Disconnected ${provider} from ${harnessLabel(harness)}` };
};

const switchAccount = (state: PanelState, name: string): PanelState => {
  const previous = providerProfile(state.current);
  const released = previous === null ? state : withoutDefault(state, previous.name, CLAUDE_CODE);
  return {
    ...released,
    current: name,
    lastClaudeAccount: name,
    dialog: null,
    status: `Switched Claude Code to ${name}`,
  };
};

const openDialog = (state: PanelState, dialog: PanelDialog, status: string): PanelState => ({
  ...state,
  dialog,
  dialogFocus: "confirm",
  status,
});

const activateProfile = (state: PanelState): PanelState => {
  const profile = visibleProfiles(state)[selectedProfileIndex(state)];
  if (profile === undefined) return state;
  if (profile.type === "external") {
    return {
      ...state,
      view: "harnesses",
      provider: profile.name,
      harnessIndex: 0,
      harnessOffset: 0,
      status: `Opened ${profile.name}: ${harnessSummary(connectionsFor(state, profile.name).length)} connected`,
    };
  }
  if (profile.name === state.current) return { ...state, status: `${profile.name} is already active` };
  if (!state.claudeRunning) return switchAccount(state, profile.name);
  return openDialog(
    state,
    { kind: "switch", name: profile.name },
    `Claude Code is running. Confirm the switch to ${profile.name}.`,
  );
};

export const activeHarnessRow = (
  state: PanelState,
): { provider: ProviderPanelProfile; row: HarnessRowState } | null => {
  const provider = providerProfile(state.provider);
  if (provider === null) return null;
  const row = harnessRows(state, provider)[state.harnessIndex];
  return row === undefined ? null : { provider, row };
};

const describeHarness = (row: HarnessRowState): string =>
  `${row.label}, ${row.stateLabel.length === 0 ? "not connected" : row.stateLabel}`;

const moveHarness = (state: PanelState, delta: number): PanelState => {
  const moved = { ...state, harnessIndex: clampIndex(state.harnessIndex + delta, HARNESSES.length) };
  const active = activeHarnessRow(moved);
  return active === null ? moved : { ...moved, status: describeHarness(active.row) };
};

const toggleHarness = (state: PanelState): PanelState => {
  const active = activeHarnessRow(state);
  if (active === null) return state;
  const { provider, row } = active;
  if (!row.selectable) return { ...state, status: `${row.label}: ${row.stateLabel}` };
  if (row.connected) return disconnectHarness(state, provider.name, row.id);
  if (row.id === "claude-code" && state.claudeRunning) {
    return openDialog(
      state,
      { kind: "connect", provider: provider.name, harness: row.id },
      `Claude Code is running. Confirm connecting ${provider.name}.`,
    );
  }
  return connectHarness(state, provider.name, row.id);
};

const cycleDefaultModel = (state: PanelState, step: 1 | -1): PanelState => {
  const active = activeHarnessRow(state);
  if (active === null || !showsDefaultModel(active.row, active.provider)) return state;
  const { provider, row } = active;
  const models = provider.models;
  const position = row.defaultModel === null ? (step === 1 ? -1 : 0) : models.indexOf(row.defaultModel);
  const model = models[(position + step + models.length) % models.length] ?? models[0];
  if (model === undefined) return state;
  const links = linksFor(state, provider.name);
  return {
    ...withLinks(state, provider.name, {
      connections: links.connections,
      defaults: { ...links.defaults, [row.id]: model },
    }),
    status: `${row.label} default model: ${model}`,
  };
};

const confirmDialog = (state: PanelState, dialog: PanelDialog): PanelState =>
  dialog.kind === "switch"
    ? switchAccount(state, dialog.name)
    : { ...connectHarness(state, dialog.provider, dialog.harness), dialog: null };

const reduceDialog = (state: PanelState, dialog: PanelDialog, event: DemoEvent): PanelState => {
  if (event.type !== "key") return state;
  if (event.key === "escape") return { ...state, dialog: null, status: "Cancelled. Nothing changed." };
  if (event.key === "left") return { ...state, dialogFocus: "cancel" };
  if (event.key === "right") return { ...state, dialogFocus: "confirm" };
  if (event.key === "tab") return { ...state, dialogFocus: state.dialogFocus === "confirm" ? "cancel" : "confirm" };
  if (event.key !== "enter" && event.key !== "space") return state;
  return state.dialogFocus === "confirm"
    ? confirmDialog(state, dialog)
    : { ...state, dialog: null, status: "Cancelled. Nothing changed." };
};

const describeProfile = (state: PanelState, profile: PanelProfile): string => {
  const detail = profile.type === "claude" ? profile.email : profile.provider;
  return `${profile.name}, ${detail}${profile.name === state.current ? ", active" : ""}`;
};

const moveProfile = (state: PanelState, delta: number): PanelState => {
  const profiles = visibleProfiles(state);
  if (profiles.length === 0) return state;
  const listIndex = clampIndex(selectedProfileIndex(state) + delta, profiles.length);
  const profile = profiles[listIndex];
  return profile === undefined ? state : { ...state, listIndex, status: describeProfile(state, profile) };
};

const LIST_KEYS: Readonly<Partial<Record<DemoKey, (state: PanelState) => PanelState>>> = {
  down: (state) => moveProfile(state, 1),
  up: (state) => moveProfile(state, -1),
  enter: activateProfile,
  backspace: (state) => ({ ...state, query: state.query.slice(0, -1), listIndex: 0 }),
  escape: (state) => (state.query.length === 0 ? state : { ...state, query: "", listIndex: 0 }),
};

const backToList = (state: PanelState): PanelState => ({
  ...state,
  view: "list",
  query: "",
  listIndex: 0,
  status: `Back to profiles. ${state.provider ?? "Provider"} keeps its harnesses.`,
});

const HARNESS_KEYS: Readonly<Partial<Record<DemoKey, (state: PanelState) => PanelState>>> = {
  down: (state) => moveHarness(state, 1),
  up: (state) => moveHarness(state, -1),
  enter: toggleHarness,
  space: toggleHarness,
  right: (state) => cycleDefaultModel(state, 1),
  left: (state) => cycleDefaultModel(state, -1),
  escape: backToList,
};

const reduceList = (state: PanelState, event: DemoEvent): PanelState => {
  if (event.type === "text") return { ...state, query: state.query + event.value, listIndex: 0 };
  if (event.type !== "key") return state;
  return LIST_KEYS[event.key]?.(state) ?? state;
};

const reduceHarnesses = (state: PanelState, event: DemoEvent): PanelState => {
  if (event.type !== "key") return state;
  const handler = HARNESS_KEYS[event.key];
  return handler === undefined ? state : settleWindow(handler(state));
};

export const reducePanel = (state: PanelState, event: DemoEvent): PanelState => {
  if (event.type === "reset") return initialPanelState;
  if (state.dialog !== null) return settleWindow(reduceDialog(state, state.dialog, event));
  return state.view === "list" ? reduceList(state, event) : reduceHarnesses(state, event);
};

export const isTextMode = (state: PanelState): boolean => state.view === "list" && state.dialog === null;

const repeatKey = (key: DemoKey, times: number): readonly DemoEvent[] =>
  Array.from({ length: Math.max(0, times) }, (): DemoEvent => ({ type: "key", key }));

const stepsTo = (from: number, to: number): readonly DemoEvent[] =>
  to >= from ? repeatKey("down", to - from) : repeatKey("up", from - to);

export const eventsToOpenProfile = (state: PanelState, index: number): readonly DemoEvent[] => [
  ...stepsTo(selectedProfileIndex(state), index),
  { type: "key", key: "enter" },
];

export const eventsToFocusHarness = (state: PanelState, index: number): readonly DemoEvent[] =>
  stepsTo(state.harnessIndex, index);

export const eventsToToggleHarness = (state: PanelState, index: number): readonly DemoEvent[] => [
  ...eventsToFocusHarness(state, index),
  { type: "key", key: "space" },
];

export const eventsToCycleDefault = (state: PanelState, index: number): readonly DemoEvent[] => [
  ...eventsToFocusHarness(state, index),
  { type: "key", key: "right" },
];

export const eventsForDialog = (button: DialogButton): readonly DemoEvent[] =>
  button === "cancel"
    ? [{ type: "key", key: "escape" }]
    : [
        { type: "key", key: "right" },
        { type: "key", key: "enter" },
      ];
