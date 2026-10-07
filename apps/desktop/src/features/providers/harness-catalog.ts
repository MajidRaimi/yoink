import { HARNESS_LABELS } from "@/shared/harness-labels";
import type { Endpoint, HarnessId, Protocol } from "@/shared/types";

export type HarnessInfo = {
  id: HarnessId;
  label: string;
  protocols: readonly Protocol[];
  exclusive: boolean;
  experimental: boolean;
  setsDefaultModel: boolean;
};

const ALL_PROTOCOLS: readonly Protocol[] = ["openai-chat", "openai-responses", "anthropic-messages"];
const OPENCODE_PROTOCOLS: readonly Protocol[] = ["openai-chat", "anthropic-messages", "openai-responses"];
const CHAT_OR_MESSAGES: readonly Protocol[] = ["openai-chat", "anthropic-messages"];

type HarnessTraits = Partial<Pick<HarnessInfo, "exclusive" | "experimental" | "setsDefaultModel">>;

const harness = (id: HarnessId, protocols: readonly Protocol[], traits: HarnessTraits = {}): HarnessInfo => ({
  id,
  label: HARNESS_LABELS[id],
  protocols,
  exclusive: traits.exclusive ?? false,
  experimental: traits.experimental ?? false,
  setsDefaultModel: traits.setsDefaultModel ?? true,
});

export const HARNESSES: readonly HarnessInfo[] = [
  harness("claude-code", ["anthropic-messages"], { exclusive: true }),
  harness("pi", ALL_PROTOCOLS),
  harness("omp", ALL_PROTOCOLS),
  harness("opencode", OPENCODE_PROTOCOLS),
  harness("codex", ["openai-responses"]),
  harness("qwen", ALL_PROTOCOLS),
  harness("kilo", OPENCODE_PROTOCOLS),
  harness("droid", ["anthropic-messages", "openai-responses", "openai-chat"], { setsDefaultModel: false }),
  harness("crush", CHAT_OR_MESSAGES),
  harness("goose", CHAT_OR_MESSAGES, { experimental: true }),
  harness("zed", ALL_PROTOCOLS, { experimental: true }),
  harness("continue", CHAT_OR_MESSAGES),
  harness("claude-desktop", ["anthropic-messages"], { experimental: true }),
];

export const PROTOCOL_LABELS: Record<Protocol, string> = {
  "anthropic-messages": "Anthropic Messages",
  "openai-chat": "OpenAI Chat",
  "openai-responses": "OpenAI Responses",
};

export const PROTOCOL_SHORT_LABELS: Record<Protocol, string> = {
  "anthropic-messages": "messages",
  "openai-chat": "chat",
  "openai-responses": "responses",
};

export const harnessInfo = (id: HarnessId): HarnessInfo | undefined => HARNESSES.find((harness) => harness.id === id);

export const supportsHarness = (endpoints: readonly Endpoint[], harness: HarnessInfo): boolean =>
  endpoints.some((endpoint) => harness.protocols.includes(endpoint.protocol));

export const protocolRequirement = (id: HarnessId): string => {
  const protocols = harnessInfo(id)?.protocols ?? [];
  return `Needs ${protocols.map((protocol) => PROTOCOL_LABELS[protocol]).join(" or ")}`;
};
