import { expect, test } from "bun:test";
import type { ImportCandidate } from "../src/features/harnesses/import";
import { importAllCandidates } from "../src/features/providers/bulk-import";
import type { ImportProvider } from "../src/features/providers/import-provider";
import { kimiModel, makeProvider } from "./support/provider-fixture";

const candidate = (id: string): ImportCandidate => ({
  id,
  displayName: id,
  token: `sk-${id}`,
  endpoints: [{ protocol: "openai-chat", baseUrl: `https://${id}.test/v1` }],
  models: [kimiModel],
  sources: ["pi", "codex"],
  unkeyedSources: [],
});

test("importAllCandidates imports every candidate even when an earlier sync fails", async () => {
  const imported: string[] = [];
  const importOne: ImportProvider = async (entry) => {
    imported.push(entry.id);
    const outcomes =
      entry.id === "first"
        ? [{ id: "pi" as const, ok: true as const }, { id: "codex" as const, ok: false as const, message: "boom" }]
        : [{ id: "pi" as const, ok: true as const }];
    return { profile: makeProvider({ name: entry.id }), outcomes };
  };

  const { results, failed } = await importAllCandidates([candidate("first"), candidate("second"), candidate("third")], importOne);

  expect(imported).toEqual(["first", "second", "third"]);
  expect(results.map((result) => result.profile.name)).toEqual(["first", "second", "third"]);
  expect(failed).toBe(1);
});
