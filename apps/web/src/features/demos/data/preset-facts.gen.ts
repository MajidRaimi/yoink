import type { PresetFactsData } from "@/features/docs/facts/types";

export const PRESET_FACTS = [
  {
    id: "openai",
    label: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    endpoints: [
      {
        protocol: "openai-responses",
        baseUrl: "https://api.openai.com/v1",
      },
      {
        protocol: "openai-chat",
        baseUrl: "https://api.openai.com/v1",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: null,
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: "openai-responses",
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "openai-responses",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: null,
      },
    ],
  },
  {
    id: "kimi-code",
    label: "Kimi Code",
    keyUrl: "https://www.kimi.com/code",
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "https://api.kimi.com/coding/v1",
      },
      {
        protocol: "anthropic-messages",
        baseUrl: "https://api.kimi.com/coding",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: "anthropic-messages",
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: null,
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "anthropic-messages",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: "anthropic-messages",
      },
    ],
  },
  {
    id: "moonshot",
    label: "Moonshot AI",
    keyUrl: "https://platform.moonshot.ai/console/api-keys",
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "https://api.moonshot.ai/v1",
      },
      {
        protocol: "anthropic-messages",
        baseUrl: "https://api.moonshot.ai/anthropic",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: "anthropic-messages",
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: null,
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "anthropic-messages",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: "anthropic-messages",
      },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyUrl: "https://openrouter.ai/settings/keys",
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "https://openrouter.ai/api/v1",
      },
      {
        protocol: "anthropic-messages",
        baseUrl: "https://openrouter.ai/api",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: "anthropic-messages",
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: null,
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "anthropic-messages",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: "anthropic-messages",
      },
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keyUrl: "https://platform.deepseek.com/api_keys",
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "https://api.deepseek.com/v1",
      },
      {
        protocol: "anthropic-messages",
        baseUrl: "https://api.deepseek.com/anthropic",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: "anthropic-messages",
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: null,
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "anthropic-messages",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: "anthropic-messages",
      },
    ],
  },
  {
    id: "zai",
    label: "Z.ai",
    keyUrl: "https://z.ai/manage-apikey/apikey-list",
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "https://api.z.ai/api/paas/v4",
      },
      {
        protocol: "anthropic-messages",
        baseUrl: "https://api.z.ai/api/anthropic",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: "anthropic-messages",
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: null,
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "anthropic-messages",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: "anthropic-messages",
      },
    ],
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    keyUrl: null,
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "http://localhost:11434/v1",
      },
    ],
    reach: [
      {
        harness: "claude-code",
        protocol: null,
      },
      {
        harness: "pi",
        protocol: "openai-chat",
      },
      {
        harness: "omp",
        protocol: "openai-chat",
      },
      {
        harness: "opencode",
        protocol: "openai-chat",
      },
      {
        harness: "codex",
        protocol: null,
      },
      {
        harness: "qwen",
        protocol: "openai-chat",
      },
      {
        harness: "kilo",
        protocol: "openai-chat",
      },
      {
        harness: "droid",
        protocol: "openai-chat",
      },
      {
        harness: "crush",
        protocol: "openai-chat",
      },
      {
        harness: "goose",
        protocol: "openai-chat",
      },
      {
        harness: "zed",
        protocol: "openai-chat",
      },
      {
        harness: "continue",
        protocol: "openai-chat",
      },
      {
        harness: "claude-desktop",
        protocol: null,
      },
    ],
  },
] as const satisfies readonly PresetFactsData[];

export type PresetFactsId = (typeof PRESET_FACTS)[number]["id"];
