import type { DemoEvent, DemoKey } from "@/shared/contract";
import {
  ACTIVE_CLAUDE_PROFILE,
  ACTIVE_SUBSCRIPTIONS,
  CLAUDE_PROFILES,
  SUBSCRIPTION_LOGINS,
} from "@/features/demos/data/fixtures";
import { PROFILE_GROUP_TITLES } from "@/features/demos/data/groups.gen";
import { SUBSCRIPTIONS, type SubscriptionTool } from "@/features/demos/data/subscriptions.gen";

export type SwitchTool = "claude" | SubscriptionTool;

export type SavedLogin = {
  name: string;
  detail: string;
};

export type ConfirmChoice = "yes" | "no";

export type Phase =
  | { kind: "browse" }
  | { kind: "confirm"; target: string; choice: ConfirmChoice };

export type Outcome =
  | { kind: "none" }
  | { kind: "switched"; tool: SwitchTool; name: string; previous: string | null }
  | { kind: "cancelled"; tool: SwitchTool; name: string }
  | { kind: "unchanged"; tool: SwitchTool; name: string };

export type SwitchState = {
  tab: number;
  cursor: number;
  active: Readonly<Record<SwitchTool, string | null>>;
  running: Readonly<Record<SwitchTool, boolean>>;
  phase: Phase;
  outcome: Outcome;
  run: number;
};

export type LogTone = "step" | "success" | "warn" | "muted";

export type LogLine = {
  tone: LogTone;
  text: string;
};

export const TOOLS: readonly SwitchTool[] = ["claude", ...SUBSCRIPTIONS.map((subscription) => subscription.tool)];

const RESTART_TARGETS: Readonly<Record<SwitchTool, string>> = {
  claude: "Claude Code",
  codex: "Codex",
  kimi: "Kimi Code",
  gemini: "the Gemini CLI",
  copilot: "the Copilot CLI",
};

const SNAPSHOT_TARGETS: Readonly<Record<SubscriptionTool, string>> = {
  codex: "~/.codex/auth.json, or the Codex keyring entry",
  kimi: "~/.kimi-code/credentials/*.json",
  gemini: "~/.gemini/oauth_creds.json and google_accounts.json",
  copilot: "last_logged_in_user in ~/.copilot/config.json",
};

const withPlan = (label: string, plan: string | null): string => (plan === null ? label : `${label} · ${plan}`);

const CLAUDE_LOGINS: readonly SavedLogin[] = CLAUDE_PROFILES.map((profile) => ({
  name: profile.name,
  detail: profile.email,
}));

const subscriptionLogins = (tool: SubscriptionTool): readonly SavedLogin[] =>
  SUBSCRIPTION_LOGINS.filter((login) => login.tool === tool).map((login) => ({
    name: login.name,
    detail: withPlan(login.label, login.plan),
  }));

const LOGINS: Readonly<Record<SwitchTool, readonly SavedLogin[]>> = {
  claude: CLAUDE_LOGINS,
  codex: subscriptionLogins("codex"),
  kimi: subscriptionLogins("kimi"),
  gemini: subscriptionLogins("gemini"),
  copilot: subscriptionLogins("copilot"),
};

export const MAX_LOGINS: number = Math.max(1, ...Object.values(LOGINS).map((logins) => logins.length));

export const toolTitle = (tool: SwitchTool): string => PROFILE_GROUP_TITLES[tool];

export const loginsFor = (tool: SwitchTool): readonly SavedLogin[] => LOGINS[tool];

export const restartHint = (tool: SwitchTool): string =>
  `Restart ${RESTART_TARGETS[tool]} to pick up the new login.`;

export const runningPrompt = (tool: SwitchTool): string =>
  tool === "claude"
    ? "Claude Code is running. It may overwrite the token on its next refresh. Switch anyway?"
    : `${toolTitle(tool)} is running. It may overwrite the login on its next refresh. Switch anyway?`;

export const currentTool = (state: SwitchState): SwitchTool => TOOLS[state.tab] ?? "claude";

const activeIndex = (tool: SwitchTool, active: SwitchState["active"]): number =>
  Math.max(
    0,
    loginsFor(tool).findIndex((login) => login.name === active[tool]),
  );

