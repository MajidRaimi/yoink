import type { HarnessId } from "../profiles/types";
import { claudeCodeAdapter } from "./adapters/claude-code";
import { codexAdapter } from "./adapters/codex";
import { ompAdapter } from "./adapters/omp";
import { opencodeAdapter } from "./adapters/opencode";
import { piAdapter } from "./adapters/pi";
import type { HarnessAdapter } from "./types";

export const HARNESS_ADAPTERS: readonly HarnessAdapter[] = [
  claudeCodeAdapter,
  piAdapter,
  ompAdapter,
  opencodeAdapter,
  codexAdapter,
];

export const findAdapter = (id: HarnessId): HarnessAdapter | undefined =>
  HARNESS_ADAPTERS.find((adapter) => adapter.id === id);
