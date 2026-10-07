import type { ProviderProfile } from "../profiles/types";
import type { HarnessAdapter } from "./types";

export type TrackedCheck = (path: string) => Promise<boolean>;

export const ALLOW_TRACKED_SWITCH = "--allow-tracked";

export const harnessWriteTargets = async (adapter: HarnessAdapter, provider: ProviderProfile): Promise<string[]> =>
  adapter.writeTargets ? adapter.writeTargets(provider) : [(await adapter.detect()).configPath];

export const trackedWriteTargets = async (
  adapter: HarnessAdapter,
  provider: ProviderProfile,
  isTracked: TrackedCheck,
): Promise<string[]> => {
  const targets = [...new Set(await harnessWriteTargets(adapter, provider))];
  const tracked = await Promise.all(targets.map(isTracked));
  return targets.filter((_target, index) => tracked[index]);
};

export const trackedRefusalMessage = (paths: readonly string[]): string => {
  const verb = paths.length === 1 ? "is" : "are";
  return `${paths.join(", ")} ${verb} tracked in a git repository, so your API key could be committed. Untrack it there, or pass ${ALLOW_TRACKED_SWITCH} to write it anyway.`;
};
