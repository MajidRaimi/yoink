import { expect, test } from "bun:test";
import { buildHarnessReports } from "../src/features/harnesses/reports";
import type { HarnessAdapter } from "../src/features/harnesses/types";
import type { HarnessId } from "../src/features/profiles/types";
import { makeProvider } from "./support/provider-fixture";

const fakeAdapter = (
  id: HarnessId,
  installed: boolean,
  isConnected: (providerId: string) => Promise<boolean>,
  extra: Partial<HarnessAdapter> = {},
): HarnessAdapter => ({
  id,
  label: id,
  protocols: ["openai-chat"],
  exclusive: false,
  experimental: false,
  setsDefaultModel: true,
  detect: async () => ({ installed, configPath: `/fake/${id}.json` }),
  readProviders: async () => [],
  isConnected,
  readDefaultModel: async () => null,
  connect: async () => {},
  disconnect: async () => {},
  ...extra,
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
    { id: "pi", label: "pi", installed: true, configPath: "/fake/pi.json", protocols: ["openai-chat"], experimental: false, notices: [], providers: ["fuse"], error: null },
    { id: "omp", label: "omp", installed: true, configPath: "/fake/omp.json", protocols: ["openai-chat"], experimental: false, notices: [], providers: [], error: "bad yaml" },
    { id: "codex", label: "codex", installed: false, configPath: "/fake/codex.json", protocols: ["openai-chat"], experimental: false, notices: [], providers: [], error: null },
  ]);
});

test("buildHarnessReports still detects every harness when no providers exist", async () => {
  const reports = await buildHarnessReports([], [fakeAdapter("pi", true, async () => true)]);
  expect(reports.map((report) => [report.id, report.installed, report.providers])).toEqual([["pi", true, []]]);
});

test("buildHarnessReports carries the experimental flag and the notice for a connected provider", async () => {
  const providers = [makeProvider({ name: "fuse" }), makeProvider({ name: "router" })];
  const adapter = fakeAdapter("goose", true, async (name) => name === "router", {
    experimental: true,
    connectNotice: (provider) => `export CUSTOM_${provider.name.toUpperCase()}_API_KEY`,
  });
  const [report] = await buildHarnessReports(providers, [adapter]);
  expect(report).toMatchObject({ experimental: true, notices: ["export CUSTOM_ROUTER_API_KEY"], providers: ["router"] });
  const [idle] = await buildHarnessReports([], [adapter]);
  expect(idle).toMatchObject({ experimental: true, notices: [] });
});

test("buildHarnessReports lists one notice per connected provider", async () => {
  const providers = [makeProvider({ name: "alpha" }), makeProvider({ name: "beta" }), makeProvider({ name: "gamma" })];
  const adapter = fakeAdapter("zed", true, async (name) => name !== "gamma", {
    experimental: true,
    connectNotice: (provider) => `Set ${provider.name.toUpperCase()}_API_KEY`,
  });
  const [report] = await buildHarnessReports(providers, [adapter]);
  expect(report?.providers).toEqual(["alpha", "beta"]);
  expect(report?.notices).toEqual(["Set ALPHA_API_KEY", "Set BETA_API_KEY"]);
});

test("buildHarnessReports skips connected providers that need no notice", async () => {
  const providers = [makeProvider({ name: "alpha" }), makeProvider({ name: "beta" })];
  const adapter = fakeAdapter("goose", true, async () => true, {
    connectNotice: (provider) => (provider.name === "beta" ? "export CUSTOM_BETA_API_KEY" : undefined),
  });
  const [report] = await buildHarnessReports(providers, [adapter]);
  expect(report?.notices).toEqual(["export CUSTOM_BETA_API_KEY"]);
});
