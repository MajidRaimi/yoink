import { HARNESS_FACTS, PRESET_FACTS } from "@/features/demos/data";
import type { Protocol } from "@/shared/contract";
import type { HarnessFactsData, PresetFactsData } from "./types";

export type FactRow = {
  readonly label: string;
  readonly value: string;
};

export type ReachRow = {
  readonly harness: string;
  readonly label: string;
  readonly protocol: Protocol | null;
  readonly note: string;
};

export const AT_A_GLANCE_HEADING = "At a glance";

export const HARNESS_FACTS_SOURCE = "docs/harnesses.md";

export const PROVIDER_FACTS_SOURCE = "docs/providers.md (presets.ts)";

export const AT_A_GLANCE_ID = "at-a-glance";

export class FactsLookupError extends Error {
  constructor(kind: string, id: string) {
    super(`no generated ${kind} facts for "${id}"`);
    this.name = "FactsLookupError";
  }
}

export const HARNESS_IDS: ReadonlySet<string> = new Set(HARNESS_FACTS.map((harness) => harness.id));

export const PRESET_IDS: ReadonlySet<string> = new Set(PRESET_FACTS.map((preset) => preset.id));

export const harnessFacts = (id: string): HarnessFactsData => {
  const found = HARNESS_FACTS.find((harness) => harness.id === id);
  if (found === undefined) throw new FactsLookupError("harness", id);
  return found;
};

export const presetFacts = (id: string): PresetFactsData => {
  const found = PRESET_FACTS.find((preset) => preset.id === id);
  if (found === undefined) throw new FactsLookupError("preset", id);
  return found;
};

const code = (value: string): string => `\`${value}\``;

const codeList = (values: readonly string[]): string => values.map(code).join(", ");

export const presetsReaching = (harnessId: string): readonly PresetFactsData[] =>
  PRESET_FACTS.filter((preset) => preset.reach.some((reach) => reach.harness === harnessId && reach.protocol !== null));

export const harnessFactRows = (id: string): readonly FactRow[] => {
  const harness = harnessFacts(id);
  const presets = presetsReaching(id);
  return [
    { label: "Harness id", value: code(harness.id) },
    { label: "Config yoink writes", value: harness.configPath },
    { label: "Format", value: harness.format },
    { label: "Protocols, in order of preference", value: codeList(harness.protocols) },
    { label: "Default model", value: harness.setsDefaultModel ? harness.defaultModel : "not set by yoink" },
    { label: "Path override", value: harness.envOverrides.length === 0 ? "none" : codeList(harness.envOverrides) },
    { label: "Providers at once", value: harness.exclusive ? "one (connecting a provider switches it)" : "many, side by side" },
    { label: "Experimental", value: harness.experimental ? "yes" : "no" },
    { label: "Presets that reach it", value: `${presets.length} of ${PRESET_FACTS.length}: ${codeList(presets.map((preset) => preset.id))}` },
    { label: "Connect command", value: code(`yoink connect <name> --to ${harness.id}`) },
  ];
};

export const presetFactRows = (id: string): readonly FactRow[] => {
  const preset = presetFacts(id);
  const reached = preset.reach.filter((reach) => reach.protocol !== null).length;
  return [
    { label: "Preset id", value: code(preset.id) },
    ...preset.endpoints.map((endpoint) => ({ label: `${code(endpoint.protocol)} endpoint`, value: code(endpoint.baseUrl) })),
    { label: "API keys page", value: preset.keyUrl ?? "none (local server)" },
    { label: "Harnesses it reaches", value: `${reached} of ${preset.reach.length}` },
    { label: "Add command", value: code(`yoink add --external --name <name> --preset ${preset.id}`) },
  ];
};

export const presetReachRows = (id: string): readonly ReachRow[] =>
  presetFacts(id).reach.map((reach) => {
    const harness = harnessFacts(reach.harness);
    return {
      harness: harness.id,
      label: harness.label,
      protocol: reach.protocol,
      note: reach.protocol === null ? `not offered: needs ${codeList(harness.protocols)}` : `uses ${code(reach.protocol)}`,
    };
  });

const escapeCell = (value: string): string => value.replace(/\|/g, "\\|");

const markdownTable = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
  [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`),
  ].join("\n");

export const harnessFactsMarkdown = (id: string): string =>
  [`## ${AT_A_GLANCE_HEADING}`, markdownTable(["Fact", "Value"], harnessFactRows(id).map((row) => [row.label, row.value]))].join("\n\n");

export const presetFactsMarkdown = (id: string): string =>
  [
    `## ${AT_A_GLANCE_HEADING}`,
    markdownTable(["Fact", "Value"], presetFactRows(id).map((row) => [row.label, row.value])),
    markdownTable(["Harness", "With this preset"], presetReachRows(id).map((row) => [row.label, row.note])),
  ].join("\n\n");