const INITIAL_ACTIVE: Readonly<Record<SwitchTool, string | null>> = {
  claude: ACTIVE_CLAUDE_PROFILE,
  codex: ACTIVE_SUBSCRIPTIONS.codex ?? null,
  kimi: ACTIVE_SUBSCRIPTIONS.kimi ?? null,
  gemini: ACTIVE_SUBSCRIPTIONS.gemini ?? null,
  copilot: ACTIVE_SUBSCRIPTIONS.copilot ?? null,
};

export const initial: SwitchState = {
  tab: 0,
  cursor: activeIndex("claude", INITIAL_ACTIVE),
  active: INITIAL_ACTIVE,
  running: { claude: false, codex: false, kimi: false, gemini: false, copilot: false },
  phase: { kind: "browse" },
  outcome: { kind: "none" },
  run: 0,
};

const wrap = (value: number, length: number): number => (length === 0 ? 0 : (value + length) % length);

const moveTab = (state: SwitchState, delta: number): SwitchState => {
  const tab = wrap(state.tab + delta, TOOLS.length);
  const tool = TOOLS[tab] ?? "claude";
  return { ...state, tab, cursor: activeIndex(tool, state.active) };
};

const moveCursor = (state: SwitchState, delta: number): SwitchState => {
  const count = loginsFor(currentTool(state)).length;
  return count === 0 ? state : { ...state, cursor: wrap(state.cursor + delta, count) };
};

const toggleRunning = (state: SwitchState): SwitchState => {
  const tool = currentTool(state);
  return { ...state, running: { ...state.running, [tool]: !state.running[tool] } };
};

const commitSwitch = (state: SwitchState, tool: SwitchTool, name: string): SwitchState => ({
  ...state,
  phase: { kind: "browse" },
  active: { ...state.active, [tool]: name },
  outcome: { kind: "switched", tool, name, previous: state.active[tool] },
  run: state.run + 1,
});

const cancelSwitch = (state: SwitchState, tool: SwitchTool, name: string): SwitchState => ({
  ...state,
  phase: { kind: "browse" },
  outcome: { kind: "cancelled", tool, name },
  run: state.run + 1,
});

const requestSwitch = (state: SwitchState): SwitchState => {
  const tool = currentTool(state);
  const target = loginsFor(tool)[state.cursor];
  if (target === undefined) return state;
  if (state.active[tool] === target.name) {
    return { ...state, outcome: { kind: "unchanged", tool, name: target.name }, run: state.run + 1 };
  }
  if (state.running[tool]) return { ...state, phase: { kind: "confirm", target: target.name, choice: "no" } };
  return commitSwitch(state, tool, target.name);
};

const answer = (state: SwitchState, target: string, choice: ConfirmChoice): SwitchState =>
  choice === "yes" ? commitSwitch(state, currentTool(state), target) : cancelSwitch(state, currentTool(state), target);

const flip = (choice: ConfirmChoice): ConfirmChoice => (choice === "yes" ? "no" : "yes");

const reduceConfirmKey = (state: SwitchState, target: string, choice: ConfirmChoice, key: DemoKey): SwitchState => {
  switch (key) {
    case "left":
    case "right":
    case "up":
    case "down":
      return { ...state, phase: { kind: "confirm", target, choice: flip(choice) } };
    case "enter":
      return answer(state, target, choice);
    case "escape":
      return cancelSwitch(state, currentTool(state), target);
    default:
      return state;
  }
};

const reduceConfirm = (state: SwitchState, target: string, choice: ConfirmChoice, event: DemoEvent): SwitchState => {
  if (event.type === "key") return reduceConfirmKey(state, target, choice, event.key);
  if (event.type !== "text") return state;
  const letter = event.value.toLowerCase();
  if (letter === "y") return answer(state, target, "yes");
  if (letter === "n") return answer(state, target, "no");
  return state;
};

const reduceBrowseKey = (state: SwitchState, key: DemoKey): SwitchState => {
  switch (key) {
    case "left":
      return moveTab(state, -1);
    case "right":
      return moveTab(state, 1);
    case "up":
      return moveCursor(state, -1);
    case "down":
      return moveCursor(state, 1);
    case "space":
      return toggleRunning(state);
    case "enter":
      return requestSwitch(state);
    default:
      return state;
  }
};

export const reduce = (state: SwitchState, event: DemoEvent): SwitchState => {
  if (event.type === "reset") return initial;
  if (state.phase.kind === "confirm") return reduceConfirm(state, state.phase.target, state.phase.choice, event);
  return event.type === "key" ? reduceBrowseKey(state, event.key) : state;
};

