import { stat } from "node:fs/promises";

export type DetectionProbes = {
  which: (binary: string) => string | null;
  exists: (path: string) => Promise<boolean>;
};

export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

export const defaultProbes: DetectionProbes = {
  which: (binary) => Bun.which(binary),
  exists: pathExists,
};

export const isInstalled = async (
  probes: DetectionProbes,
  binaries: readonly string[],
  paths: readonly string[],
): Promise<boolean> => {
  if (binaries.some((binary) => probes.which(binary) !== null)) return true;
  const found = await Promise.all(paths.map((path) => probes.exists(path)));
  return found.includes(true);
};
