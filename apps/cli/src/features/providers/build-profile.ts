import { nowIso } from "../../shared/time";
import type { Connections, Endpoint, ModelSpec, ProviderProfile } from "../profiles/types";

export type ProviderInput = {
  name: string;
  displayName: string;
  token: string;
  endpoints: Endpoint[];
  models: ModelSpec[];
  presetId?: string;
};

const legacyBaseUrl = (endpoints: Endpoint[]): string =>
  (endpoints.find((endpoint) => endpoint.protocol === "anthropic-messages") ?? endpoints[0])?.baseUrl ?? "";

export const buildProviderProfile = (input: ProviderInput, connections: Connections = {}): ProviderProfile => ({
  type: "external",
  name: input.name,
  provider: input.displayName,
  baseUrl: legacyBaseUrl(input.endpoints),
  token: input.token,
  model: input.models[0]?.id ?? "",
  updatedAt: nowIso(),
  presetId: input.presetId,
  endpoints: input.endpoints,
  models: input.models,
  connections,
});
