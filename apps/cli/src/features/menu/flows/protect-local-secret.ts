import { theme } from "../../../shared/theme";
import { promptConfirm } from "../../../shared/prompt";
import { appendSettingsIgnore, isSettingsIgnored } from "../../../shared/gitignore";

export const protectLocalSecret = async (cwd: string): Promise<boolean> => {
  if (await isSettingsIgnored(cwd)) return true;
  const add = await promptConfirm({
    message: "Add .claude/settings.local.json to .gitignore so your API key isn't committed?",
    initialValue: true,
  });
  if (add === null) return false;
  if (add) {
    await appendSettingsIgnore(cwd);
    return true;
  }
  const proceed = await promptConfirm({
    message: theme.warn("Your API key will sit unignored in .claude/settings.local.json. Continue anyway?"),
    initialValue: false,
  });
  return proceed === true;
};
