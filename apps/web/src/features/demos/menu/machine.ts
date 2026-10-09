import type { DemoEvent } from "@/shared/contract";
import {
  INITIAL_CURRENT,
  INITIAL_CURRENT_BY_TOOL,
  isSubscriptionTool,
  MENU_PROFILES,
  type CurrentByTool,
  type MenuProfile,
} from "@/features/demos/menu/profiles";

export type MenuOutcome =
  | { kind: "none" }
  | { kind: "switched"; profileId: string }
  | { kind: "connect"; profileId: string };

export type CliOnlyAction = "add" | "edit" | "save" | "delete";

export type MenuNotice =
  | { kind: "none" }
  | { kind: "unchanged"; profileId: string }
  | { kind: "cli-only"; action: CliOnlyAction; profileId: string | null };

export type MenuState = {
  open: boolean;
  cursor: number;
  current: string | null;
  currentByTool: CurrentByTool;
  outcome: MenuOutcome;
  notice: MenuNotice;
};

const NO_NOTICE: MenuNotice = { kind: "none" };

const CLI_ONLY_KEYS: Readonly<Record<string, CliOnlyAction>> = {
  n: "add",
  e: "edit",
  s: "save",
  d: "delete",
};

export const sharesClaudeSlot = (profile: MenuProfile): boolean => profile.group === "claude" || profile.group === "external";

export const cursorForCurrent = (current: string | null): number =>
  Math.max(
    0,
    MENU_PROFILES.findIndex((profile) => sharesClaudeSlot(profile) && profile.name === current),
  );

export const initial: MenuState = {
  open: true,
  cursor: cursorForCurrent(INITIAL_CURRENT),
  current: INITIAL_CURRENT,
  currentByTool: INITIAL_CURRENT_BY_TOOL,
  outcome: { kind: "none" },
  notice: NO_NOTICE,
};

export const isCurrentProfile = (state: MenuState, profile: MenuProfile): boolean => {
  if (sharesClaudeSlot(profile)) return state.current === profile.name;
  return isSubscriptionTool(profile.group) && state.currentByTool[profile.group] === profile.name;
};

export const highlightedProfile = (state: MenuState): MenuProfile | undefined => MENU_PROFILES[state.cursor];

export const profileById = (id: string): MenuProfile | undefined => MENU_PROFILES.find((profile) => profile.id === id);

const move = (state: MenuState, delta: number): MenuState => {
  const count = MENU_PROFILES.length;
  if (count === 0) return state;
  return { ...state, cursor: (state.cursor + delta + count) % count, notice: NO_NOTICE };
};

const backToList = (state: MenuState, notice: MenuNotice = NO_NOTICE): MenuState => ({
  ...state,
  cursor: cursorForCurrent(state.current),
  notice,
});

const switchProfile = (state: MenuState, profile: MenuProfile): MenuState => {
  if (isCurrentProfile(state, profile)) return backToList(state, { kind: "unchanged", profileId: profile.id });
  const outcome: MenuOutcome = { kind: "switched", profileId: profile.id };
  if (isSubscriptionTool(profile.group)) {
    return backToList({ ...state, currentByTool: { ...state.currentByTool, [profile.group]: profile.name }, outcome });
  }
  return backToList({ ...state, current: profile.name, outcome });
};

const activate = (state: MenuState): MenuState => {
  const profile = highlightedProfile(state);
  if (profile === undefined) return state;
  if (profile.group === "external") return backToList({ ...state, outcome: { kind: "connect", profileId: profile.id } });
  return switchProfile(state, profile);
};

const close = (state: MenuState): MenuState => ({ ...state, open: false, notice: NO_NOTICE });

const announceCliOnly = (state: MenuState, action: CliOnlyAction): MenuState => {
  const targetsRow = action === "edit" || action === "delete";
  const profileId = targetsRow ? (highlightedProfile(state)?.id ?? null) : null;
  return { ...state, notice: { kind: "cli-only", action, profileId } };
};

const reduceText = (state: MenuState, value: string): MenuState => {
  if (value === "q") return close(state);
  const action = CLI_ONLY_KEYS[value];
  return action === undefined ? state : announceCliOnly(state, action);
};

const reopen = (state: MenuState): MenuState => ({
  ...state,
  open: true,
  cursor: cursorForCurrent(state.current),
  outcome: { kind: "none" },
  notice: NO_NOTICE,
});

const reduceOpen = (state: MenuState, event: DemoEvent): MenuState => {
  if (event.type === "text") return reduceText(state, event.value);
  if (event.type !== "key") return state;
  switch (event.key) {
    case "up":
      return move(state, -1);
    case "down":
      return move(state, 1);
    case "enter":
      return activate(state);
    case "escape":
      return close(state);
    default:
      return state;
  }
};

export const reduce = (state: MenuState, event: DemoEvent): MenuState => {
  if (event.type === "reset") return initial;
  if (state.open) return reduceOpen(state, event);
  return event.type === "key" && event.key === "enter" ? reopen(state) : state;
};

export const withClaudeAccount = (state: MenuState, account: string): MenuState => {
  const known = MENU_PROFILES.some((profile) => sharesClaudeSlot(profile) && profile.name === account);
  if (!known || state.current === account) return state;
  return {
    ...state,
    current: account,
    cursor: cursorForCurrent(account),
    outcome: { kind: "none" },
    notice: NO_NOTICE,
  };
};

export const eventsToPick = (state: MenuState, index: number): DemoEvent[] => {
  if (!state.open || index < 0 || index >= MENU_PROFILES.length) return [];
  const delta = index - state.cursor;
  const step: DemoEvent = { type: "key", key: delta < 0 ? "up" : "down" };
  return [...Array.from({ length: Math.abs(delta) }, () => step), { type: "key", key: "enter" }];
};
