import { cancel, outro } from "@clack/prompts";
import { errorMessage } from "../../../shared/errors";
import { theme } from "../../../shared/theme";
import { assertNever } from "../../../shared/assert-never";
import { listProfiles, updateProfile } from "../../profiles/service";
import type { ClaudeProfile, SubscriptionProfile } from "../../profiles/types";
import { editExternalProfile } from "./edit-external-flow";
import { promptProfileName } from "./prompt-name";

const renameAccountProfile = async (profile: ClaudeProfile | SubscriptionProfile): Promise<void> => {
  const newName = await promptProfileName(profile.name);
  if (newName === null) {
    cancel("Cancelled.");
    return;
  }
  if (newName === profile.name) {
    outro("No changes.");
    return;
  }
  try {
    await updateProfile(profile.name, { ...profile, name: newName });
  } catch (error) {
    cancel(errorMessage(error, "Could not rename."));
    return;
  }
  outro(`${theme.success("✔")} Renamed to ${theme.accent(newName)}`);
};

export const editProfileFlow = async (name: string): Promise<void> => {
  const { profiles } = await listProfiles();
  const profile = profiles.find((candidate) => candidate.name === name);
  if (!profile) {
    cancel(`No profile named "${name}".`);
    return;
  }

  switch (profile.type) {
    case "external":
      await editExternalProfile(profile);
      return;
    case "claude":
    case "codex":
    case "kimi":
    case "gemini":
    case "copilot":
      await renameAccountProfile(profile);
      return;
    default:
      assertNever(profile);
  }
};
