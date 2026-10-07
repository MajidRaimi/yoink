import type { Endpoint, ModelInput, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { slugify } from "../../profiles/naming";
import { hostSlug, normalizeEndpointUrl } from "../endpoint";
import type { ImportedProvider } from "../types";
import { asRecord, isRecord, omitKeys, readBoolean, readString, type ConfigRecord } from "./config-values";
import { literalToken, supportsImages, toModelSpec } from "./model-mapping";

export const DROID_PROTOCOLS: readonly Protocol[] = ["anthropic-messages", "openai-responses", "openai-chat"];

const PROVIDER_BY_PROTOCOL: Record<Protocol, string> = {
  "anthropic-messages": "anthropic",
  "openai-responses": "openai",
  "openai-chat": "generic-chat-completion-api",
};

const MANAGED_KEYS = ["model", "displayName", "baseUrl", "apiKey", "provider", "maxOutputTokens", "noImageSupport"];
const BRACKET_SUFFIX = /^(.*?)\s*\[([^\]]+)\]$/;

export const ownershipTag = (providerId: string): string => ` [${providerId}]`;

export const isOwnedEntry = (entry: unknown, providerId: string): boolean => {
  const displayName = readString(asRecord(entry).displayName);
  return displayName !== undefined && displayName.endsWith(ownershipTag(providerId));
};

export const entryModelId = (entry: unknown): string | undefined => readString(asRecord(entry).model);

export const toDroidEntry = (
  provider: ProviderProfile,
  endpoint: Endpoint,
  model: ModelSpec,
  existing: unknown,
): ConfigRecord => ({
  ...omitKeys(asRecord(existing), MANAGED_KEYS),
  model: model.id,
  displayName: `${model.name}${ownershipTag(provider.name)}`,
  baseUrl: normalizeEndpointUrl(endpoint.protocol, endpoint.baseUrl),
  apiKey: provider.token,
  provider: PROVIDER_BY_PROTOCOL[endpoint.protocol],
  maxOutputTokens: model.maxOutput,
  noImageSupport: !supportsImages(model),
});

const protocolOf = (provider: unknown): Protocol | undefined =>
  DROID_PROTOCOLS.find((protocol) => PROVIDER_BY_PROTOCOL[protocol] === provider);

const inputsOf = (noImageSupport: boolean | undefined): ModelInput[] | undefined => {
  if (noImageSupport === undefined) return undefined;
  return noImageSupport ? ["text"] : ["text", "image"];
};

type ParsedEntry = {
  key: string;
  providerName: string | undefined;
  protocol: Protocol;
  baseUrl: string;
  token: string | null;
  model: ModelSpec;
};

const parseEntry = (entry: unknown): ParsedEntry[] => {
  if (!isRecord(entry)) return [];
  const protocol = protocolOf(entry.provider);
  const baseUrl = readString(entry.baseUrl);
  const modelId = readString(entry.model);
  if (!protocol || !baseUrl || !modelId) return [];
  const displayName = readString(entry.displayName) ?? modelId;
  const bracket = BRACKET_SUFFIX.exec(displayName);
  const token = literalToken(entry.apiKey);
  const normalizedUrl = normalizeEndpointUrl(protocol, baseUrl);
  return [
    {
      key: `${protocol}\u0000${normalizedUrl}\u0000${token ?? ""}`,
      providerName: bracket?.[2]?.trim(),
      protocol,
      baseUrl: normalizedUrl,
      token,
      model: toModelSpec({
        id: modelId,
        name: bracket?.[1]?.trim() || displayName,
        maxOutput: entry.maxOutputTokens,
        input: inputsOf(readBoolean(entry.noImageSupport)),
      }),
    },
  ];
};

const toImported = (group: ParsedEntry[]): ImportedProvider[] => {
  const [first] = group;
  if (!first) return [];
  const displayName = first.providerName ?? hostSlug(first.baseUrl);
  return [
    {
      source: "droid",
      id: first.providerName ? slugify(first.providerName) : hostSlug(first.baseUrl),
      displayName,
      token: first.token,
      endpoints: [{ protocol: first.protocol, baseUrl: first.baseUrl }],
      models: group.map((parsed) => parsed.model),
    },
  ];
};

export const importDroidModels = (entries: readonly unknown[]): ImportedProvider[] => {
  const groups = new Map<string, ParsedEntry[]>();
  for (const parsed of entries.flatMap(parseEntry)) {
    const group = groups.get(parsed.key);
    if (!group) groups.set(parsed.key, [parsed]);
    else if (!group.some((existing) => existing.model.id === parsed.model.id)) group.push(parsed);
  }
  return [...groups.values()].flatMap(toImported);
};
