"use client";

import { useSyncExternalStore } from "react";

const subscribeToNothing = (): (() => void) => () => undefined;

export const useIsHydrating = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
