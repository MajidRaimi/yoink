import type { ProcessLister, ProcessMatcher } from "../../shared/processes/types";
import type { SubscriptionIdentity, SubscriptionSnapshot, SubscriptionTool } from "../profiles/types";

export type KeyringAdapter = {
  read: (service: string, account: string) => Promise<string | null>;
  write: (service: string, account: string, secret: string) => Promise<void>;
  remove: (service: string, account: string) => Promise<void>;
};

export type SubscriptionEnv = Readonly<Record<string, string | undefined>>;

export type SubscriptionBackendDeps = {
  homeDir: string;
  env: SubscriptionEnv;
  platform: NodeJS.Platform;
  keyring: KeyringAdapter;
  listProcesses: ProcessLister;
};

export type SubscriptionCapture = {
  snapshot: SubscriptionSnapshot;
  identity: SubscriptionIdentity;
};

export type SubscriptionBackend = {
  tool: SubscriptionTool;
  label: string;
  home: () => string;
  detect: () => Promise<boolean>;
  capture: () => Promise<SubscriptionCapture | null>;
  restore: (snapshot: SubscriptionSnapshot) => Promise<void>;
  prepareLogin: () => Promise<void>;
  restoreAfterFailedLogin?: () => Promise<boolean>;
  finishLogin?: () => Promise<void>;
  loginCommand: () => string[];
  processMatcher: ProcessMatcher;
  postSwitchNotice?: () => string | null;
};
