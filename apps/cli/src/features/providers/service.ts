import { YoinkError } from "../../shared/errors";
import { validateProviderId } from "../../shared/validators";
import { listProfiles, removeProfile, updateProfile, upsertProfile } from "../profiles/service";
import { pruneStaleDefaultModels } from "../profiles/default-model";
import { loadStore, saveStore } from "../profiles/store";
import type { ProviderProfile } from "../profiles/types";
import { HARNESS_ADAPTERS } from "../harnesses/registry";
import { disconnectHarnesses, loadProvider, resyncProvider, type HarnessOutcome } from "../harnesses/sync";
import { buildProviderProfile, type ProviderInput } from "./build-profile";
import { ownedHarnessIds } from "./harness-ownership";
import { createImportProvider, type ImportProvider } from "./import-provider";

export { buildProviderProfile, type ProviderInput } from "./build-profile";
export type { ImportResult } from "./import-provider";

export type ProviderPatch = Partial<ProviderInput>;

const assertValidInput = (input: ProviderInput): void => {
  const nameError = validateProviderId(input.name);
  if (nameError) throw new YoinkError(`Invalid provider name "${input.name}": ${nameError}.`);
  if (input.endpoints.length === 0) throw new YoinkError("A provider needs at least one working endpoint.");
  if (input.models.length === 0) throw new YoinkError("Select at least one model.");
};

export const addProvider = async (input: ProviderInput): Promise<ProviderProfile> => {
  assertValidInput(input);
  const { profiles } = await listProfiles();
  if (profiles.some((profile) => profile.name === input.name)) {
    throw new YoinkError(`A profile named "${input.name}" already exists.`);
  }
  const profile = buildProviderProfile(input);
  await upsertProfile(profile, false);
  return profile;
};

export const updateProvider = async (name: string, patch: ProviderPatch): Promise<HarnessOutcome[]> => {
  const current = await loadProvider(name);
  const models = patch.models ?? current.models;
  const next: ProviderProfile = {
    ...buildProviderProfile(
      {
        name: patch.name ?? current.name,
        displayName: patch.displayName ?? current.provider,
        token: patch.token ?? current.token,
        endpoints: patch.endpoints ?? current.endpoints,
        models,
        presetId: patch.presetId ?? current.presetId,
      },
      pruneStaleDefaultModels(current.connections, models),
    ),
  };
  assertValidInput({ ...next, displayName: next.provider });
  await updateProfile(name, next);
  return resyncProvider(await loadProvider(next.name), name);
};

export const removeProvider = async (name: string): Promise<HarnessOutcome[]> => {
  const provider = await loadProvider(name);
  const outcomes = await disconnectHarnesses(name, await ownedHarnessIds(provider, HARNESS_ADAPTERS));
  if (outcomes.every((outcome) => outcome.ok)) await removeProfile(name);
  return outcomes;
};

export const importProvider: ImportProvider = createImportProvider({
  store: { loadStore, saveStore },
  adapters: HARNESS_ADAPTERS,
});
