import { listProfiles } from "../profiles/service";
import { toProviderProfile } from "../profiles/store";
import type { HarnessId, Protocol, ProviderProfile } from "../profiles/types";
import { HARNESS_ADAPTERS } from "./registry";
import { connectNoticeFor, probeConnection } from "./sync";
import type { HarnessAdapter } from "./types";

export type HarnessReport = {
  id: HarnessId;
  label: string;
  installed: boolean;
  configPath: string;
  protocols: readonly Protocol[];
  experimental: boolean;
  notices: string[];
  providers: string[];
  error: string | null;
};

const reportFor = async (adapter: HarnessAdapter, providers: readonly ProviderProfile[]): Promise<HarnessReport> => {
  const detection = await adapter.detect();
  const probes = await Promise.all(
    providers.map(async (provider) => ({ provider, probe: await probeConnection(adapter, provider.name) })),
  );
  const connected = probes.filter(({ probe }) => probe.connected).map(({ provider }) => provider);
  return {
    id: adapter.id,
    label: adapter.label,
    installed: detection.installed,
    configPath: detection.configPath,
    protocols: adapter.protocols,
    experimental: adapter.experimental,
    notices: connected
      .map((provider) => connectNoticeFor(adapter, provider))
      .filter((notice): notice is string => notice !== undefined),
    providers: connected.map((provider) => provider.name),
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
