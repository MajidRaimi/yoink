import { loadProvider, type HarnessOutcome } from "../harnesses/sync";
import type { ModelSpec } from "../profiles/types";
import { lookupModelSpecs, type CatalogOptions } from "./catalog";
import { updateProvider } from "./service";
import type { ProviderModel } from "./types";

export type ModelSelection = {
  kept: ModelSpec[];
  missing: ProviderModel[];
};

export type ModelSpecLookup = (models: ProviderModel[], options: CatalogOptions) => Promise<ModelSpec[]>;

export const splitModelSelection = (current: readonly ModelSpec[], ids: readonly string[]): ModelSelection => {
  const requested = [...new Set(ids)];
  const kept = current.filter((model) => requested.includes(model.id));
  const missing = requested.filter((id) => !kept.some((model) => model.id === id)).map((id) => ({ id, name: id }));
  return { kept, missing };
};

export const setProviderModels = async (
  name: string,
  ids: readonly string[],
  lookup: ModelSpecLookup = lookupModelSpecs,
): Promise<HarnessOutcome[]> => {
  const provider = await loadProvider(name);
  const { kept, missing } = splitModelSelection(provider.models, ids);
  const affinity = { presetId: provider.presetId, baseUrls: provider.endpoints.map((endpoint) => endpoint.baseUrl) };
  return updateProvider(name, { models: [...kept, ...(await lookup(missing, { affinity }))] });
};
