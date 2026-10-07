import { cancel } from "@clack/prompts";
import { theme } from "../../../shared/theme";
import { promptSelect } from "../../../shared/prompt";
import { addAccountFlow } from "./add-claude-flow";
import { addProviderFlow } from "./add-provider-flow";

export const addAccountMenu = async (): Promise<void> => {
  const kind = await promptSelect({
    message: "What kind of account?",
    options: [
      { value: "claude", label: theme.accent("Claude Code account"), hint: "sign in with your Claude subscription" },
      { value: "external", label: theme.accent("Provider (API key)"), hint: "OpenAI, Kimi, OpenRouter or any compatible API, for any harness" },
    ],
  });
  if (kind === null) {
    cancel("Cancelled.");
    return;
  }
  if (kind === "claude") {
    await addAccountFlow();
    return;
  }
  await addProviderFlow();
};
