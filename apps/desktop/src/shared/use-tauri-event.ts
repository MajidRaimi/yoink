import { useEffect, useEffectEvent } from "react";
import type { UnlistenFn } from "@tauri-apps/api/event";

type Subscribe<TPayload> = (handler: (payload: TPayload) => void) => Promise<UnlistenFn>;

export const useTauriEvent = <TPayload>(subscribe: Subscribe<TPayload>, handler: (payload: TPayload) => void): void => {
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    const unlisten = subscribe((payload) => onEvent(payload));
    return () => {
      void unlisten.then((stop) => stop());
    };
  }, [subscribe]);
};
