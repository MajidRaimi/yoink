import { note, outro } from "@clack/prompts";
import { errorMessage } from "../../../shared/errors";
import { theme } from "../../../shared/theme";
import { promptPassword, promptSelect, promptText } from "../../../shared/prompt";
import { withSpinner } from "../../../shared/spinner";
import { requireNonEmpty, validateHttpUrl, validateProviderId } from "../../../shared/validators";
import { loadProvider } from "../../harnesses/sync";
import type { ExternalProfile, ProviderProfile } from "../../profiles/types";
import { fetchProviderModels, probeProvider } from "../../providers/probe";
import { lookupModelSpecs } from "../../providers/catalog";
import { updateProvider, type ProviderPatch } from "../../providers/service";
import type { ProviderModel } from "../../providers/types";
import { manageProviderHarnesses } from "./harness-flow";
import { pickModelSelection } from "./pick-models-flow";
import { reportOutcomes } from "./report-outcomes";

type FieldChoice = "name" | "provider" | "token" | "endpoints" | "models" | "harnesses" | "done";

const warnProvider = (message: string): void => {
  note(theme.warn(message), "Provider");
};

const withRequestSpinner = <T,>(message: string, task: () => Promise<T>): Promise<T | null> =>
  withSpinner(message, task, warnProvider, "Request failed.");

const listAvailableModels = async (draft: ProviderProfile): Promise<ProviderModel[] | null> => {
  const endpoint = draft.endpoints[0];
  if (!endpoint) return null;
  return withRequestSpinner("Fetching models", () => fetchProviderModels(endpoint, draft.token));
};

const promptModelsPatch = async (draft: ProviderProfile): Promise<ProviderPatch | null> => {
  const available = await listAvailableModels(draft);
  if (available === null) return null;
  const ids = await pickModelSelection(
    available,
    draft.models.map((model) => model.id),
  );
  if (ids === null || ids.length === 0) return null;
  const kept = draft.models.filter((model) => ids.includes(model.id));
  const fresh = available.filter((model) => ids.includes(model.id) && !kept.some((existing) => existing.id === model.id));
  const affinity = { presetId: draft.presetId, baseUrls: draft.endpoints.map((endpoint) => endpoint.baseUrl) };
  const looked = await withRequestSpinner("Looking up context windows on models.dev", () =>
    lookupModelSpecs(fresh, { affinity }),
  );
  if (looked === null) return null;
  return { models: [...kept, ...looked] };
};

const promptEndpointsPatch = async (draft: ProviderProfile): Promise<ProviderPatch | null> => {
  const baseUrl = await promptText({
    message: "Base URL to probe",
    initialValue: draft.endpoints[0]?.baseUrl ?? draft.baseUrl,
    validate: validateHttpUrl,
  });
  if (baseUrl === null) return null;
  const result = await withRequestSpinner("Probing endpoints", () => probeProvider({ baseUrl, token: draft.token }));
  if (result === null) return null;
  note(result.endpoints.map((endpoint) => `${endpoint.protocol}  ${endpoint.baseUrl}`).join("\n"), "Endpoints");
  return { endpoints: result.endpoints };
};

const promptFieldPatch = async (field: FieldChoice, draft: ProviderProfile): Promise<ProviderPatch | null> => {
  switch (field) {
    case "name": {
      const value = await promptText({ message: "Profile id", initialValue: draft.name, validate: validateProviderId });
      return value === null || value === draft.name ? null : { name: value };
    }
    case "provider": {
      const value = await promptText({ message: "Display name", initialValue: draft.provider, validate: requireNonEmpty });
      return value === null ? null : { displayName: value };
    }
    case "token": {
      const value = await promptPassword({ message: "API key", validate: requireNonEmpty });
      return value === null ? null : { token: value };
    }
    case "endpoints":
      return promptEndpointsPatch(draft);
    case "models":
      return promptModelsPatch(draft);
    default:
      return null;
  }
};

const fieldOptions = (draft: ProviderProfile) => [
  { value: "harnesses" as const, label: theme.accent("Harnesses"), hint: Object.keys(draft.connections).join(", ") || "none" },
  { value: "models" as const, label: "Models", hint: `${draft.models.length} selected` },
  { value: "name" as const, label: "Profile id", hint: draft.name },
  { value: "provider" as const, label: "Display name", hint: draft.provider },
  { value: "token" as const, label: "API key", hint: "hidden" },
  { value: "endpoints" as const, label: "Endpoints", hint: draft.endpoints.map((endpoint) => endpoint.protocol).join(", ") },
  { value: "done" as const, label: theme.accent("Done") },
];

export const editExternalProfile = async (original: ExternalProfile): Promise<void> => {
  let key = original.name;
  for (;;) {
    const draft = await loadProvider(key);
    const field = await promptSelect<FieldChoice>({ message: `Edit ${draft.name}`, options: fieldOptions(draft) });
    if (field === null || field === "done") break;
    if (field === "harnesses") {
      await manageProviderHarnesses(key);
      continue;
    }
    const patch = await promptFieldPatch(field, draft);
    if (patch === null) continue;
    try {
      reportOutcomes(await updateProvider(key, patch), "Re-synced");
      key = patch.name ?? key;
    } catch (error) {
      warnProvider(errorMessage(error, "Could not save."));
    }
  }
  outro("Done.");
};

export const editProviderModels = async (name: string): Promise<void> => {
  const draft = await loadProvider(name);
  const patch = await promptModelsPatch(draft);
  if (patch === null) {
    outro("No changes.");
    return;
  }
  reportOutcomes(await updateProvider(name, patch), "Re-synced");
  outro("Done.");
};
