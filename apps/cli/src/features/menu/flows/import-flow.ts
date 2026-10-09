import { log, note } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { promptMultiSelect } from "../../../shared/prompt";
import { describeReadFailure, type HarnessReadFailure, type ImportCandidate } from "../../harnesses/import";
import { findAdapter } from "../../harnesses/registry";
import { markImportOffered } from "../../profiles/import-flag";
import { scanImportCandidates } from "../../providers/import-scan";
import { importProvider } from "../../providers/service";
import { introBanner } from "../banner";
import { reportOutcomes } from "./report-outcomes";

const FIRST_RUN_INTRO =
  "yoink keeps your Claude logins and API-key providers in one place, and connects providers to coding tools like pi, opencode and Codex. It found some providers already set up on this machine.";

const candidateKey = (candidate: ImportCandidate, index: number): string => `${index}:${candidate.id}`;

const sourcesLabel = (candidate: ImportCandidate): string =>
  candidate.sources.map((source) => findAdapter(source)?.label ?? source).join(", ");

const candidateOption = (candidate: ImportCandidate, index: number) => ({
  value: candidateKey(candidate, index),
  label: candidate.displayName,
  hint: `${sourcesLabel(candidate)} · ${candidate.models.length} models`,
});

export const importCandidatesFlow = async (candidates: ImportCandidate[]): Promise<void> => {
  const chosen = await promptMultiSelect({
    message: "Found providers already set up in your harnesses. Let yoink manage them?",
    options: candidates.map(candidateOption),
    initialValues: candidates.map(candidateKey),
    required: false,
  });
  await markImportOffered();
  if (chosen === null || chosen.length === 0) {
    log.info(pc.dim("Skipped. Run `yoink import` any time."));
    return;
  }
  for (const [index, candidate] of candidates.entries()) {
    if (!chosen.includes(candidateKey(candidate, index))) continue;
    const { profile, outcomes } = await importProvider(candidate);
    log.success(`Imported ${theme.accent(profile.name)}`);
    reportOutcomes(outcomes.filter((outcome) => !outcome.ok), "Synced");
  }
};

const warnReadFailures = (failures: HarnessReadFailure[]): void => {
  for (const failure of failures) log.warn(describeReadFailure(failure));
};

export const offerImport = async (): Promise<void> => {
  const { candidates, failures } = await scanImportCandidates();
  if (candidates.length === 0 && failures.length === 0) return;
  introBanner("welcome");
  warnReadFailures(failures);
  if (candidates.length === 0) return;
  note(FIRST_RUN_INTRO, "First run");
  await importCandidatesFlow(candidates);
};
