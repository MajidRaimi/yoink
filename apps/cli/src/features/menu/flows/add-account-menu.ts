import { cancel } from "@clack/prompts";
import { theme } from "../../../shared/theme";
import { promptSelect } from "../../../shared/prompt";
import { PROFILE_GROUP_TITLES } from "../../profiles/format";
import { isSubscriptionTool } from "../../profiles/subscription-profile";
import type { SubscriptionTool } from "../../profiles/types";
import { addAccountFlow } from "./add-claude-flow";
import { addProviderFlow } from "./add-provider-flow";
import { addSubscriptionFlow } from "./add-subscription-flow";

type AccountKind = "claude" | "external" | SubscriptionTool;

const SUBSCRIPTION_HINTS: Readonly<Record<SubscriptionTool, string>> = {
  codex: "sign in with ChatGPT, switches the Codex CLI",
  kimi: "sign in to Kimi Code, switches the Kimi CLI",
  gemini: "sign in with Google, switches the Gemini CLI",
  copilot: "sign in with GitHub, switches the Copilot CLI",
};

const subscriptionOption = (tool: SubscriptionTool): { value: AccountKind; label: string; hint: string } => ({
  value: tool,
  label: theme.accent(PROFILE_GROUP_TITLES[tool]),
  hint: SUBSCRIPTION_HINTS[tool],
});

export const addAccountMenu = async (): Promise<void> => {
  const kind = await promptSelect<AccountKind>({
    message: "What kind of account?",
    options: [
      { value: "claude", label: theme.accent("Claude Code account"), hint: "sign in with your Claude subscription" },
      { value: "external", label: theme.accent("Provider (API key)"), hint: "OpenAI, Kimi, OpenRouter or any compatible API, for any harness" },
      subscriptionOption("codex"),
      subscriptionOption("kimi"),
      subscriptionOption("gemini"),
      subscriptionOption("copilot"),
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
  if (isSubscriptionTool(kind)) {
    await addSubscriptionFlow(kind);
    return;
  }
  await addProviderFlow();
};
