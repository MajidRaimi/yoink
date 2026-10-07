import { MODEL_SPEC_DEFAULTS } from "../../profiles/model-spec";
import type { ModelInput, ModelSpec } from "../../profiles/types";
import { readBoolean, readNumber, readString } from "./config-values";

const ENV_REFERENCE_PATTERNS = [/^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$/, /^\{(env|file):[^}]+\}$/, /^!/];

export type RawModelFields = {
  id: string;
  name?: unknown;
  contextWindow?: unknown;
  maxOutput?: unknown;
  reasoning?: unknown;
  input?: unknown;
};

const defaultModelInputs = (): ModelInput[] => [...MODEL_SPEC_DEFAULTS.input];

export const readModelInputs = (value: unknown): ModelInput[] => {
  if (!Array.isArray(value)) return defaultModelInputs();
  const inputs = value.filter((entry): entry is ModelInput => entry === "text" || entry === "image");
  return inputs.length > 0 ? inputs : defaultModelInputs();
};

export const toModelSpec = (fields: RawModelFields): ModelSpec => ({
  id: fields.id,
  name: readString(fields.name) ?? fields.id,
  contextWindow: readNumber(fields.contextWindow) ?? MODEL_SPEC_DEFAULTS.contextWindow,
  maxOutput: readNumber(fields.maxOutput) ?? MODEL_SPEC_DEFAULTS.maxOutput,
  reasoning: readBoolean(fields.reasoning) ?? MODEL_SPEC_DEFAULTS.reasoning,
  input: readModelInputs(fields.input),
});

export const isEnvReference = (value: string): boolean =>
  ENV_REFERENCE_PATTERNS.some((pattern) => pattern.test(value.trim()));

export const literalToken = (value: unknown): string | null => {
  const token = readString(value);
  return token === undefined || isEnvReference(token) ? null : token;
};

export const qualifiedModelRef = (providerId: string, modelId: string): string => `${providerId}/${modelId}`;

export const refersToProvider = (modelRef: unknown, providerId: string): boolean =>
  typeof modelRef === "string" && modelRef.startsWith(`${providerId}/`);

export const modelIdFromRef = (modelRef: unknown, providerId: string): string | null =>
  refersToProvider(modelRef, providerId) ? String(modelRef).slice(providerId.length + 1) : null;

export const supportsImages = (model: ModelSpec): boolean => model.input.includes("image");
