import { withoutV1 } from "../harnesses/endpoint";
import type { HarnessAdapter, ImportedProvider } from "../harnesses/types";
import type { Endpoint, HarnessId, ProviderProfile } from "../profiles/types";

export type ProviderIdentity = {
  token: string;
  endpoints: Endpoint[];
};

const sameBaseUrl = (left: string, right: string): boolean => withoutV1(left) === withoutV1(right);

export const sharesBaseUrl = (left: readonly Endpoint[], right: readonly Endpoint[]): boolean =>
  left.some((endpoint) => right.some((other) => sameBaseUrl(endpoint.baseUrl, other.baseUrl)));

export const isSameProvider = (identity: ProviderIdentity, entry: ImportedProvider): boolean =>
  entry.token === identity.token && sharesBaseUrl(identity.endpoints, entry.endpoints);

const ownsLiveEntry = async (
  adapter: HarnessAdapter,
  name: string,
  identity: ProviderIdentity,
): Promise<boolean> => {
  try {
    if (adapter.exclusive) return await adapter.isConnected(name);
    const entries = await adapter.readProviders();
    return entries.some((entry) => entry.id === name && isSameProvider(identity, entry));
  } catch {
    return false;
  }
};

export const ownedHarnessIds = async (
  provider: Pick<ProviderProfile, "name" | "token" | "endpoints" | "connections">,
  adapters: readonly HarnessAdapter[],
): Promise<HarnessId[]> => {
  const recorded = Object.keys(provider.connections) as HarnessId[];
  const unrecorded = adapters.filter((adapter) => !recorded.includes(adapter.id));
  const owned = await Promise.all(
    unrecorded.map(async (adapter) => ((await ownsLiveEntry(adapter, provider.name, provider)) ? [adapter.id] : [])),
  );
  return [...recorded, ...owned.flat()];
};
