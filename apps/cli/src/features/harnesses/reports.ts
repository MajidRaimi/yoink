import { listProfiles } from "../profiles/service";
import { toProviderProfile } from "../profiles/store";
import type { HarnessId, Protocol, ProviderProfile } from "../profiles/types";
import { HARNESS_ADAPTERS } from "./registry";
import { probeConnection } from "./sync";
import type { HarnessAdapter } from "./types";

export type HarnessReport = {
  id: HarnessId;
  label: string;
  installed: boolean;
  configPath: string;
  protocols: readonly Protocol[];
  providers: string[];
  error: string | null;
};

const reportFor = async (adapter: HarnessAdapter, providers: readonly ProviderProfile[]): Promise<HarnessReport> => {
  const detection = await adapter.detect();
  const probes = await Promise.all(
    providers.map(async (provider) => ({ name: provider.name, probe: await probeConnection(adapter, provider.name) })),
  );
  return {
    id: adapter.id,
    label: adapter.label,
    installed: detection.installed,
    configPath: detection.configPath,
    protocols: adapter.protocols,
    providers: probes.filter(({ probe }) => probe.connected).map(({ name }) => name),
    error: probes.find(({ probe }) => probe.error !== null)?.probe.error ?? null,
  };
};

export const buildHarnessReports = (
  providers: readonly ProviderProfile[],
  adapters: readonly HarnessAdapter[] = HARNESS_ADAPTERS,
): Promise<HarnessReport[]> => Promise.all(adapters.map((adapter) => reportFor(adapter, providers)));

export const harnessReports = async (): Promise<HarnessReport[]> => {
  const { profiles } = await listProfiles();
  return buildHarnessReports(profiles.filter((profile) => profile.type === "external").map(toProviderProfile));
};
