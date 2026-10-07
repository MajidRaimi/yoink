import type { Endpoint, HarnessId, ModelSpec, Protocol, ProviderProfile } from "../profiles/types";

export type HarnessDetection = {
  installed: boolean;
  configPath: string;
};

export type ImportedProvider = {
  source: HarnessId;
  id: string;
  displayName: string;
  token: string | null;
  endpoints: Endpoint[];
  models: ModelSpec[];
};

export type ConnectOptions = {
  defaultModel?: string;
};

export type HarnessAdapter = {
  id: HarnessId;
  label: string;
  protocols: readonly Protocol[];
  exclusive: boolean;
  detect: () => Promise<HarnessDetection>;
  readProviders: () => Promise<ImportedProvider[]>;
  isConnected: (providerId: string) => Promise<boolean>;
  readDefaultModel: (providerId: string) => Promise<string | null>;
  connect: (provider: ProviderProfile, options: ConnectOptions) => Promise<void>;
  disconnect: (providerId: string) => Promise<void>;
};
