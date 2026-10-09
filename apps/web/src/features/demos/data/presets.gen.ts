import type { PresetData } from "@/shared/contract";

export const PROVIDER_PRESETS = [
  {
    id: "openai",
    label: "OpenAI",
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
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "kimi-code",
    label: "Kimi Code",
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
    keyUrl: "https://www.kimi.com/code",
  },
  {
    id: "moonshot",
    label: "Moonshot AI",
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
    keyUrl: "https://platform.moonshot.ai/console/api-keys",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
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
    keyUrl: "https://openrouter.ai/settings/keys",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
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
    keyUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "zai",
    label: "Z.ai",
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
    keyUrl: "https://z.ai/manage-apikey/apikey-list",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    endpoints: [
      {
        protocol: "openai-chat",
        baseUrl: "http://localhost:11434/v1",
      },
    ],
    keyUrl: null,
  },
] as const satisfies readonly PresetData[];

export type ProviderPreset = (typeof PROVIDER_PRESETS)[number];

export type ProviderPresetId = ProviderPreset["id"];

export type PresetEndpoint = ProviderPreset["endpoints"][number];

export type Protocol = PresetEndpoint["protocol"];
