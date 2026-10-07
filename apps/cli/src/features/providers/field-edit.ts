import { applyExternalEnv, GLOBAL_SETTINGS_PATH } from "../../shared/claude-settings";
import { YoinkError } from "../../shared/errors";
import { nowIso } from "../../shared/time";
import { validateProviderId } from "../../shared/validators";
import { resyncProvider, type HarnessOutcome } from "../harnesses/sync";
import { listProfiles, updateProfile } from "../profiles/service";
import { applyLegacyEdits, syncLegacyFields, toProviderProfile } from "../profiles/store";
import type { ProviderProfile } from "../profiles/types";

export type ProviderFieldEdit = {
  name?: string;
  displayName?: string;
  token?: string;
  baseUrl?: string;
  model?: string;
};

export type ProviderEditResult = {
  provider: ProviderProfile;
  outcomes: HarnessOutcome[];
};

const loadEditableProvider = async (name: string): Promise<ProviderProfile> => {
  const { profiles } = await listProfiles();
  const profile = profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new YoinkError(`No profile named "${name}".`);
  if (profile.type !== "external") {
    throw new YoinkError(`"${name}" is a Claude profile. Flag edits only apply to external profiles.`);
  }
  return toProviderProfile(profile);
};

const assertValidRename = (currentName: string, nextName: string | undefined): void => {
  if (nextName === undefined || nextName === currentName) return;
  const error = validateProviderId(nextName);
  if (error) throw new YoinkError(`Invalid provider name "${nextName}": ${error}.`);
};

const withoutClaudeCode = (provider: ProviderProfile): ProviderProfile => {
  const { "claude-code": _claudeCode, ...others } = provider.connections;
  return { ...provider, connections: others };
};

export const applyProviderFieldEdit = (
  current: ProviderProfile,
  edit: ProviderFieldEdit,
  updatedAt: string,
): ProviderProfile =>
  syncLegacyFields(
    applyLegacyEdits(
      {
        ...current,
        name: edit.name ?? current.name,
        provider: edit.displayName ?? current.provider,
        token: edit.token ?? current.token,
        updatedAt,
      },
      { baseUrl: edit.baseUrl, model: edit.model },
    ),
  );

export const reapplyClaudeEnv = async (provider: ProviderProfile): Promise<boolean> => {
  const { current } = await listProfiles();
  if (current !== provider.name) return false;
  await applyExternalEnv(GLOBAL_SETTINGS_PATH, { baseUrl: provider.baseUrl, token: provider.token, model: provider.model });
  return true;
};

export const editProviderFields = async (name: string, edit: ProviderFieldEdit): Promise<ProviderEditResult> => {
  const current = await loadEditableProvider(name);
  assertValidRename(name, edit.name);
  const next = applyProviderFieldEdit(current, edit, nowIso());
  await updateProfile(name, next);
  await reapplyClaudeEnv(next);
  return { provider: next, outcomes: await resyncProvider(withoutClaudeCode(next), name) };
};
