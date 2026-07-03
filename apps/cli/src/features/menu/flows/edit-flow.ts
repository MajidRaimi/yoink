import { cancel, outro } from "@clack/prompts";
import { theme } from "../../../shared/theme";
import { assertNever } from "../../../shared/assert-never";
import { listProfiles, updateProfile } from "../../profiles/service";
import type { ClaudeProfile } from "../../profiles/types";
import { editExternalProfile } from "./edit-external-flow";
import { promptProfileName } from "./prompt-name";

const editClaudeProfile = async (profile: ClaudeProfile): Promise<void> => {
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
    cancel(error instanceof Error ? error.message : "Could not rename.");
    return;
  }
  outro(`${theme.success("✔")} Renamed to ${theme.accent(newName)}`);
};

export const editProfileFlow = async (name: string): Promise<void> => {
  const { current, profiles } = await listProfiles();
  const profile = profiles.find((candidate) => candidate.name === name);
  if (!profile) {
    cancel(`No profile named "${name}".`);
    return;
  }

  switch (profile.type) {
    case "external":
      await editExternalProfile(profile, current === profile.name);
      return;
    case "claude":
      await editClaudeProfile(profile);
      return;
    default:
      assertNever(profile);
  }
};
