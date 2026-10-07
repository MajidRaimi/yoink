import pc from "picocolors";
import { theme } from "../shared/theme";
import { formatOutcomes } from "../features/harnesses/outcomes";
import type { HarnessOutcome } from "../features/harnesses/sync";

export const renderOutcomes = (outcomes: readonly HarnessOutcome[], verb: string): void => {
  for (const line of formatOutcomes(outcomes, verb, { label: theme.accent })) {
    if (line.ok) console.log(`${theme.success("✔")} ${line.text}`);
    else console.error(`${theme.error("✖")} ${line.text}`);
    if (line.notice) console.log(`  ${pc.dim(line.notice)}`);
  }
};

export const renderFailedOutcomes = (outcomes: readonly HarnessOutcome[], verb: string): void => {
  for (const line of formatOutcomes(outcomes, verb)) {
    if (!line.ok) console.error(`${theme.warn("!")} ${line.text}`);
  }
};
