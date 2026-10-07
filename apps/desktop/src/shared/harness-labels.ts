import type { HarnessId } from "./types";

export const HARNESS_LABELS: Record<HarnessId, string> = {
  "claude-code": "Claude Code",
  pi: "pi",
  omp: "omp",
  opencode: "opencode",
  codex: "codex",
  qwen: "Qwen Code",
  kilo: "Kilo Code",
  droid: "Droid",
  crush: "Crush",
  goose: "Goose",
  zed: "Zed",
  continue: "Continue",
  "claude-desktop": "Claude Desktop",
};

export const harnessLabel = (id: HarnessId): string => HARNESS_LABELS[id] ?? id;
