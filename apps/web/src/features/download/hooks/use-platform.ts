"use client";

import { useSyncExternalStore } from "react";
import { subscribeToNothing } from "@/shared/lib/subscribe-to-nothing";
import type { Platform } from "@/shared/contract";
import { readNavigatorPlatform } from "@/features/download/hooks/navigator-hints";

let cached: Platform | null = null;

const readPlatform = (): Platform => {
  if (cached === null) {
    cached = readNavigatorPlatform();
  }
  return cached;
};

const serverPlatform = (): Platform => "unknown";

export const usePlatform = (): Platform => useSyncExternalStore(subscribeToNothing, readPlatform, serverPlatform);
