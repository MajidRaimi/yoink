"use client";

import { useSyncExternalStore } from "react";
import type { Platform } from "@/shared/contract";
import { readNavigatorPlatform } from "@/features/download/hooks/navigator-hints";

const subscribeToNothing = (): (() => void) => () => undefined;

let cached: Platform | null = null;

const readPlatform = (): Platform => {
  if (cached === null) {
    cached = readNavigatorPlatform();
  }
  return cached;
};

const serverPlatform = (): Platform => "unknown";

export const usePlatform = (): Platform => useSyncExternalStore(subscribeToNothing, readPlatform, serverPlatform);
