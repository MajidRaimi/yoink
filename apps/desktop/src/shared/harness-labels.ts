import type { HarnessId } from "./types";

export const HARNESS_LABELS: Record<HarnessId, string> = {
  "claude-code": "Claude Code",
  pi: "pi",
  omp: "omp",
  opencode: "opencode",
  codex: "codex",
};

export const harnessLabel = (id: HarnessId): string => HARNESS_LABELS[id] ?? id;
