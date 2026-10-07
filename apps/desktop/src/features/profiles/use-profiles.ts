import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { describeError } from "@/shared/errors";
import { ipc } from "@/shared/ipc";
import { queryKeys } from "@/shared/query";
import type { Store } from "@/shared/types";
import { emptyStore, useProfilesQuery } from "@/shared/use-profiles-query";

type ProfilesApi = {
  store: Store;
  error: string | null;
  switchTo: (name: string) => Promise<boolean>;
  rename: (from: string, to: string) => Promise<boolean>;
  remove: (name: string) => Promise<boolean>;
  saveCurrent: (name: string) => Promise<boolean>;
};

export const useProfiles = (): ProfilesApi => {
  const queryClient = useQueryClient();
  const profilesQuery = useProfilesQuery();
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.profiles }),
    [queryClient],
  );

  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setActionError(null);
      try {
        await action();
        return true;
      } catch (cause) {
        setActionError(describeError(cause));
        void refresh();
        return false;
      } finally {
        void queryClient.invalidateQueries({ queryKey: queryKeys.allHarnesses });
      }
    },
    [queryClient, refresh],
  );

  const switchTo = useCallback(
    (name: string) => {
      queryClient.setQueryData<Store>(queryKeys.profiles, (previous) => ({ ...(previous ?? emptyStore), current: name }));
      return run(() => ipc.switchProfile(name));
    },
    [queryClient, run],
  );

  const rename = useCallback((from: string, to: string) => run(() => ipc.renameProfile(from, to)), [run]);

  const remove = useCallback((name: string) => run(() => ipc.removeProfile(name)), [run]);

  const saveCurrent = useCallback((name: string) => run(() => ipc.saveProfile(name)), [run]);

  const loadError = profilesQuery.error === null ? null : describeError(profilesQuery.error);

  return {
    store: profilesQuery.data ?? emptyStore,
    error: actionError ?? loadError,
    switchTo,
    rename,
    remove,
    saveCurrent,
  };
};
