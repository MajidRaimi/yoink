import { theme } from "../shared/theme";
import { formatOutcomes } from "../features/harnesses/outcomes";
import type { HarnessOutcome } from "../features/harnesses/sync";

export const renderOutcomes = (outcomes: readonly HarnessOutcome[], verb: string): void => {
  for (const line of formatOutcomes(outcomes, verb, { label: theme.accent })) {
    if (line.ok) console.log(`${theme.success("✔")} ${line.text}`);
    else console.error(`${theme.error("✖")} ${line.text}`);
  }
};

export const renderFailedOutcomes = (outcomes: readonly HarnessOutcome[], verb: string): void => {
  for (const line of formatOutcomes(outcomes, verb)) {
    if (!line.ok) console.error(`${theme.warn("!")} ${line.text}`);
  }
};
