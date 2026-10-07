export type Protocol = "anthropic-messages" | "openai-chat" | "openai-responses";

export type HarnessId =
  | "claude-code"
  | "pi"
  | "omp"
  | "opencode"
  | "codex"
  | "qwen"
  | "kilo"
  | "droid"
  | "crush"
  | "goose"
  | "zed"
  | "continue"
  | "claude-desktop";

export type Endpoint = {
  protocol: Protocol;
  baseUrl: string;
};

export type ModelRef = {
  id: string;
  name: string;
};

export type ClaudeProfile = {
  type: "claude";
  name: string;
  email: string | null;
  updatedAt: string;
};

export type ExternalProfile = {
  type: "external";
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  updatedAt: string;
  endpoints: Endpoint[];
  models: ModelRef[];
  connections: HarnessId[];
  presetId: string | null;
};

export type Profile = ClaudeProfile | ExternalProfile;

export type Store = {
  current: string | null;
  profiles: Profile[];
};

export type ExternalInput = {
  name: string;
  provider: string;
  baseUrl: string;
  model: string;
  token?: string;
};

export type ProviderPreset = {
  id: string;
  label: string;
  endpoints: Endpoint[];
};

export type ProbeInput = {
  baseUrl: string | null;
  preset: string | null;
  token: string;
};

export type ProbeResult = {
  endpoints: Endpoint[];
  models: ModelRef[];
};

export type HarnessStatus = {
  id: HarnessId;
  label: string;
  installed: boolean;
  configPath: string;
  compatible: boolean;
  connected: boolean;
  parseError: string | null;
  exclusive: boolean;
  experimental: boolean;
  setsDefaultModel: boolean;
  notice: string | null;
  defaultModel: string | null;
};

export type AddProviderInput = {
  name: string;
  displayName: string | null;
  preset: string | null;
  baseUrl: string | null;
  protocols: Protocol[];
  endpoints: Endpoint[];
  models: string[];
  connect: HarnessId[];
  defaultModel: string | null;
  token: string;
};

export type Settings = {
  hotkey: string;
  autostart: boolean;
};
