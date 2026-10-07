import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { ipc, onPanelShown, onProfilesChanged } from "./ipc";
import { queryKeys } from "./query";
import type { ExternalProfile, Store } from "./types";
import { useTauriEvent } from "./use-tauri-event";

export const emptyStore: Store = { current: null, profiles: [] };

export const useProfilesQuery = (): UseQueryResult<Store> => {
  const queryClient = useQueryClient();
  useTauriEvent(onProfilesChanged, (store) => queryClient.setQueryData(queryKeys.profiles, store));
  useTauriEvent<void>(onPanelShown, () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.profiles });
    void queryClient.invalidateQueries({ queryKey: queryKeys.allHarnesses });
  });
  return useQuery({ queryKey: queryKeys.profiles, queryFn: ipc.listProfiles });
};

type ExternalProfileLookup = {
  profile: ExternalProfile | null;
  loading: boolean;
};

export const useExternalProfile = (name: string | null): ExternalProfileLookup => {
  const { data, isPending } = useProfilesQuery();
  const profile =
    name === null
      ? null
      : (data?.profiles.find(
          (entry): entry is ExternalProfile => entry.type === "external" && entry.name === name,
        ) ?? null);
  return { profile, loading: isPending };
};
