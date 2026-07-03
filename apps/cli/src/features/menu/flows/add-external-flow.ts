import { cancel, note, outro, spinner } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { promptConfirm, promptPassword, promptSelect, promptText } from "../../../shared/prompt";
import { validateHttpUrl } from "../../../shared/validators";
import {
  applyExternalEnv,
  GLOBAL_SETTINGS_PATH,
  localSettingsPath,
} from "../../../shared/claude-settings";
import { isTrackedAndNotIgnored } from "../../../shared/git-status";
import { fetchModels, normalizeBaseUrl } from "../../provider/service";
import { pickModel } from "../../provider/pick-model";
import type { ProviderModel } from "../../provider/types";
import { listProfiles, upsertProfile } from "../../profiles/service";
import { accountLabel } from "../../profiles/format";
import { slugify, uniqueName } from "../../profiles/naming";
import type { ExternalProfile } from "../../profiles/types";
import { promptProfileName } from "./prompt-name";
import { protectLocalSecret } from "./protect-local-secret";

type ProviderDetails = { provider: string; baseUrl: string; token: string };

const promptProviderDetails = async (): Promise<ProviderDetails | null> => {
  const provider = await promptText({
    message: "Provider name",
    placeholder: "OpenRouter",
    validate: (value) => (value.trim().length === 0 ? "A provider name is required" : undefined),
  });
  if (provider === null) return null;

  const baseUrl = await promptText({
    message: "Base URL",
    placeholder: "https://openrouter.ai/api",
    validate: validateHttpUrl,
  });
  if (baseUrl === null) return null;

  const token = await promptPassword({
    message: "API key",
    validate: (value) => (value.trim().length === 0 ? "An API key is required" : undefined),
  });
  if (token === null) return null;

  return { provider, baseUrl, token };
};

const fetchModelsWithSpinner = async (
  baseUrl: string,
  token: string,
): Promise<ProviderModel[] | null> => {
  const loader = spinner();
  loader.start("Validating the key and fetching models");
  try {
    const models = await fetchModels(baseUrl, token);
    loader.stop(`Found ${theme.accent(String(models.length))} models`);
    return models;
  } catch (error) {
    loader.stop(theme.error("Could not fetch models"));
    cancel(error instanceof Error ? error.message : "Could not fetch models.");
    return null;
  }
};

const applyGlobalScope = async (profile: ExternalProfile): Promise<void> => {
  if (await isTrackedAndNotIgnored(GLOBAL_SETTINGS_PATH)) {
    const proceed = await promptConfirm({
      message: theme.warn(
        "~/.claude/settings.json is tracked in a git repo on this machine, so your API key could be committed. Continue? (Local scope keeps it gitignored.)",
      ),
      initialValue: false,
    });
    if (proceed !== true) {
      cancel("Aborted. Try Local scope to keep the key out of git.");
      return;
    }
  }
  await upsertProfile(profile, true);
  await applyExternalEnv(GLOBAL_SETTINGS_PATH, profile);
  outro(
    `${theme.success("✔")} Added ${theme.accent(pc.bold(profile.name))} ${pc.dim(`(${accountLabel(profile)})`)} and switched to it.`,
  );
};

const applyLocalScope = async (profile: ExternalProfile): Promise<void> => {
  const cwd = process.cwd();
  if (!(await protectLocalSecret(cwd))) {
    cancel("Aborted to keep your API key safe.");
    return;
  }
  await applyExternalEnv(localSettingsPath(cwd), profile);
  await upsertProfile(profile, false);
  outro(
    `${theme.success("✔")} Wrote ${theme.accent(".claude/settings.local.json")} for this project and saved profile ${theme.accent(profile.name)}.`,
  );
};

export const addExternalFlow = async (): Promise<void> => {
  const details = await promptProviderDetails();
  if (details === null) {
    cancel("Cancelled.");
    return;
  }

  const models = await fetchModelsWithSpinner(details.baseUrl, details.token);
  if (models === null) return;

  const model = await pickModel(models);
  if (model === null) {
    cancel("Cancelled.");
    return;
  }

  note(`${theme.accent(details.provider)}  ·  ${theme.active(model.id)}`, "Selected");

  const { profiles } = await listProfiles();
  const name = await promptProfileName(uniqueName(profiles, slugify(details.provider)));
  if (name === null) {
    cancel("Cancelled.");
    return;
  }

  const profile: ExternalProfile = {
    type: "external",
    name,
    provider: details.provider,
    baseUrl: normalizeBaseUrl(details.baseUrl),
    token: details.token,
    model: model.id,
    updatedAt: new Date().toISOString(),
  };

  const scope = await promptSelect({
    message: "Where should this account apply?",
    options: [
      { value: "global", label: theme.accent("Globally"), hint: "switchable from the yoink menu" },
      { value: "local", label: theme.accent("This project only"), hint: "writes ./.claude/settings.local.json here" },
    ],
  });
  if (scope === null) {
    cancel("Cancelled.");
    return;
  }

  if (scope === "global") await applyGlobalScope(profile);
  else await applyLocalScope(profile);
};
