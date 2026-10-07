import type { HarnessId, HarnessStatus } from "@/shared/types";

export type ConnectNotice = {
  id: HarnessId;
  label: string;
  notice: string;
};

export const connectNotices = (
  statuses: readonly HarnessStatus[],
  connected: readonly HarnessId[],
): ConnectNotice[] => {
  const wanted = new Set(connected);
  return statuses.flatMap((status) =>
    status.connected && wanted.has(status.id) && status.notice !== null
      ? [{ id: status.id, label: status.label, notice: status.notice }]
      : [],
  );
};
