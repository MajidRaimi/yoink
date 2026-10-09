import { HARNESS_CONFIG_PATHS } from "@/features/demos/data/fixtures";
import { HARNESSES, type HarnessId } from "@/features/demos/data/harnesses.gen";
import { sourceProtocols, type ProviderSource } from "@/features/demos/provider-add/sources";

export type HarnessRow = {
  id: HarnessId;
  label: string;
  experimental: boolean;
  path: string;
  reason: string | null;
};

const WITHOUT_DEFAULT_MODEL: ReadonlySet<HarnessId> = new Set<HarnessId>(["droid"]);

const CODEX_REASON = "needs an OpenAI Responses endpoint";
const INCOMPATIBLE_REASON = "no compatible endpoint";

const unavailableReason = (id: HarnessId, compatible: boolean): string | null => {
  if (compatible) return null;
  return id === "codex" ? CODEX_REASON : INCOMPATIBLE_REASON;
};

export const harnessRows = (source: ProviderSource | null): readonly HarnessRow[] => {
  const protocols = source === null ? [] : sourceProtocols(source);
  return HARNESSES.map((harness) => {
    const supported: readonly string[] = harness.protocols;
    const compatible = protocols.some((protocol) => supported.includes(protocol));
    return {
      id: harness.id,
      label: harness.label,
      experimental: harness.experimental,
      path: HARNESS_CONFIG_PATHS[harness.id],
      reason: unavailableReason(harness.id, compatible),
    };
  });
};

export const harnessLabel = (id: HarnessId): string => HARNESSES.find((harness) => harness.id === id)?.label ?? id;

export const isEnabledRow = (row: HarnessRow): boolean => row.reason === null;

export const setsDefaultModel = (id: HarnessId): boolean => !WITHOUT_DEFAULT_MODEL.has(id);

export const harnessCount = (count: number): string => `${count} ${count === 1 ? "harness" : "harnesses"}`;
