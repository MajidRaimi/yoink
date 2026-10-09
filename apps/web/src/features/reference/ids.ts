import { PROFILE_GROUP_TITLES } from "@/features/demos/data/groups.gen";
import { HARNESSES } from "@/features/demos/data/harnesses.gen";
import { PROVIDER_PRESETS } from "@/features/demos/data/presets.gen";
import { SUBSCRIPTIONS } from "@/features/demos/data/subscriptions.gen";
import type { Protocol } from "@/shared/contract";

export type KeyBinding = {
  readonly keys: readonly string[];
  readonly label: string;
  readonly action: string;
};

export const MENU_KEYMAP: readonly KeyBinding[] = [
  { keys: ["↑", "↓", "j", "k"], label: "Up, down, j or k", action: "Move the highlight. It wraps at the top and bottom." },
  { keys: ["Enter"], label: "Enter", action: "Switch to the highlighted profile within its own tool." },
  { keys: ["n"], label: "n", action: "Add a new account or API-key provider." },
  { keys: ["e"], label: "e", action: "Edit the highlighted profile." },
  { keys: ["s"], label: "s", action: "Save the current live login as a new profile." },
  { keys: ["d"], label: "d", action: "Delete the highlighted profile, after a confirmation." },
  { keys: ["q", "Esc", "Ctrl-C"], label: "q, Esc or Ctrl-C", action: "Quit." },
];

export type ToolId = {
  readonly id: string;
  readonly label: string;
};

export const TOOL_IDS: readonly ToolId[] = [
  { id: "claude", label: PROFILE_GROUP_TITLES.claude },
  ...SUBSCRIPTIONS.map((subscription) => ({ id: subscription.tool, label: subscription.label })),
];

export type HarnessIdRow = {
  readonly id: string;
  readonly label: string;
  readonly protocols: readonly Protocol[];
  readonly experimental: boolean;
};

export const HARNESS_ID_ROWS: readonly HarnessIdRow[] = HARNESSES.map((harness) => ({
  id: harness.id,
  label: harness.label,
  protocols: harness.protocols,
  experimental: harness.experimental,
}));

export type PresetIdRow = {
  readonly id: string;
  readonly label: string;
  readonly protocols: readonly Protocol[];
};

export const PRESET_ID_ROWS: readonly PresetIdRow[] = PROVIDER_PRESETS.map((preset) => ({
  id: preset.id,
  label: preset.label,
  protocols: preset.endpoints.map((endpoint) => endpoint.protocol),
}));

export const PROTOCOL_LABELS: Readonly<Record<Protocol, string>> = {
  "anthropic-messages": "Anthropic Messages",
  "openai-chat": "OpenAI Chat",
  "openai-responses": "OpenAI Responses",
};
