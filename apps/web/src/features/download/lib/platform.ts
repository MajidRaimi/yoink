import type { Platform } from "@/shared/contract";

export const PLATFORM_PATTERNS = {
  mobile: /Android|iPhone|iPad|iPod/i,
  windows: /Windows|Win32|Win64|WOW64/i,
  mac: /Mac/i,
  linux: /Linux|X11|CrOS|Chrome OS|Chromium OS/i,
} as const;

export const PLATFORM_ATTRIBUTE = "data-yoink-platform";

export type PlatformHints = {
  uaPlatform?: string;
  userAgent: string;
  maxTouchPoints?: number;
};

const classify = (source: string): Platform | null => {
  if (source.length === 0) return null;
  if (PLATFORM_PATTERNS.mobile.test(source)) return "unknown";
  if (PLATFORM_PATTERNS.windows.test(source)) return "windows";
  if (PLATFORM_PATTERNS.mac.test(source)) return "mac";
  if (PLATFORM_PATTERNS.linux.test(source)) return "linux";
  return null;
};

const isTouchDevice = (maxTouchPoints: number): boolean => maxTouchPoints > 1;

export const detectPlatform = ({ uaPlatform = "", userAgent, maxTouchPoints = 0 }: PlatformHints): Platform => {
  const platform = classify(uaPlatform) ?? classify(userAgent) ?? "unknown";
  return platform === "mac" && isTouchDevice(maxTouchPoints) ? "unknown" : platform;
};

export const platformScript = [
  "try{",
  "var d=navigator.userAgentData,v=[d&&d.platform||'',navigator.userAgent||''];",
  "for(var i=0;i<v.length;i++){var s=v[i];if(!s)continue;",
  `if(${PLATFORM_PATTERNS.mobile}.test(s)||${PLATFORM_PATTERNS.windows}.test(s))break;`,
  `if(${PLATFORM_PATTERNS.mac}.test(s)){if(navigator.maxTouchPoints>1)break;document.documentElement.setAttribute('${PLATFORM_ATTRIBUTE}','mac');break}`,
  `if(${PLATFORM_PATTERNS.linux}.test(s))break}`,
  "}catch(e){}",
].join("");
