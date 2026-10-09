export const SUBSCRIPTIONS = [
  {
    tool: "codex",
    label: "ChatGPT (Codex)",
  },
  {
    tool: "kimi",
    label: "Kimi Code",
  },
  {
    tool: "gemini",
    label: "Gemini",
  },
  {
    tool: "copilot",
    label: "GitHub Copilot",
  },
] as const;

export type Subscription = (typeof SUBSCRIPTIONS)[number];

export type SubscriptionTool = Subscription["tool"];
