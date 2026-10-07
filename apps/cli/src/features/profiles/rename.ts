import { YoinkError } from "../../shared/errors";
import { validateProviderId } from "../../shared/validators";
import type { HarnessOutcome } from "../harnesses/sync";
import { toProviderProfile, type ProfileStoreRepository } from "./store";
import { renameInCurrentByTool } from "./subscription-profile";
import type { ProviderProfile } from "./types";

export type ResyncRenamedProvider = (provider: ProviderProfile, previousName: string) => Promise<HarnessOutcome[]>;

export type RenameProfile = (from: string, to: string) => Promise<HarnessOutcome[]>;

export type RenameProfileDeps = {
  store: ProfileStoreRepository;
  resync: ResyncRenamedProvider;
};

const hasConnections = (provider: ProviderProfile): boolean => Object.keys(provider.connections).length > 0;

const assertHarnessSafeName = (provider: ProviderProfile, to: string): void => {
  if (!hasConnections(provider)) return;
  const nameError = validateProviderId(to);
  if (nameError) throw new YoinkError(`Invalid provider name "${to}": ${nameError}.`);
};

export const createRenameProfile =
  ({ store: repository, resync }: RenameProfileDeps): RenameProfile =>
  async (from, to) => {
    const store = await repository.loadStore();
    const profile = store.profiles[from];
    if (!profile) throw new YoinkError(`No profile named "${from}".`);
    if (store.profiles[to]) throw new YoinkError(`A profile named "${to}" already exists.`);
    const renamed = { ...profile, name: to };
    if (renamed.type === "external") assertHarnessSafeName(toProviderProfile(renamed), to);
    delete store.profiles[from];
    store.profiles[to] = renamed;
    if (store.current === from) store.current = to;
    renameInCurrentByTool(store, from, to);
    await repository.saveStore(store);
    if (renamed.type !== "external") return [];
    return resync(toProviderProfile(renamed), from);
  };
