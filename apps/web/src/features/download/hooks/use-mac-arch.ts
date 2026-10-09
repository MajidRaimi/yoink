"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_MAC_ARCH, archFromHints, type MacArch } from "@/features/download/lib/mac-arch";
import { readNavigatorPlatform, readUserAgentData } from "@/features/download/hooks/navigator-hints";

export type MacArchState = {
  arch: MacArch;
  choose: (arch: MacArch) => void;
};

const listeners = new Set<() => void>();

let detected: MacArch | null = null;
let chosen: MacArch | null = null;
let requested = false;

const notify = (): void => listeners.forEach((listener) => listener());

const readArchitecture = async (): Promise<string | undefined> => {
  const data = readUserAgentData();
  if (data?.getHighEntropyValues === undefined) return undefined;
  try {
    const { architecture } = await data.getHighEntropyValues(["architecture"]);
    return architecture;
  } catch {
    return undefined;
  }
};

const isMac = (): boolean => readNavigatorPlatform() === "mac";

const readRenderer = (): string | undefined => {
  if (!isMac()) return undefined;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl === null) return undefined;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer: unknown = info === null ? undefined : gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return typeof renderer === "string" ? renderer : undefined;
  } catch {
    return undefined;
  }
};

const detect = async (): Promise<void> => {
  const architecture = await readArchitecture();
  const arch = archFromHints({ architecture }) ?? archFromHints({ renderer: readRenderer() });
  if (arch === null || arch === detected) return;
  detected = arch;
  notify();
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  if (!requested) {
    requested = true;
    void detect();
  }
  return () => {
    listeners.delete(listener);
  };
};

const readArch = (): MacArch => chosen ?? detected ?? DEFAULT_MAC_ARCH;

const readDefaultArch = (): MacArch => DEFAULT_MAC_ARCH;

const choose = (arch: MacArch): void => {
  chosen = arch;
  notify();
};

export const useMacArch = (): MacArchState => {
  const arch = useSyncExternalStore(subscribe, readArch, readDefaultArch);
  return { arch, choose };
};
