import { HARNESS_LABELS } from "@/shared/harness-labels";
import type { Endpoint, HarnessId, Protocol } from "@/shared/types";

export type HarnessInfo = {
  id: HarnessId;
  label: string;
  protocols: readonly Protocol[];
  exclusive: boolean;
};

export const HARNESSES: readonly HarnessInfo[] = [
  { id: "claude-code", label: HARNESS_LABELS["claude-code"], protocols: ["anthropic-messages"], exclusive: true },
  { id: "pi", label: HARNESS_LABELS["pi"], protocols: ["openai-chat", "openai-responses", "anthropic-messages"], exclusive: false },
  { id: "omp", label: HARNESS_LABELS["omp"], protocols: ["openai-chat", "openai-responses", "anthropic-messages"], exclusive: false },
  { id: "opencode", label: HARNESS_LABELS["opencode"], protocols: ["openai-chat", "anthropic-messages", "openai-responses"], exclusive: false },
  { id: "codex", label: HARNESS_LABELS["codex"], protocols: ["openai-responses"], exclusive: false },
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
