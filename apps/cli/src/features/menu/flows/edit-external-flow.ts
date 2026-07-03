import { note, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { promptPassword, promptSelect, promptText } from "../../../shared/prompt";
import { requireNonEmpty, validateHttpUrl } from "../../../shared/validators";
import {
  applyExternalEnv,
  GLOBAL_SETTINGS_PATH,
  localSettingsPath,
  readExternalEnv,
} from "../../../shared/claude-settings";
import { fetchModels, normalizeBaseUrl } from "../../provider/service";
import { pickModel } from "../../provider/pick-model";
import type { ProviderModel } from "../../provider/types";
import { updateProfile } from "../../profiles/service";
import type { ExternalProfile } from "../../profiles/types";
import { promptProfileName } from "./prompt-name";

type FieldChoice = "name" | "provider" | "baseUrl" | "token" | "model" | "done";

const nowIso = (): string => new Date().toISOString();

const chooseModelId = async (draft: ExternalProfile): Promise<string | null> => {
  const loader = spinner();
  loader.start("Fetching models");
  let models: ProviderModel[];
  try {
    models = await fetchModels(draft.baseUrl, draft.token);
  } catch (error) {
    loader.stop(theme.warn("Could not fetch models"));
    note(theme.warn(error instanceof Error ? error.message : "Fetch failed."), "Model");
    return null;
  }
  loader.stop(`Found ${theme.accent(String(models.length))} models`);
  const model = await pickModel(models);
  return model?.id ?? null;
};

const reapplyExternalEdit = async (
  original: ExternalProfile,
  draft: ExternalProfile,
  wasCurrent: boolean,
): Promise<void> => {
  if (wasCurrent) {
    await applyExternalEnv(GLOBAL_SETTINGS_PATH, draft);
    outro(`${theme.success("✔")} Updated ${theme.accent(draft.name)} ${pc.dim("(re-applied to ~/.claude/settings.json)")}`);
    return;
  }

  const localPath = localSettingsPath(process.cwd());
  const localEnv = await readExternalEnv(localPath);
  const localPinnedToThisProfile =
    localEnv?.ANTHROPIC_BASE_URL === original.baseUrl &&
    localEnv?.ANTHROPIC_AUTH_TOKEN === original.token &&
    localEnv?.ANTHROPIC_MODEL === original.model;
  if (localPinnedToThisProfile) {
    await applyExternalEnv(localPath, draft);
    outro(`${theme.success("✔")} Updated ${theme.accent(draft.name)} ${pc.dim("(re-applied to ./.claude/settings.local.json)")}`);
    return;
  }

  outro(`${theme.success("✔")} Updated ${theme.accent(draft.name)}. ${pc.dim("Switch to it (or re-run in its project) to apply the new settings.")}`);
};

export const editExternalProfile = async (
  original: ExternalProfile,
  wasCurrent: boolean,
): Promise<void> => {
  let draft: ExternalProfile = { ...original };
  let key = original.name;
  let changed = false;

  const persist = async (next: ExternalProfile): Promise<void> => {
    await updateProfile(key, next);
    draft = next;
    key = next.name;
    changed = true;
  };

  for (;;) {
    const field = await promptSelect<FieldChoice>({
      message: `Edit ${draft.name}`,
      options: [
        { value: "name", label: "Name", hint: draft.name },
        { value: "provider", label: "Provider", hint: draft.provider },
        { value: "baseUrl", label: "Base URL", hint: draft.baseUrl },
        { value: "token", label: "API key", hint: "•••••• (hidden)" },
        { value: "model", label: "Model", hint: draft.model },
        { value: "done", label: theme.accent("Done") },
      ],
      initialValue: "name",
    });
    if (field === null || field === "done") break;

    if (field === "name") {
      const value = await promptProfileName(draft.name);
      if (value !== null && value !== draft.name) {
        try {
          await persist({ ...draft, name: value, updatedAt: nowIso() });
        } catch (error) {
          note(theme.warn(error instanceof Error ? error.message : "Could not rename."), "Name");
        }
      }
    } else if (field === "provider") {
      const value = await promptText({ message: "Provider name", initialValue: draft.provider, validate: requireNonEmpty });
      if (value !== null) await persist({ ...draft, provider: value, updatedAt: nowIso() });
    } else if (field === "baseUrl") {
      const value = await promptText({ message: "Base URL", initialValue: draft.baseUrl, validate: validateHttpUrl });
      if (value !== null) await persist({ ...draft, baseUrl: normalizeBaseUrl(value), updatedAt: nowIso() });
    } else if (field === "token") {
      const value = await promptPassword({ message: "API key", validate: requireNonEmpty });
      if (value !== null) await persist({ ...draft, token: value, updatedAt: nowIso() });
    } else if (field === "model") {
      const modelId = await chooseModelId(draft);
      if (modelId !== null) await persist({ ...draft, model: modelId, updatedAt: nowIso() });
    }
  }

  if (!changed) {
    outro("No changes.");
    return;
  }
  await reapplyExternalEdit(original, draft, wasCurrent);
};
