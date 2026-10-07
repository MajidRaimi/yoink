import type { Endpoint, Protocol, ProviderProfile } from "../../profiles/types";
import { YoinkError } from "../../../shared/errors";
import { pickEndpoint } from "../endpoint";

export const requireEndpoint = (provider: ProviderProfile, protocols: readonly Protocol[], label: string): Endpoint => {
  const endpoint = pickEndpoint(provider, protocols);
  if (endpoint) return endpoint;
  throw new YoinkError(`${provider.name} has no endpoint ${label} can use (needs one of: ${protocols.join(", ")}).`);
};
