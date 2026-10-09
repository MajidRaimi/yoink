import type { ProfileGroupKey } from "@/shared/contract";
import type { DemoHint } from "@/features/demos/engine/demo-frame";
import {
  highlightedProfile,
  profileById,
  type CliOnlyAction,
  type MenuNotice,
  type MenuState,
} from "@/features/demos/menu/machine";
import { groupTitle, type MenuProfile } from "@/features/demos/menu/profiles";

export type HelpItem = {
  key: string;
  label: string;
};

export type OutcomeLines =
  | { kind: "empty" }
  | { kind: "switched"; profile: MenuProfile; restart: string }
  | { kind: "connect"; profile: MenuProfile };

const RESTART_TARGETS: Readonly<Record<ProfileGroupKey, string>> = {
  claude: "Claude Code",
  external: "Claude Code",
  codex: "Codex",
  kimi: "Kimi Code",
  gemini: "the Gemini CLI",
  copilot: "the Copilot CLI",
};

export const CONNECT_PROMPT = "Connect to which harnesses?";

export const restartHint = (group: ProfileGroupKey): string =>
  `Restart ${RESTART_TARGETS[group]} to pick up the new login.`;

export const enterLabelFor = (profile: MenuProfile | undefined): string => {
  if (profile === undefined) return "new";
  return profile.group === "external" ? "connect" : "switch";
};

export const helpItems = (enterLabel: string): readonly HelpItem[] => [
  { key: "↑↓/jk", label: "move" },
  { key: "↵", label: enterLabel },
  { key: "n", label: "new" },
  { key: "e", label: "edit" },
  { key: "s", label: "save" },
  { key: "d", label: "delete" },
  { key: "q", label: "quit" },
];

export const switchedText = (profile: MenuProfile): string => `Switched to ${profile.name} (${profile.hint})`;

export const outcomeLines = (state: MenuState): OutcomeLines => {
  if (state.outcome.kind === "none") return { kind: "empty" };
  const profile = profileById(state.outcome.profileId);
  if (profile === undefined) return { kind: "empty" };
  if (state.outcome.kind === "connect") return { kind: "connect", profile };
  return { kind: "switched", profile, restart: restartHint(profile.group) };
};

const idleStatus = (state: MenuState): string => {
  const profile = highlightedProfile(state);
  if (profile === undefined) return "No profiles yet.";
  return `${profile.name} in ${groupTitle(profile.group)} highlighted. Enter to ${enterLabelFor(profile)}.`;
};

const CLI_ONLY_ACTIONS: Readonly<Record<CliOnlyAction, { key: string; does: (name: string | null) => string }>> = {
  add: { key: "n", does: () => "opens the add-account flow" },
  edit: { key: "e", does: (name) => (name === null ? "opens the edit flow" : `opens the edit flow for ${name}`) },
  save: { key: "s", does: () => "saves the login you are signed in with" },
  delete: { key: "d", does: (name) => (name === null ? "asks to delete a profile" : `asks to delete ${name}`) },
};

const cliOnlyText = (action: CliOnlyAction, profileId: string | null): string => {
  const entry = CLI_ONLY_ACTIONS[action];
  const name = profileId === null ? null : (profileById(profileId)?.name ?? null);
  return `In yoink, ${entry.key} ${entry.does(name)}. This demo only switches and connects.`;
};

const noticeText = (notice: MenuNotice): string | null => {
  switch (notice.kind) {
    case "none":
      return null;
    case "cli-only":
      return cliOnlyText(notice.action, notice.profileId);
    case "unchanged": {
      const profile = profileById(notice.profileId);
      if (profile === undefined) return null;
      return `${profile.name} is already the active ${groupTitle(profile.group)} login. Nothing changed.`;
    }
  }
};

export const statusText = (state: MenuState): string => {
  if (!state.open) return "Menu closed. Press Enter to run yoink again.";
  const notice = noticeText(state.notice);
  if (notice !== null) return notice;
  if (state.outcome.kind === "none") return idleStatus(state);
  const profile = profileById(state.outcome.profileId);
  if (profile === undefined) return idleStatus(state);
  if (state.outcome.kind === "switched") return `${switchedText(profile)}. ${restartHint(profile.group)}`;
  return `${profile.name} is a provider. In yoink, Enter opens the harness checklist: ${CONNECT_PROMPT}`;
};

export const menuHints = (state: MenuState): readonly DemoHint[] =>
  state.open
    ? [
        { keys: ["j", "k"], action: "move" },
        { keys: ["Enter"], action: enterLabelFor(highlightedProfile(state)) },
      ]
    : [{ keys: ["Enter"], action: "run yoink" }];
