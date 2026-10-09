import type { HarnessData } from "@/shared/contract";

export const HARNESSES = [
  {
    id: "claude-code",
    label: "Claude Code",
    protocols: ["anthropic-messages"],
    exclusive: true,
    experimental: false,
  },
  {
    id: "pi",
    label: "pi",
    protocols: ["openai-chat", "openai-responses", "anthropic-messages"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "omp",
    label: "omp",
    protocols: ["openai-chat", "openai-responses", "anthropic-messages"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "opencode",
    label: "opencode",
    protocols: ["openai-chat", "anthropic-messages", "openai-responses"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "codex",
    label: "codex",
    protocols: ["openai-responses"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "qwen",
    label: "Qwen Code",
    protocols: ["openai-chat", "openai-responses", "anthropic-messages"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "kilo",
    label: "Kilo Code",
    protocols: ["openai-chat", "anthropic-messages", "openai-responses"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "droid",
    label: "Droid",
    protocols: ["anthropic-messages", "openai-responses", "openai-chat"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "crush",
    label: "Crush",
    protocols: ["openai-chat", "anthropic-messages"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "goose",
    label: "Goose",
    protocols: ["openai-chat", "anthropic-messages"],
    exclusive: false,
    experimental: true,
  },
  {
    id: "zed",
    label: "Zed",
    protocols: ["openai-chat", "openai-responses", "anthropic-messages"],
    exclusive: false,
    experimental: true,
  },
  {
    id: "continue",
    label: "Continue",
    protocols: ["openai-chat", "anthropic-messages"],
    exclusive: false,
    experimental: false,
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    protocols: ["anthropic-messages"],
    exclusive: false,
    experimental: true,
  },
] as const satisfies readonly HarnessData[];

export type Harness = (typeof HARNESSES)[number];

export type HarnessId = Harness["id"];

export type HarnessProtocol = Harness["protocols"][number];
