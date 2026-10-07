import { expect, test } from "bun:test";
import { buildHarnessReports } from "../src/features/harnesses/reports";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import type { HarnessId } from "../src/features/profiles/types";
import { makeProvider } from "./support/provider-fixture";

const fakeAdapter = (
  id: HarnessId,
  installed: boolean,
  isConnected: (providerId: string) => Promise<boolean>,
): HarnessAdapter => ({
  id,
  label: id,
  protocols: ["openai-chat"],
  exclusive: false,
  detect: async () => ({ installed, configPath: `/fake/${id}.json` }),
  readProviders: async () => [],
  isConnected,
  readDefaultModel: async () => null,
  connect: async () => {},
  disconnect: async () => {},
});

test("buildHarnessReports lists the providers each harness holds and surfaces unreadable configs", async () => {
  const providers = [makeProvider({ name: "fuse" }), makeProvider({ name: "router" })];
  const adapters = [
    fakeAdapter("pi", true, async (name) => name === "fuse"),
    fakeAdapter("omp", true, async () => {
      throw new Error("bad yaml");
    }),
    fakeAdapter("codex", false, async () => false),
  ];

  const reports = await buildHarnessReports(providers, adapters);

  expect(reports).toEqual([
    { id: "pi", label: "pi", installed: true, configPath: "/fake/pi.json", protocols: ["openai-chat"], providers: ["fuse"], error: null },
    { id: "omp", label: "omp", installed: true, configPath: "/fake/omp.json", protocols: ["openai-chat"], providers: [], error: "bad yaml" },
    { id: "codex", label: "codex", installed: false, configPath: "/fake/codex.json", protocols: ["openai-chat"], providers: [], error: null },
  ]);
});

test("buildHarnessReports still detects every harness when no providers exist", async () => {
  const reports = await buildHarnessReports([], [fakeAdapter("pi", true, async () => true)]);
  expect(reports.map((report) => [report.id, report.installed, report.providers])).toEqual([["pi", true, []]]);
});
