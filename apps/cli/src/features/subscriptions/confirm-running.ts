import { promptConfirm } from "../../shared/prompt";
import type { SubscriptionBackend } from "./types";

export type ConfirmRunning = (backend: SubscriptionBackend) => Promise<boolean>;

export const confirmRunningInteractively: ConfirmRunning = async (backend) => {
  if (!process.stdout.isTTY || !process.stdin.isTTY) return false;
  const answer = await promptConfirm({
    message: `${backend.label} is running. It may overwrite the login on its next refresh. Switch anyway?`,
    initialValue: false,
  });
  return answer === true;
};
