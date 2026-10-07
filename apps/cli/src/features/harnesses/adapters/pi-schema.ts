import type { Endpoint, HarnessId, ModelSpec, Protocol, ProviderProfile } from "../../profiles/types";
import { normalizeEndpointUrl } from "../endpoint";
import type { ImportedProvider } from "../types";
import { asRecord, isRecord, omitKeys, readString, type ConfigRecord } from "./config-values";
import { literalToken, toModelSpec } from "./model-mapping";

export const PI_PROTOCOLS: readonly Protocol[] = ["openai-chat", "openai-responses", "anthropic-messages"];

const API_BY_PROTOCOL: Record<Protocol, string> = {
  "openai-chat": "openai-completions",
  "openai-responses": "openai-responses",
  "anthropic-messages": "anthropic-messages",
};

const MANAGED_MODEL_KEYS = ["id", "name", "reasoning", "input", "contextWindow", "maxTokens"] as const;

export const protocolFromPiApi = (api: unknown): Protocol | undefined =>
  (Object.keys(API_BY_PROTOCOL) as Protocol[]).find((protocol) => API_BY_PROTOCOL[protocol] === api);

const existingModelsById = (existingEntry: unknown): Map<string, ConfigRecord> => {
  const models = asRecord(existingEntry).models;
  if (!Array.isArray(models)) return new Map();
  return new Map(
    models.filter(isRecord).flatMap((model) => {
      const id = readString(model.id);
      return id ? [[id, model] as const] : [];
    }),
  );
};

const toPiModel = (model: ModelSpec, existing: ConfigRecord | undefined): ConfigRecord => ({
  id: model.id,
  name: model.name,
  reasoning: model.reasoning,
  input: [...model.input],
  contextWindow: model.contextWindow,
  maxTokens: model.maxOutput,
  ...omitKeys(existing ?? {}, MANAGED_MODEL_KEYS),
});

export const buildPiProviderEntry = (
  provider: ProviderProfile,
  endpoint: Endpoint,
  existingEntry: unknown,
): ConfigRecord => {
  const existingModels = existingModelsById(existingEntry);
  return {
    ...asRecord(existingEntry),
    name: provider.provider,
    baseUrl: normalizeEndpointUrl(endpoint.protocol, endpoint.baseUrl),
    api: API_BY_PROTOCOL[endpoint.protocol],
    apiKey: provider.token,
    models: provider.models.map((model) => toPiModel(model, existingModels.get(model.id))),
  };
};

const fromPiModel = (model: unknown): ModelSpec[] => {
  if (!isRecord(model)) return [];
  const id = readString(model.id);
  if (!id) return [];
  return [
    toModelSpec({
      id,
      name: model.name,
      contextWindow: model.contextWindow,
      maxOutput: model.maxTokens,
      reasoning: model.reasoning,
      input: model.input,
    }),
  ];
};

const fromPiProvider = (
  source: HarnessId,
  id: string,
  entry: unknown,
  readToken: (value: unknown) => string | null,
): ImportedProvider[] => {
  if (!isRecord(entry)) return [];
  const protocol = protocolFromPiApi(entry.api);
  const baseUrl = readString(entry.baseUrl);
  if (!protocol || !baseUrl) return [];
  return [
    {
      source,
      id,
      displayName: readString(entry.name) ?? id,
      token: readToken(entry.apiKey),
      endpoints: [{ protocol, baseUrl: normalizeEndpointUrl(protocol, baseUrl) }],
      models: Array.isArray(entry.models) ? entry.models.flatMap(fromPiModel) : [],
    },
  ];
};

export const importPiProviders = (
  source: HarnessId,
  providers: unknown,
  readToken: (value: unknown) => string | null = literalToken,
): ImportedProvider[] =>
  Object.entries(asRecord(providers)).flatMap(([id, entry]) => fromPiProvider(source, id, entry, readToken));
