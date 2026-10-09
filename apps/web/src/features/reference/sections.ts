import { COMMAND_GROUPS } from "./commands";

export type ReferenceSection = {
  readonly id: string;
  readonly title: string;
};

export const ID_SECTIONS = {
  keymap: { id: "keymap", title: "Menu keymap" },
  tools: { id: "tool-ids", title: "Tool ids" },
  harnesses: { id: "harness-ids", title: "Harness ids" },
  presets: { id: "preset-ids", title: "Preset ids" },
} as const satisfies Readonly<Record<string, ReferenceSection>>;

export const REFERENCE_SECTIONS: readonly ReferenceSection[] = [
  ...COMMAND_GROUPS.map((group) => ({ id: group.id, title: group.title })),
  ...Object.values(ID_SECTIONS),
];
