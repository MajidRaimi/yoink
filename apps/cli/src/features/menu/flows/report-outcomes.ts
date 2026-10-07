import { log } from "@clack/prompts";
import { theme } from "../../../shared/theme";
import { formatOutcomes } from "../../harnesses/outcomes";
import type { HarnessOutcome } from "../../harnesses/sync";

export const reportOutcomes = (outcomes: HarnessOutcome[], verb: string): void => {
  for (const line of formatOutcomes(outcomes, verb, { label: theme.accent })) {
    if (line.ok) log.success(line.text);
    else log.error(line.text);
    if (line.notice) log.info(line.notice);
  }
};
