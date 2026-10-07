import { expect, test } from "bun:test";
import type { HarnessReadFailure, ImportCandidate, ImportScan } from "../src/features/harnesses/import";
import type { BulkImportResult } from "../src/features/providers/bulk-import";
import { importScannedCandidates, scanImportCandidates, type ImportScanDeps } from "../src/features/providers/import-scan";
import { kimiModel } from "./support/provider-fixture";

const candidate: ImportCandidate = {
  id: "fuse",
  displayName: "fuse",
  token: "sk-fuse",
  endpoints: [{ protocol: "openai-chat", baseUrl: "https://fuse.test/v1" }],
  models: [kimiModel],
  sources: ["pi"],
  unkeyedSources: [],
};

const failure: HarnessReadFailure = { source: "opencode", label: "opencode", message: "bad json" };

const depsFor = (scan: ImportScan): { deps: ImportScanDeps; marks: () => number } => {
  let count = 0;
  return {
    deps: {
      loadProfiles: async () => [],
      scan: async () => scan,
      markOffered: async () => {
        count += 1;
      },
    },
    marks: () => count,
  };
};

const emptyImport = async (): Promise<BulkImportResult> => ({ results: [], failed: 0 });

test("scanImportCandidates marks the offer when nothing is left and every harness was readable", async () => {
  const { deps, marks } = depsFor({ candidates: [], failures: [] });
  await scanImportCandidates(deps);
  expect(marks()).toBe(1);
});

test("scanImportCandidates leaves the offer open when a harness could not be read", async () => {
  const { deps, marks } = depsFor({ candidates: [], failures: [failure] });
  expect((await scanImportCandidates(deps)).failures).toEqual([failure]);
  expect(marks()).toBe(0);
});

test("scanImportCandidates leaves the offer open while candidates remain", async () => {
  const { deps, marks } = depsFor({ candidates: [candidate], failures: [] });
  expect((await scanImportCandidates(deps)).candidates).toEqual([candidate]);
  expect(marks()).toBe(0);
});

test("importScannedCandidates marks the offer only when the scan had no read failures", async () => {
  const clean = depsFor({ candidates: [candidate], failures: [] });
  await importScannedCandidates({ candidates: [candidate], failures: [] }, emptyImport, clean.deps.markOffered);
  expect(clean.marks()).toBe(1);

  const broken = depsFor({ candidates: [candidate], failures: [failure] });
  await importScannedCandidates({ candidates: [candidate], failures: [failure] }, emptyImport, broken.deps.markOffered);
  expect(broken.marks()).toBe(0);
});
