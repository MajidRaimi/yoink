import { selectedDefaultModel } from "../profiles/default-model";
import type { HarnessId } from "../profiles/types";
import { harnessStatuses, loadProvider, type HarnessSync } from "./sync";

export type ProviderHarnessStatus = {
  id: HarnessId;
  label: string;
  installed: boolean;
  configPath: string;
  compatible: boolean;
  connected: boolean;
  parseError: string | null;
  exclusive: boolean;
  experimental: boolean;
  setsDefaultModel: boolean;
  notice: string | null;
  defaultModel: string | null;
};

export type ProviderStatusDeps = Pick<HarnessSync, "loadProvider" | "harnessStatuses">;

const defaultDeps: ProviderStatusDeps = { loadProvider, harnessStatuses };

export const providerHarnessStatuses = async (
  name: string,
  deps: ProviderStatusDeps = defaultDeps,
): Promise<ProviderHarnessStatus[]> => {
  const provider = await deps.loadProvider(name);
  const statuses = await deps.harnessStatuses(provider);
  return statuses.map((status) => ({
    id: status.id,
    label: status.label,
    installed: status.installed,
    configPath: status.configPath,
    compatible: status.compatible,
    connected: status.connected,
    parseError: status.parseError,
    exclusive: status.exclusive,
    experimental: status.experimental,
    setsDefaultModel: status.setsDefaultModel,
    notice: status.notice,
    defaultModel: status.connected && status.setsDefaultModel ? (selectedDefaultModel(provider, status.id) ?? null) : null,
  }));
};
