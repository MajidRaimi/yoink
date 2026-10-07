import type { Endpoint, Protocol, ProviderProfile } from "../profiles/types";

const TRAILING_SLASHES = /\/+$/;
const TRAILING_V1 = /\/v1$/;
const TRAILING_VERSION = /\/v\d+(?:(?:alpha|beta)\d*)?(?:\/openai)?$/;
const TRAILING_OPERATION = /\/(?:chat\/completions|completions|responses|messages|models)$/;

export const stripTrailingSlashes = (url: string): string => url.trim().replace(TRAILING_SLASHES, "");

const parseUrl = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

const stripOperationPath = (path: string): string =>
  stripTrailingSlashes(stripTrailingSlashes(path).replace(TRAILING_OPERATION, ""));

export const canonicalBaseUrl = (url: string): string => {
  const parsed = parseUrl(url.trim());
  if (!parsed) return stripOperationPath(url);
  parsed.search = "";
  parsed.hash = "";
  parsed.pathname = stripOperationPath(parsed.pathname);
  return stripTrailingSlashes(parsed.toString());
};

export const hasVersionSuffix = (url: string): boolean => TRAILING_VERSION.test(canonicalBaseUrl(url));

export const withV1 = (url: string): string => {
  const base = canonicalBaseUrl(url);
  return hasVersionSuffix(base) ? base : `${base}/v1`;
};

export const withoutV1 = (url: string): string => canonicalBaseUrl(url).replace(TRAILING_V1, "");

export const normalizeEndpointUrl = (protocol: Protocol, url: string): string =>
  protocol === "anthropic-messages" ? withoutV1(url) : canonicalBaseUrl(url);

export const sdkBaseUrl = (endpoint: Endpoint): string =>
  endpoint.protocol === "anthropic-messages" ? `${withoutV1(endpoint.baseUrl)}/v1` : canonicalBaseUrl(endpoint.baseUrl);

export const openaiBaseCandidates = (url: string): string[] => [...new Set([canonicalBaseUrl(url), withV1(url)])];

export const pickEndpoint = (
  provider: Pick<ProviderProfile, "endpoints">,
  preferred: readonly Protocol[],
): Endpoint | undefined => {
  for (const protocol of preferred) {
    const match = provider.endpoints.find((endpoint) => endpoint.protocol === protocol);
    if (match) return match;
  }
  return undefined;
};

export const supportsAny = (provider: Pick<ProviderProfile, "endpoints">, protocols: readonly Protocol[]): boolean =>
  pickEndpoint(provider, protocols) !== undefined;
