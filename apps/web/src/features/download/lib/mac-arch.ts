import type { DesktopDmgUrls } from "@/shared/contract";

export type MacArch = keyof DesktopDmgUrls;

export const MAC_ARCHES: readonly MacArch[] = ["arm64", "x64"];

export const DEFAULT_MAC_ARCH: MacArch = "arm64";

export const MAC_ARCH_LABELS: Readonly<Record<MacArch, string>> = {
  arm64: "Apple Silicon",
  x64: "Intel",
};

export const MAC_ARCH_NOTES: Readonly<Partial<Record<MacArch, string>>> = {
  arm64: "M1 and later",
};

export type ArchHints = {
  architecture?: string;
  renderer?: string;
};

export const archFromHints = ({ architecture, renderer }: ArchHints): MacArch | null => {
  if (architecture === "arm") return "arm64";
  if (architecture === "x86") return "x64";
  if (renderer === undefined) return null;
  if (/Apple M\d/i.test(renderer)) return "arm64";
  if (/Intel|AMD|Radeon|NVIDIA/i.test(renderer)) return "x64";
  return null;
};
