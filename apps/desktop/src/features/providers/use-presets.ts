import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { ipc } from "@/shared/ipc";
import { queryKeys } from "@/shared/query";
import type { ProviderPreset } from "@/shared/types";

export const usePresets = (): UseQueryResult<ProviderPreset[]> =>
  useQuery({ queryKey: queryKeys.presets, queryFn: ipc.listPresets, staleTime: Number.POSITIVE_INFINITY });
