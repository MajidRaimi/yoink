import { spinner } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { claudeSaveConflict, listProfiles, saveProfile } from "../../profiles/service";
import { accountLabel } from "../../profiles/format";
import type { Profile } from "../../profiles/types";
import { promptProfileName } from "./prompt-name";

export const saveCurrentLogin = async (defaultName: string): Promise<Profile | null> => {
  const { profiles } = await listProfiles();
  const name = await promptProfileName(defaultName, (value) => claudeSaveConflict(profiles, value));
  if (name === null) return null;
  const loader = spinner();
  loader.start("Saving current login");
  const profile = await saveProfile(name);
  loader.stop(`Saved ${theme.accent(profile.name)} ${pc.dim(`(${accountLabel(profile)})`)}`);
  return profile;
};
