import type { Endpoint, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { slugify } from "../../profiles/naming";
import { normalizeEndpointUrl, sdkBaseUrl } from "../endpoint";
import type { ImportedProvider } from "../types";
import { asRecord, isRecord, readString, type ConfigRecord } from "./config-values";
import { literalToken, supportsImages, toModelSpec } from "./model-mapping";

export const CONTINUE_PROTOCOLS: readonly Protocol[] = ["openai-chat", "anthropic-messages"];

const PROVIDER_BY_PROTOCOL: Partial<Record<Protocol, string>> = {
  "openai-chat": "openai",
  "anthropic-messages": "anthropic",
};

const PROTOCOL_BY_PROVIDER: Record<string, Protocol> = {
  openai: "openai-chat",
  anthropic: "anthropic-messages",
};

const DEFAULT_API_BASE: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com",
};

const MODEL_ROLES = ["chat", "edit", "apply"];
const TOOL_USE = "tool_use";
const IMAGE_INPUT = "image_input";

export const ownedSuffix = (providerId: string): string => ` (${providerId})`;

export const ownedEntryName = (providerId: string, model: ModelSpec): string => `${model.name}${ownedSuffix(providerId)}`;

export const isOwnedEntry = (entry: unknown, providerId: string): boolean => {
  const name = isRecord(entry) ? readString(entry.name) : undefined;
  const provider = isRecord(entry) ? readString(entry.provider) : undefined;
  return name !== undefined && provider !== undefined && provider in PROTOCOL_BY_PROVIDER && name.endsWith(ownedSuffix(providerId));
};

export const buildContinueModelEntry = (provider: ProviderProfile, endpoint: Endpoint, model: ModelSpec): ConfigRecord => ({
  name: ownedEntryName(provider.name, model),
  provider: PROVIDER_BY_PROTOCOL[endpoint.protocol],
  model: model.id,
  apiBase: `${sdkBaseUrl(endpoint)}/`,
  apiKey: provider.token,
  roles: MODEL_ROLES,
  capabilities: supportsImages(model) ? [TOOL_USE, IMAGE_INPUT] : [TOOL_USE],
  defaultCompletionOptions: { contextLength: model.contextWindow, maxTokens: model.maxOutput },
});

const OWNED_NAME = /^(.*) \(([^()]+)\)$/;
const TEMPLATE_REFERENCE = /\$\{\{[^}]*\}\}/;

const continueToken = (value: unknown): string | null => {
  const token = literalToken(value);
  return token !== null && TEMPLATE_REFERENCE.test(token) ? null : token;
};

const hostId = (url: string): string => {
  try {
    return slugify(new URL(url).hostname.replace(/^api\./, "").split(".")[0] ?? "");
  } catch {
    return slugify(url);
  }
};

type ParsedEntry = {
  groupKey: string;
  id: string;
  token: string | null;
  endpoint: Endpoint;
  model: ModelSpec;
};

const parseEntry = (entry: unknown): ParsedEntry | null => {
  if (!isRecord(entry)) return null;
  const providerName = readString(entry.provider);
  const modelId = readString(entry.model);
  const protocol = providerName === undefined ? undefined : PROTOCOL_BY_PROVIDER[providerName];
  if (!providerName || !modelId || !protocol) return null;
  const apiBase = readString(entry.apiBase) ?? DEFAULT_API_BASE[providerName] ?? "";
  const endpoint: Endpoint = { protocol, baseUrl: normalizeEndpointUrl(protocol, apiBase) };
  const token = continueToken(entry.apiKey);
  const rawName = readString(entry.name) ?? modelId;
  const owned = OWNED_NAME.exec(rawName);
  const options = asRecord(entry.defaultCompletionOptions);
  const capabilities = Array.isArray(entry.capabilities) ? entry.capabilities : [];
  const model = toModelSpec({
    id: modelId,
    name: owned?.[1] ?? rawName,
    contextWindow: options.contextLength,
    maxOutput: options.maxTokens,
    reasoning: options.reasoning,
    input: capabilities.includes(IMAGE_INPUT) ? ["text", "image"] : ["text"],
  });
  const id = owned?.[2] ?? hostId(endpoint.baseUrl);
  return { groupKey: `${id}\u0000${endpoint.baseUrl}\u0000${token ?? ""}`, id, token, endpoint, model };
};

const toImported = (entries: ParsedEntry[]): ImportedProvider[] => {
  const groups = new Map<string, ImportedProvider>();
  for (const entry of entries) {
    const existing = groups.get(entry.groupKey);
    if (!existing) {
      groups.set(entry.groupKey, {
        source: "continue",
        id: entry.id,
        displayName: entry.id,
        token: entry.token,
        endpoints: [entry.endpoint],
        models: [entry.model],
      });
    } else if (!existing.models.some((model) => model.id === entry.model.id)) {
      existing.models.push(entry.model);
    }
  }
  return [...groups.values()];
};

export const importContinueProviders = (models: readonly unknown[]): ImportedProvider[] =>
  toImported(models.flatMap((entry) => parseEntry(entry) ?? []));
