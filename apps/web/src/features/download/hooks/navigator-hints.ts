import type { Platform } from "@/shared/contract";
import { detectPlatform } from "@/features/download/lib/platform";

export type HighEntropyHints = {
  architecture?: string;
};

export type UserAgentDataLike = {
  platform?: string;
  getHighEntropyValues?: (hints: readonly string[]) => Promise<HighEntropyHints>;
};

const isUserAgentData = (value: unknown): value is UserAgentDataLike => typeof value === "object" && value !== null;

export const readUserAgentData = (): UserAgentDataLike | null => {
  if (typeof navigator === "undefined" || !("userAgentData" in navigator)) return null;
  const data: unknown = navigator.userAgentData;
  return isUserAgentData(data) ? data : null;
};

export const readNavigatorPlatform = (): Platform =>
  detectPlatform({
    uaPlatform: readUserAgentData()?.platform,
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  });
