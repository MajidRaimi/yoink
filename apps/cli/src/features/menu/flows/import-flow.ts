import { log, note, outro } from "@clack/prompts";
import pc from "picocolors";
import { theme } from "../../../shared/theme";
import { promptMultiSelect } from "../../../shared/prompt";
import { describeReadFailure, scanHarnesses, type HarnessReadFailure, type ImportCandidate } from "../../harnesses/import";
import { findAdapter } from "../../harnesses/registry";
import { markImportOffered } from "../../profiles/import-flag";
import { listProfiles } from "../../profiles/service";
import { importProvider } from "../../providers/service";
import { reportOutcomes } from "./report-outcomes";

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
  const { profiles } = await listProfiles();
  const { candidates, failures } = await scanHarnesses(profiles);
  warnReadFailures(failures);
  if (candidates.length === 0) {
    if (failures.length === 0) await markImportOffered();
    return;
  }
  await importCandidatesFlow(candidates);
};

export const runImportCommand = async (): Promise<void> => {
  const { profiles } = await listProfiles();
  const { candidates, failures } = await scanHarnesses(profiles);
  warnReadFailures(failures);
  if (candidates.length === 0) {
    note("No unmanaged providers found in pi, omp, opencode, codex or Claude Code.", "Import");
    if (failures.length === 0) await markImportOffered();
    return;
  }
  await importCandidatesFlow(candidates);
  outro("Done.");
};
