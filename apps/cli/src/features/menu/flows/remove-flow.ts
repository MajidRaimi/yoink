import { outro } from "@clack/prompts";
import { theme } from "../../../shared/theme";
import { promptConfirm } from "../../../shared/prompt";
import { listProfiles } from "../../profiles/service";
import { deleteProfile } from "../../providers/removal";
import { countFailures } from "../../harnesses/outcomes";
import { reportOutcomes } from "./report-outcomes";

const CLAUDE_REMOVAL_NOTE = "This removes the saved snapshot only, not your live Claude login.";
const PROVIDER_REMOVAL_NOTE = "This also removes it from every connected harness.";

const removalNote = async (name: string): Promise<string> => {
  const { profiles } = await listProfiles();
  const profile = profiles.find((candidate) => candidate.name === name);
  return profile?.type === "external" ? PROVIDER_REMOVAL_NOTE : CLAUDE_REMOVAL_NOTE;
};

export const confirmAndRemove = async (name: string): Promise<void> => {
  const confirmed = await promptConfirm({
    message: `Delete profile "${name}"? ${await removalNote(name)}`,
    initialValue: false,
  });
  if (confirmed !== true) {
    outro("Kept.");
    return;
  }
  const outcomes = await deleteProfile(name);
  reportOutcomes(outcomes, "Disconnected");
  if (countFailures(outcomes) > 0) {
    outro(`${theme.warn("!")} Kept ${theme.accent(name)} until every harness disconnects.`);
    return;
  }
  outro(`${theme.success("✔")} Removed ${theme.accent(name)}`);
};
