import { scanHarnesses, type HarnessReadFailure, type ImportScan } from "../harnesses/import";
import { markImportOffered } from "../profiles/import-flag";
import { listProfiles } from "../profiles/service";
import type { Profile } from "../profiles/types";
import { importAllCandidates, type BulkImportResult } from "./bulk-import";

export type ImportScanDeps = {
  loadProfiles: () => Promise<Profile[]>;
  scan: (profiles: Profile[]) => Promise<ImportScan>;
  markOffered: () => Promise<void>;
};

const defaultScanDeps: ImportScanDeps = {
  loadProfiles: async () => (await listProfiles()).profiles,
  scan: (profiles) => scanHarnesses(profiles),
  markOffered: markImportOffered,
};

const markOfferedWhenComplete = async (
  failures: readonly HarnessReadFailure[],
  markOffered: () => Promise<void>,
): Promise<void> => {
  if (failures.length === 0) await markOffered();
};

export const scanImportCandidates = async (deps: ImportScanDeps = defaultScanDeps): Promise<ImportScan> => {
  const scan = await deps.scan(await deps.loadProfiles());
  if (scan.candidates.length === 0) await markOfferedWhenComplete(scan.failures, deps.markOffered);
  return scan;
};

export const importScannedCandidates = async (
  scan: ImportScan,
  importAll: (candidates: ImportScan["candidates"]) => Promise<BulkImportResult> = importAllCandidates,
  markOffered: () => Promise<void> = markImportOffered,
): Promise<BulkImportResult> => {
  const result = await importAll(scan.candidates);
  await markOfferedWhenComplete(scan.failures, markOffered);
  return result;
};
