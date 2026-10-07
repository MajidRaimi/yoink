import type { AddProviderInput, Endpoint, HarnessId, ProviderPreset } from "@/shared/types";

const PROVIDER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export type KeyStepDraft = {
  preset: ProviderPreset | null;
  name: string;
  baseUrl: string;
  token: string;
};

export const normalizeBaseUrl = (raw: string): string => raw.trim().replace(/\/+$/, "");

export const validateKeyStep = (draft: KeyStepDraft, takenNames: ReadonlySet<string>): string | null => {
  const name = draft.name.trim();
  if (name.length === 0) return "A provider id is required";
  if (!PROVIDER_ID_PATTERN.test(name)) return "Use letters, digits, dots, dashes or underscores in the id";
  if (takenNames.has(name)) return `A profile named ${name} already exists`;
  if (draft.preset === null && !/^https?:\/\//.test(draft.baseUrl.trim())) {
    return "Base URL must start with http:// or https://";
  }
  if (draft.token.trim().length === 0) return "An API key is required";
  return null;
};

type SubmitDraft = KeyStepDraft & {
  displayName: string;
  endpoints: readonly Endpoint[];
  models: readonly string[];
  harnesses: readonly HarnessId[];
  defaultModel: string | null;
};

const displayNameFor = (draft: SubmitDraft): string | null => {
  const displayName = draft.displayName.trim();
  if (displayName.length === 0 || displayName === draft.preset?.label) return null;
  return displayName;
};

export const toAddProviderInput = (draft: SubmitDraft): AddProviderInput => ({
  name: draft.name.trim(),
  displayName: displayNameFor(draft),
  preset: draft.preset?.id ?? null,
  baseUrl: draft.preset === null ? normalizeBaseUrl(draft.baseUrl) : null,
  protocols: [],
  endpoints: draft.preset === null ? draft.endpoints.map((endpoint) => ({ ...endpoint })) : [],
  models: [...draft.models],
  connect: [...draft.harnesses],
  defaultModel: draft.harnesses.length > 0 ? draft.defaultModel : null,
  token: draft.token.trim(),
});
