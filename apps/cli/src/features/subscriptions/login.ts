import { runInteractiveCommand } from "../../shared/interactive-command";
import type { SubscriptionBackend } from "./types";

export const runSubscriptionLogin = async (backend: SubscriptionBackend): Promise<void> => {
  const argv = backend.loginCommand();
  await runInteractiveCommand(argv, {
    notFound: `${backend.label} CLI not found on PATH. Install it first.`,
    failed: `\`${argv.join(" ")}\` did not complete successfully.`,
  });
};
