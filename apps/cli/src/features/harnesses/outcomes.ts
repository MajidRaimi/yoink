import type { HarnessId } from "../profiles/types";
import { findAdapter } from "./registry";
import type { HarnessOutcome } from "./sync";

export type FormattedOutcome = { ok: boolean; text: string };

export type OutcomeStyle = { label: (label: string) => string };

const plainStyle: OutcomeStyle = { label: (label) => label };

export const harnessLabel = (id: HarnessId): string => findAdapter(id)?.label ?? id;

export const formatOutcome = (outcome: HarnessOutcome, verb: string, style: OutcomeStyle = plainStyle): FormattedOutcome =>
  outcome.ok
    ? { ok: true, text: `${verb} ${style.label(harnessLabel(outcome.id))}` }
    : { ok: false, text: `${harnessLabel(outcome.id)}: ${outcome.message}` };

export const formatOutcomes = (
  outcomes: readonly HarnessOutcome[],
  verb: string,
  style: OutcomeStyle = plainStyle,
): FormattedOutcome[] => outcomes.map((outcome) => formatOutcome(outcome, verb, style));

export const countFailures = (outcomes: readonly HarnessOutcome[]): number =>
  outcomes.filter((outcome) => !outcome.ok).length;
