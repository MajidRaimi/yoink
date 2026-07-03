import { useCallback, useEffect, useState } from "react";
import { ipc, onPanelShown, onProfilesChanged } from "@/shared/ipc";
import type { Store } from "@/shared/types";

export const describeError = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
};

const emptyStore: Store = { current: null, profiles: [] };

export const useProfiles = () => {
  const [store, setStore] = useState<Store>(emptyStore);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStore(await ipc.listProfiles());
    } catch (cause) {
      setError(describeError(cause));
    }
  }, []);

  useEffect(() => {
    void refresh();
    const unlistenChanged = onProfilesChanged(setStore);
    const unlistenShown = onPanelShown(() => void refresh());
    return () => {
      void unlistenChanged.then((unlisten) => unlisten());
      void unlistenShown.then((unlisten) => unlisten());
    };
  }, [refresh]);

  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setError(null);
      try {
        await action();
        return true;
      } catch (cause) {
        setError(describeError(cause));
        void refresh();
        return false;
      }
    },
    [refresh],
  );

  const switchTo = useCallback(
    (name: string) => {
      setStore((prev) => ({ ...prev, current: name }));
      return run(() => ipc.switchProfile(name));
    },
    [run],
  );

  const rename = useCallback(
    (from: string, to: string) => run(() => ipc.renameProfile(from, to)),
    [run],
  );

  const remove = useCallback((name: string) => run(() => ipc.removeProfile(name)), [run]);

  const saveCurrent = useCallback((name: string) => run(() => ipc.saveProfile(name)), [run]);

  return { store, error, switchTo, rename, remove, saveCurrent };
};
