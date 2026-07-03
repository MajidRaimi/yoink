import { outro } from "@clack/prompts";
import { theme } from "../../../shared/theme";
import { promptConfirm } from "../../../shared/prompt";
import { removeProfile } from "../../profiles/service";

export const confirmAndRemove = async (name: string): Promise<void> => {
  const confirmed = await promptConfirm({
    message: `Delete profile "${name}"? This removes the saved snapshot only, not your live Claude login.`,
    initialValue: false,
  });
  if (confirmed !== true) {
    outro("Kept.");
    return;
  }
  await removeProfile(name);
  outro(`${theme.success("✔")} Removed ${theme.accent(name)}`);
};
