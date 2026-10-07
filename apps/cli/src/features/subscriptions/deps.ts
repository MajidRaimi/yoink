import { homedir } from "node:os";
import { createKeyring } from "./shared/keyring";
import { listProcesses } from "../../shared/processes/process-detection";
import type { SubscriptionBackendDeps } from "./types";

export const createDefaultBackendDeps = (): SubscriptionBackendDeps => ({
  homeDir: homedir(),
  env: process.env,
  platform: process.platform,
  keyring: createKeyring(process.platform),
  listProcesses,
});
