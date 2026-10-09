"use client";

import { useSyncExternalStore } from "react";
import { subscribeToNothing } from "@/shared/lib/subscribe-to-nothing";

export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
