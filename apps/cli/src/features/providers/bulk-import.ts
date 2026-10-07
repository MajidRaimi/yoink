import type { ImportCandidate } from "../harnesses/import";
import { countFailures } from "../harnesses/outcomes";
import type { ImportProvider, ImportResult } from "./import-provider";
import { importProvider } from "./service";

export type BulkImportResult = {
  results: ImportResult[];
  failed: number;
};

export const importAllCandidates = async (
  candidates: readonly ImportCandidate[],
  importOne: ImportProvider = importProvider,
): Promise<BulkImportResult> => {
  const results: ImportResult[] = [];
  for (const candidate of candidates) results.push(await importOne(candidate));
  return { results, failed: countFailures(results.flatMap((result) => result.outcomes)) };
};
