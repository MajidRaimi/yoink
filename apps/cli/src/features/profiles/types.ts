import type { OauthAccount } from "../../shared/claude-config";

export const PROTOCOLS = ["anthropic-messages", "openai-chat", "openai-responses"] as const;
export type Protocol = (typeof PROTOCOLS)[number];

export const HARNESS_IDS = ["claude-code", "pi", "omp", "opencode", "codex"] as const;
export type HarnessId = (typeof HARNESS_IDS)[number];

export type Endpoint = {
  protocol: Protocol;
  baseUrl: string;
};

export type ModelInput = "text" | "image";

export type ModelSpec = {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  reasoning: boolean;
  input: ModelInput[];
};

export type Connection = {
  connectedAt: string;
  defaultModel?: string;
};

export type Connections = Partial<Record<HarnessId, Connection>>;

export type ClaudeProfile = {
  type: "claude";
  name: string;
  keychain: string;
  account: OauthAccount | null;
  updatedAt: string;
};

export type ExternalProfile = {
  type: "external";
  name: string;
  provider: string;
  baseUrl: string;
  token: string;
  model: string;
  updatedAt: string;
  presetId?: string;
  endpoints?: Endpoint[];
  models?: ModelSpec[];
  connections?: Connections;
};

export type ProviderProfile = ExternalProfile & {
  endpoints: Endpoint[];
  models: ModelSpec[];
  connections: Connections;
};

export type Profile = ClaudeProfile | ExternalProfile;

export const STORE_SCHEMA_VERSION = 2;

export type ProfileStore = {
  schemaVersion?: number;
  current: string | null;
  importOffered?: boolean;
  profiles: Record<string, Profile>;
};
