import type { EndpointData, Protocol } from "@/shared/contract";
import { FUSE_PROVIDER, PRESET_MODELS } from "@/features/demos/data/fixtures";
import { PROVIDER_PRESETS, type ProviderPresetId } from "@/features/demos/data/presets.gen";

export const CUSTOM_PRESET = "custom";

export type PresetChoiceId = ProviderPresetId | typeof CUSTOM_PRESET;

export type PresetOption = {
  id: PresetChoiceId;
  label: string;
  hint: string | null;
};

export type ProviderSource = {
  id: PresetChoiceId;
  displayName: string;
  profileName: string;
  endpoints: readonly EndpointData[];
  models: readonly string[];
  customBaseUrl: string | null;
};

export const PRESET_OPTIONS: readonly PresetOption[] = [
  ...PROVIDER_PRESETS.map((preset) => ({ id: preset.id, label: preset.label, hint: null })),
  { id: CUSTOM_PRESET, label: "Custom", hint: "any OpenAI- or Anthropic-compatible API" },
];

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "provider";

const customSource = (): ProviderSource => ({
  id: CUSTOM_PRESET,
  displayName: FUSE_PROVIDER.label,
  profileName: slugify(FUSE_PROVIDER.label),
  endpoints: [{ protocol: FUSE_PROVIDER.protocol, baseUrl: FUSE_PROVIDER.baseUrl }],
  models: FUSE_PROVIDER.models,
  customBaseUrl: FUSE_PROVIDER.baseUrl,
});

export const sourceFor = (id: PresetChoiceId): ProviderSource => {
  const preset = PROVIDER_PRESETS.find((candidate) => candidate.id === id);
  if (preset === undefined) return customSource();
  return {
    id: preset.id,
    displayName: preset.label,
    profileName: slugify(preset.label),
    endpoints: preset.endpoints,
    models: PRESET_MODELS[preset.id].models,
    customBaseUrl: null,
  };
};

export const sourceProtocols = (source: ProviderSource): readonly Protocol[] =>
  source.endpoints.map((endpoint) => endpoint.protocol);
