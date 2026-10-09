import type { HarnessId } from "./harnesses.gen";
import type { Protocol, ProviderPresetId } from "./presets.gen";
import type { SubscriptionTool } from "./subscriptions.gen";

export type ClaudeProfileFixture = {
  name: string;
  email: string;
  organization: string | null;
  plan: "pro" | "max" | "team";
};

export type ProviderProfileFixture = {
  name: string;
  label: string;
  presetId: ProviderPresetId | null;
  protocol: Protocol;
  baseUrl: string;
  maskedKey: string;
  models: readonly string[];
  defaultModel: string;
};

export type SubscriptionLoginFixture = {
  tool: SubscriptionTool;
  name: string;
  label: string;
  email: string | null;
  plan: string | null;
};

export type PresetModelsFixture = {
  maskedKey: string;
  models: readonly string[];
};

export const CLAUDE_PROFILES: readonly ClaudeProfileFixture[] = [
  { name: "work", email: "sara.haddad@lumenlabs.example", organization: "Lumen Labs", plan: "team" },
  { name: "personal", email: "sara@haddad.example", organization: null, plan: "max" },
  { name: "side", email: "builds@quietharbor.example", organization: "Quiet Harbor", plan: "pro" },
];

export const ACTIVE_CLAUDE_PROFILE = "work";

export const FUSE_PROVIDER: ProviderProfileFixture = {
  name: "fuse",
  label: "Fuse",
  presetId: null,
  protocol: "openai-chat",
  baseUrl: "https://api.fuse.example/v1",
  maskedKey: "sk-fuse-••••7c21",
  models: [
    "moonshotai/Kimi-K3",
    "zai-org/GLM-5.2",
    "deepseek-ai/DeepSeek-V4.1-Flash",
    "MiniMaxAI/MiniMax-M3",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ],
  defaultModel: "moonshotai/Kimi-K3",
};

export const PROVIDER_PROFILES: readonly ProviderProfileFixture[] = [
  FUSE_PROVIDER,
  {
    name: "openrouter",
    label: "OpenRouter",
    presetId: "openrouter",
    protocol: "anthropic-messages",
    baseUrl: "https://openrouter.ai/api",
    maskedKey: "sk-or-v1-••••3f9a",
    models: ["moonshotai/kimi-k3", "z-ai/glm-5.2", "deepseek/deepseek-v4.1"],
    defaultModel: "z-ai/glm-5.2",
  },
];

export const SUBSCRIPTION_LOGINS: readonly SubscriptionLoginFixture[] = [
  { tool: "codex", name: "work", label: "sara.haddad@lumenlabs.example", email: "sara.haddad@lumenlabs.example", plan: "team" },
  { tool: "codex", name: "personal", label: "sara@haddad.example", email: "sara@haddad.example", plan: "plus" },
  { tool: "kimi", name: "kimi", label: "kimi:d41c9e07", email: null, plan: "global" },
];

export const ACTIVE_SUBSCRIPTIONS: Readonly<Partial<Record<SubscriptionTool, string>>> = {
  codex: "work",
  kimi: "kimi",
};

export const PRESET_MODELS: Readonly<Record<ProviderPresetId, PresetModelsFixture>> = {
  openai: {
    maskedKey: "sk-proj-••••a81e",
    models: ["gpt-5.2", "gpt-5.2-mini", "gpt-5.1-codex", "o4-mini"],
  },
  "kimi-code": {
    maskedKey: "sk-kimi-••••0b6d",
    models: ["kimi-for-coding"],
  },
  moonshot: {
    maskedKey: "sk-••••92fc",
    models: ["kimi-k3", "kimi-k2.5", "kimi-k2-thinking"],
  },
  openrouter: {
    maskedKey: "sk-or-v1-••••3f9a",
    models: ["moonshotai/kimi-k3", "z-ai/glm-5.2", "deepseek/deepseek-v4.1", "minimax/minimax-m3", "openai/gpt-oss-120b"],
  },
  deepseek: {
    maskedKey: "sk-••••5d07",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  zai: {
    maskedKey: "••••e4a2.Qx",
    models: ["glm-5.2", "glm-5.2-air", "glm-4.6"],
  },
  ollama: {
    maskedKey: "ollama",
    models: ["qwen3-coder:30b", "gpt-oss:20b", "devstral:24b"],
  },
};

export const CLAUDE_MANAGED_ENV_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
] as const;

export type ClaudeManagedEnvKey = (typeof CLAUDE_MANAGED_ENV_KEYS)[number];

export const CLAUDE_SETTINGS_PATH = "~/.claude/settings.json";

export const HARNESS_CONFIG_PATHS: Readonly<Record<HarnessId, string>> = {
  "claude-code": "~/.claude/settings.json",
  pi: "~/.pi/agent/models.json",
  omp: "~/.omp/agent/models.yml",
  opencode: "~/.config/opencode/opencode.json",
  codex: "~/.codex/config.toml",
  qwen: "~/.qwen/settings.json",
  kilo: "~/.config/kilo/kilo.json",
  droid: "~/.factory/settings.json",
  crush: "~/.config/crush/crush.json",
  goose: "~/.config/goose/config.yaml",
  zed: "~/.config/zed/settings.json",
  continue: "~/.continue/config.yaml",
  "claude-desktop": "~/Library/Application Support/Claude-3p/configLibrary",
};
