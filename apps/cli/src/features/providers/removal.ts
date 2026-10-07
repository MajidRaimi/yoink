import { YoinkError } from "../../shared/errors";
import type { HarnessOutcome } from "../harnesses/sync";
import { listProfiles, removeProfile } from "../profiles/service";
import { removeProvider } from "./service";

export const deleteProfile = async (name: string): Promise<HarnessOutcome[]> => {
  const { profiles } = await listProfiles();
  const profile = profiles.find((candidate) => candidate.name === name);
  if (!profile) throw new YoinkError(`No profile named "${name}".`);
  if (profile.type === "external") return removeProvider(name);
  await removeProfile(name);
  return [];
};
