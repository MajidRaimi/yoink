import { expect, test } from "bun:test";
import { providerHarnessStatuses, type ProviderStatusDeps } from "../src/features/harnesses/provider-status";
import type { HarnessStatus } from "../src/features/harnesses/sync";
import type { ProviderProfile } from "../src/features/profiles/types";
import { kimiModel, makeProvider, visionModel } from "./support/provider-fixture";

const status = (overrides: Partial<HarnessStatus> & Pick<HarnessStatus, "id" | "label">): HarnessStatus => ({
  installed: true,
  configPath: `/fake/${overrides.id}`,
  compatible: true,
  connected: false,
  parseError: null,
  exclusive: false,
  ...overrides,
});

const depsFor = (provider: ProviderProfile, statuses: HarnessStatus[]): ProviderStatusDeps => ({
  loadProvider: async () => provider,
  harnessStatuses: async () => statuses,
});

test("providerHarnessStatuses adds the recorded default model and passes parse errors through", async () => {
  const provider = makeProvider({
    connections: {
      pi: { connectedAt: "2026-01-01T00:00:00.000Z", defaultModel: visionModel.id },
      opencode: { connectedAt: "2026-01-01T00:00:00.000Z" },
    },
  });
  const result = await providerHarnessStatuses(
    "fuse",
    depsFor(provider, [
      status({ id: "pi", label: "pi", connected: true }),
      status({ id: "opencode", label: "OpenCode", connected: true, parseError: "bad json" }),
      status({ id: "codex", label: "Codex", installed: false, compatible: false }),
      status({ id: "claude-code", label: "Claude Code", exclusive: true }),
    ]),
  );
  expect(result).toEqual([
    {
      id: "pi",
      label: "pi",
      installed: true,
      configPath: "/fake/pi",
      compatible: true,
      connected: true,
      parseError: null,
      exclusive: false,
      defaultModel: visionModel.id,
    },
    {
      id: "opencode",
      label: "OpenCode",
      installed: true,
      configPath: "/fake/opencode",
      compatible: true,
      connected: true,
      parseError: "bad json",
      exclusive: false,
      defaultModel: null,
    },
    {
      id: "codex",
      label: "Codex",
      installed: false,
      configPath: "/fake/codex",
      compatible: false,
      connected: false,
      parseError: null,
      exclusive: false,
      defaultModel: null,
    },
    {
      id: "claude-code",
      label: "Claude Code",
      installed: true,
      configPath: "/fake/claude-code",
      compatible: true,
      connected: false,
      parseError: null,
      exclusive: true,
      defaultModel: null,
    },
  ]);
});

test("providerHarnessStatuses ignores stale defaults and defaults of disconnected harnesses", async () => {
  const provider = makeProvider({
    models: [kimiModel],
    connections: {
      pi: { connectedAt: "2026-01-01T00:00:00.000Z", defaultModel: "removed-model" },
      omp: { connectedAt: "2026-01-01T00:00:00.000Z", defaultModel: kimiModel.id },
    },
  });
  const result = await providerHarnessStatuses(
    "fuse",
    depsFor(provider, [status({ id: "pi", label: "pi", connected: true }), status({ id: "omp", label: "omp" })]),
  );
  expect(result.map((entry) => entry.defaultModel)).toEqual([null, null]);
});
