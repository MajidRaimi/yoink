import type { Endpoint, ModelSpec, Protocol } from "../../profiles/types";
import { slugify } from "../../profiles/naming";
import { normalizeEndpointUrl } from "../endpoint";
import type { ImportedProvider } from "../types";
import { asRecord, isRecord, readString, type ConfigRecord } from "./config-values";
import { envNameSegment, FINGERPRINT_SUFFIX } from "./env-name";
import { literalToken, toModelSpec } from "./model-mapping";

export type QwenAuthType = "openai" | "anthropic";

export const QWEN_AUTH_TYPES: readonly QwenAuthType[] = ["openai", "anthropic"];

export const AUTH_TYPE_BY_PROTOCOL: Record<Protocol, QwenAuthType> = {
  "openai-chat": "openai",
  "openai-responses": "openai",
  "anthropic-messages": "anthropic",
};

export const WIRE_API_BY_PROTOCOL: Partial<Record<Protocol, string>> = {
  "openai-chat": "chat-completions",
  "openai-responses": "responses",
};

const OWNED_ENV_KEY = /^YOINK_(.+)_API_KEY$/;
const GENERIC_ENV_KEY = /^(.+?)_API_KEY$/;

export const ownedEnvKey = (providerId: string): string => `YOINK_${envNameSegment(providerId)}_API_KEY`;

export const modelProvidersOf = (config: ConfigRecord): ConfigRecord => asRecord(config.modelProviders);

export const entriesOf = (config: ConfigRecord, authType: QwenAuthType): unknown[] => {
  const entries = modelProvidersOf(config)[authType];
  return Array.isArray(entries) ? entries : [];
};

export const isOwnedBy = (entry: unknown, envKey: string): boolean => isRecord(entry) && entry.envKey === envKey;

const protocolOf = (authType: QwenAuthType, entry: ConfigRecord): Protocol => {
  if (authType === "anthropic") return "anthropic-messages";
  return entry.wireApi === WIRE_API_BY_PROTOCOL["openai-responses"] ? "openai-responses" : "openai-chat";
};

const idFromEnvKey = (envKey: string): string | undefined => {
  const match = OWNED_ENV_KEY.exec(envKey) ?? GENERIC_ENV_KEY.exec(envKey);
  return match?.[1] ? slugify(match[1].replace(FINGERPRINT_SUFFIX, "")) : undefined;
};

const idFromBaseUrl = (baseUrl: string): string => {
  try {
    return slugify(new URL(baseUrl).hostname.replace(/^api\./, ""));
  } catch {
    return slugify(baseUrl);
  }
};

const fromQwenModel = (entry: ConfigRecord, id: string): ModelSpec => {
  const generation = asRecord(entry.generationConfig);
  return toModelSpec({
    id,
    name: entry.name,
    contextWindow: generation.contextWindowSize,
    maxOutput: asRecord(generation.samplingParams).max_tokens,
  });
};

type QwenEntry = { groupId: string; envKey: string | undefined; endpoint: Endpoint; model: ModelSpec };

const readEntry = (authType: QwenAuthType, value: unknown): QwenEntry[] => {
  if (!isRecord(value)) return [];
  const id = readString(value.id);
  const baseUrl = readString(value.baseUrl);
  if (!id || !baseUrl) return [];
  const protocol = protocolOf(authType, value);
  const envKey = readString(value.envKey);
  return [
    {
      groupId: (envKey && idFromEnvKey(envKey)) ?? idFromBaseUrl(baseUrl),
      envKey,
      endpoint: { protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) },
      model: fromQwenModel(value, id),
    },
  ];
};

const sameEndpoint = (left: Endpoint, right: Endpoint): boolean =>
  left.protocol === right.protocol && left.baseUrl === right.baseUrl;

const absorbEntry = (provider: ImportedProvider, entry: QwenEntry): ImportedProvider => ({
  ...provider,
  endpoints: provider.endpoints.some((known) => sameEndpoint(known, entry.endpoint))
    ? provider.endpoints
    : [...provider.endpoints, entry.endpoint],
  models: provider.models.some((known) => known.id === entry.model.id)
    ? provider.models
    : [...provider.models, entry.model],
});

const startProvider = (entry: QwenEntry, env: ConfigRecord): ImportedProvider => ({
  source: "qwen",
  id: entry.groupId,
  displayName: entry.groupId,
  token: entry.envKey ? literalToken(env[entry.envKey]) : null,
  endpoints: [entry.endpoint],
  models: [entry.model],
});

export const importQwenProviders = (config: ConfigRecord): ImportedProvider[] => {
  const env = asRecord(config.env);
  const entries = QWEN_AUTH_TYPES.flatMap((authType) =>
    entriesOf(config, authType).flatMap((value) => readEntry(authType, value)),
  );
  const grouped = new Map<string, ImportedProvider>();
  for (const entry of entries) {
    const known = grouped.get(entry.groupId);
    grouped.set(entry.groupId, known ? absorbEntry(known, entry) : startProvider(entry, env));
  }
  return [...grouped.values()];
};
