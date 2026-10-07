import { YoinkError } from "../../shared/errors";
import { validateHttpUrl } from "../../shared/validators";
import type { Endpoint } from "../profiles/types";
import { discoverPreset } from "./preset-discovery";
import { findPreset, PROVIDER_PRESETS, type ProviderPreset } from "./presets";
import { probeProvider } from "./probe";
import type { Fetcher, ProbeResult } from "./types";

export type PresetSummary = {
  id: string;
  label: string;
  endpoints: Endpoint[];
};

export type DiscoveryTarget = { kind: "preset"; presetId: string } | { kind: "base-url"; baseUrl: string };

export type DiscoveryDeps = {
  fetcher?: Fetcher;
};

const toSummary = (preset: ProviderPreset): PresetSummary => ({
  id: preset.id,
  label: preset.label,
  endpoints: preset.endpoints.map((endpoint) => ({ protocol: endpoint.protocol, baseUrl: endpoint.baseUrl })),
});

export const presetSummaries = (presets: readonly ProviderPreset[] = PROVIDER_PRESETS): PresetSummary[] =>
  presets.map(toSummary);

const requirePreset = (id: string): ProviderPreset => {
  const preset = findPreset(id);
  if (!preset) throw new YoinkError(`Unknown preset "${id}". Use one of: ${PROVIDER_PRESETS.map((preset) => preset.id).join(", ")}.`);
  return preset;
};

const requireBaseUrl = (baseUrl: string): string => {
  const error = validateHttpUrl(baseUrl);
  if (error) throw new YoinkError(`Invalid --base-url: ${error}`);
  return baseUrl.trim();
};

export const discoverProvider = async (
  target: DiscoveryTarget,
  token: string,
  { fetcher = fetch }: DiscoveryDeps = {},
): Promise<ProbeResult> => {
  if (target.kind === "preset") return discoverPreset(requirePreset(target.presetId), token, fetcher);
  return probeProvider({ baseUrl: requireBaseUrl(target.baseUrl), token, fetcher });
};
