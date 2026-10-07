import type { ModelSpec } from "./types";

export const MODEL_SPEC_DEFAULTS = {
  contextWindow: 128000,
  maxOutput: 32000,
  reasoning: false,
  input: ["text"],
} as const satisfies Omit<ModelSpec, "id" | "name">;

export const defaultModelSpec = (id: string, name: string = id): ModelSpec => ({
  id,
  name,
  contextWindow: MODEL_SPEC_DEFAULTS.contextWindow,
  maxOutput: MODEL_SPEC_DEFAULTS.maxOutput,
  reasoning: MODEL_SPEC_DEFAULTS.reasoning,
  input: [...MODEL_SPEC_DEFAULTS.input],
});
