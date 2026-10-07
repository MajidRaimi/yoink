import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { canonicalBaseUrl, normalizeEndpointUrl, withoutV1 } from "../endpoint";
import type { ImportedProvider } from "../types";
import { asRecord, isRecord, readString, type ConfigRecord } from "./config-values";
import { envNameSegment } from "./env-name";
import { toModelSpec } from "./model-mapping";

export const GOOSE_PROTOCOLS: readonly Protocol[] = ["openai-chat", "anthropic-messages"];

const CUSTOM_PREFIX = "custom_";
const CHAT_COMPLETIONS_PATH = "/chat/completions";
const ENGINE_BY_PROTOCOL: Partial<Record<Protocol, string>> = {
  "openai-chat": "openai",
  "anthropic-messages": "anthropic",
};
const PROTOCOL_BY_ENGINE: Record<string, Protocol> = {
  openai: "openai-chat",
  anthropic: "anthropic-messages",
};

export const gooseProviderName = (providerId: string): string => `${CUSTOM_PREFIX}${providerId}`;

export const providerIdFromGooseName = (name: string): string =>
  name.startsWith(CUSTOM_PREFIX) ? name.slice(CUSTOM_PREFIX.length) : name;

export const gooseApiKeyEnv = (providerId: string): string =>
  `${CUSTOM_PREFIX.toUpperCase()}${envNameSegment(providerId)}_API_KEY`;

const gooseBaseUrl = (endpoint: Endpoint): string =>
  endpoint.protocol === "anthropic-messages"
    ? withoutV1(endpoint.baseUrl)
    : `${canonicalBaseUrl(endpoint.baseUrl)}${CHAT_COMPLETIONS_PATH}`;

const gooseModelEntry = (model: ModelSpec): ConfigRecord => ({
  name: model.id,
  context_limit: model.contextWindow,
});

export const buildGooseProvider = (provider: ProviderProfile, endpoint: Endpoint, existing: unknown): ConfigRecord => ({
  ...asRecord(existing),
  name: gooseProviderName(provider.name),
  engine: ENGINE_BY_PROTOCOL[endpoint.protocol] ?? "openai",
  display_name: provider.provider,
  description: `${provider.provider} via yoink`,
  api_key_env: gooseApiKeyEnv(provider.name),
  base_url: gooseBaseUrl(endpoint),
  models: provider.models.map(gooseModelEntry),
  supports_streaming: true,
});

const importModel = (entry: unknown): ModelSpec[] => {
  if (!isRecord(entry)) return [];
  const id = readString(entry.name);
  return id ? [toModelSpec({ id, contextWindow: entry.context_limit })] : [];
};

export const importGooseProvider = (
  config: unknown,
  secrets: ConfigRecord,
  fallbackName: string,
): ImportedProvider | null => {
  if (!isRecord(config)) return null;
  const protocol = PROTOCOL_BY_ENGINE[readString(config.engine) ?? ""];
  const baseUrl = readString(config.base_url);
  if (!protocol || !baseUrl) return null;
  const id = providerIdFromGooseName(readString(config.name) ?? fallbackName);
  const keyEnv = readString(config.api_key_env);
  return {
    source: "goose",
    id,
    displayName: readString(config.display_name) ?? id,
    token: (keyEnv ? readString(secrets[keyEnv]) : undefined) ?? null,
    endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) }],
    models: Array.isArray(config.models) ? config.models.flatMap(importModel) : [],
  };
};
