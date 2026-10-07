import { YoinkError } from "../../shared/errors";
import { normalizeEndpointUrl } from "../harnesses/endpoint";
import type { Endpoint, Protocol } from "../profiles/types";
import { findPreset } from "./presets";
import { probeProvider, type ProbeInput } from "./probe";
import type { ProbeResult } from "./types";

export type EndpointRequest = {
  name: string;
  preset?: string;
  baseUrl?: string;
  displayName?: string;
  protocols: readonly Protocol[];
  endpoints?: readonly Endpoint[];
};

export type ResolvedEndpoints = {
  endpoints: Endpoint[];
  displayName: string;
};

export type ProviderProbe = (input: ProbeInput) => Promise<ProbeResult>;

export const resolveProviderEndpoints = async (
  request: EndpointRequest,
  token: string,
  probe: ProviderProbe = probeProvider,
): Promise<ResolvedEndpoints> => {
  if (request.preset) {
    const preset = findPreset(request.preset);
    if (!preset) throw new YoinkError(`Unknown preset "${request.preset}".`);
    return { endpoints: [...preset.endpoints], displayName: request.displayName ?? preset.label };
  }
  const baseUrl = request.baseUrl ?? "";
  const displayName = request.displayName ?? request.name;
  if (request.endpoints && request.endpoints.length > 0) {
    return {
      endpoints: request.endpoints.map((endpoint) => ({
        protocol: endpoint.protocol,
        baseUrl: normalizeEndpointUrl(endpoint.protocol, endpoint.baseUrl),
      })),
      displayName,
    };
  }
  if (request.protocols.length > 0) {
    return {
      endpoints: request.protocols.map((protocol) => ({ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) })),
      displayName,
    };
  }
  return { endpoints: (await probe({ baseUrl, token })).endpoints, displayName };
};
