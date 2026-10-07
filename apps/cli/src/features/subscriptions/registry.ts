import { YoinkError } from "../../shared/errors";
import type { SubscriptionTool } from "../profiles/types";
import { codexBackend } from "./backends/codex";
import { copilotBackend } from "./backends/copilot";
import { geminiBackend } from "./backends/gemini";
import { kimiBackend } from "./backends/kimi";
import type { SubscriptionBackend } from "./types";

export const SUBSCRIPTION_BACKENDS: readonly SubscriptionBackend[] = [codexBackend, kimiBackend, geminiBackend, copilotBackend];

export const findBackend = (
  tool: SubscriptionTool,
  backends: readonly SubscriptionBackend[] = SUBSCRIPTION_BACKENDS,
): SubscriptionBackend | undefined => backends.find((backend) => backend.tool === tool);

export const unsupportedToolMessage = (tool: SubscriptionTool): string => `yoink does not support ${tool} logins yet.`;

export const requireBackend = (
  tool: SubscriptionTool,
  backends: readonly SubscriptionBackend[] = SUBSCRIPTION_BACKENDS,
): SubscriptionBackend => {
  const backend = findBackend(tool, backends);
  if (!backend) throw new YoinkError(unsupportedToolMessage(tool));
  return backend;
};
