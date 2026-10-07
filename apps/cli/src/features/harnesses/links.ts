import type { HarnessId, ProviderProfile } from "../profiles/types";
import type { HarnessStatus } from "./sync";

type LinkStatus = Pick<HarnessStatus, "id" | "connected" | "exclusive">;

type RecordedLinks = Pick<ProviderProfile, "connections">;

const recordedIds = (provider: RecordedLinks): HarnessId[] => Object.keys(provider.connections) as HarnessId[];

const liveIds = (statuses: readonly LinkStatus[]): HarnessId[] =>
  statuses.filter((status) => status.connected).map((status) => status.id);

export const linkedHarnessIds = (provider: RecordedLinks, statuses: readonly LinkStatus[]): HarnessId[] => {
  const recorded = recordedIds(provider);
  return statuses
    .filter((status) => status.connected || (!status.exclusive && recorded.includes(status.id)))
    .map((status) => status.id);
};

export const disconnectTargets = (provider: RecordedLinks, statuses: readonly LinkStatus[]): HarnessId[] => [
  ...new Set([...recordedIds(provider), ...liveIds(statuses)]),
];
