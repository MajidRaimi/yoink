import type { HarnessId } from "../profiles/types";
import { claudeCodeAdapter } from "./adapters/claude-code";
import { claudeDesktopAdapter } from "./adapters/claude-desktop";
import { codexAdapter } from "./adapters/codex";
import { continueAdapter } from "./adapters/continue";
import { crushAdapter } from "./adapters/crush";
import { droidAdapter } from "./adapters/droid";
import { gooseAdapter } from "./adapters/goose";
import { kiloAdapter } from "./adapters/kilo";
import { ompAdapter } from "./adapters/omp";
import { opencodeAdapter } from "./adapters/opencode";
import { piAdapter } from "./adapters/pi";
import { qwenAdapter } from "./adapters/qwen";
import { zedAdapter } from "./adapters/zed";
import type { HarnessAdapter } from "./types";

export const HARNESS_ADAPTERS: readonly HarnessAdapter[] = [
  claudeCodeAdapter,
  piAdapter,
  ompAdapter,
  opencodeAdapter,
  codexAdapter,
  qwenAdapter,
  kiloAdapter,
  droidAdapter,
  crushAdapter,
  gooseAdapter,
  zedAdapter,
  continueAdapter,
  claudeDesktopAdapter,
];

export const findAdapter = (id: HarnessId): HarnessAdapter | undefined =>
  HARNESS_ADAPTERS.find((adapter) => adapter.id === id);