const detailOf = (tool: SwitchTool, name: string): string =>
  loginsFor(tool).find((login) => login.name === name)?.detail ?? name;

const claudeSwitchLog = (name: string, previous: string | null): readonly LogLine[] => [
  ...(previous === null ? [] : [{ tone: "step" as const, text: `Re-snapshot ${previous} from the live login` }]),
  { tone: "step", text: "Write the Claude Code-credentials Keychain entry, or ~/.claude/.credentials.json" },
  { tone: "step", text: `Restore oauthAccount for ${name} in ~/.claude.json` },
];

const subscriptionSwitchLog = (tool: SubscriptionTool, name: string, previous: string | null): readonly LogLine[] => [
  ...(previous === null ? [] : [{ tone: "step" as const, text: `Re-capture ${SNAPSHOT_TARGETS[tool]} into ${previous}` }]),
  {
    tone: "step",
    text:
      tool === "copilot"
        ? `Set ${SNAPSHOT_TARGETS.copilot} to ${detailOf(tool, name)}`
        : `Restore ${SNAPSHOT_TARGETS[tool]} from ${name}`,
  },
];

const alreadyOn = (name: string): string => `Already on ${name}.`;

export const logLines = (state: SwitchState): readonly LogLine[] => {
  const { outcome } = state;
  switch (outcome.kind) {
    case "none":
      return [];
    case "unchanged":
      return [{ tone: "muted", text: alreadyOn(outcome.name) }];
    case "cancelled":
      return [
        { tone: "warn", text: runningPrompt(outcome.tool) },
        { tone: "muted", text: "No" },
        { tone: "warn", text: "Switch cancelled." },
      ];
    case "switched": {
      const steps =
        outcome.tool === "claude"
          ? claudeSwitchLog(outcome.name, outcome.previous)
          : subscriptionSwitchLog(outcome.tool, outcome.name, outcome.previous);
      return [
        ...steps,
        { tone: "success", text: `Switched to ${outcome.name} (${detailOf(outcome.tool, outcome.name)})` },
        { tone: "muted", text: restartHint(outcome.tool) },
      ];
    }
  }
};

const cursorSummary = (state: SwitchState, tool: SwitchTool): string => {
  const login = loginsFor(tool)[state.cursor];
  if (login === undefined) return emptyHint(tool);
  const active = state.active[tool] === login.name ? ", active" : "";
  return `${toolTitle(tool)}: ${login.name} (${login.detail})${active}. Enter switches.`;
};

export const emptyHint = (tool: SwitchTool): string => `No saved ${toolTitle(tool)} logins. Add one with yoink add.`;

export const statusText = (state: SwitchState): string => {
  const tool = currentTool(state);
  if (state.phase.kind === "confirm") return `${runningPrompt(tool)} ${state.phase.choice === "yes" ? "Yes" : "No"} selected.`;
  const { outcome } = state;
  switch (outcome.kind) {
    case "none":
      return cursorSummary(state, tool);
    case "unchanged":
      return `${alreadyOn(outcome.name)} ${cursorSummary(state, tool)}`;
    case "cancelled":
      return `Switch to ${outcome.name} cancelled. ${toolTitle(outcome.tool)} keeps its current login. ${cursorSummary(state, tool)}`;
    case "switched":
      return `${toolTitle(outcome.tool)} switched to ${outcome.name}. ${restartHint(outcome.tool)} ${cursorSummary(state, tool)}`;
  }
};

const repeat = (key: DemoKey, count: number): readonly DemoEvent[] =>
  Array.from({ length: Math.max(0, count) }, () => ({ type: "key", key }) as const);

export const eventsToTab = (state: SwitchState, tab: number): readonly DemoEvent[] => {
  if (state.phase.kind !== "browse") return [];
  const delta = tab - state.tab;
  return delta >= 0 ? repeat("right", delta) : repeat("left", -delta);
};

export const eventsToRow = (state: SwitchState, row: number): readonly DemoEvent[] => {
  if (state.phase.kind !== "browse") return [];
  const delta = row - state.cursor;
  const moves = delta >= 0 ? repeat("down", delta) : repeat("up", -delta);
  return [...moves, { type: "key", key: "enter" }];
};

export const eventsToAnswer = (state: SwitchState, choice: ConfirmChoice): readonly DemoEvent[] =>
  state.phase.kind === "confirm" ? [{ type: "text", value: choice === "yes" ? "y" : "n" }] : [];
