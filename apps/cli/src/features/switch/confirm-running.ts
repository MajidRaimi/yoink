import { theme } from "../../shared/theme";
import { promptConfirm } from "../../shared/prompt";
import { isClaudeRunning } from "./running-session";

export const confirmIfClaudeRunning = async (): Promise<boolean> => {
  if (!(await isClaudeRunning())) return true;
  if (!process.stdout.isTTY) {
    console.error(theme.warn("! Claude Code is running; switching anyway (non-interactive)."));
    return true;
  }
  const answer = await promptConfirm({
    message: "Claude Code is running. It may overwrite the token on its next refresh. Switch anyway?",
    initialValue: false,
  });
  return answer === true;
};
