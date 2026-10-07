import { pathExists } from "../../../shared/fs-errors";

export type DetectionProbes = {
  which: (binary: string) => string | null;
  exists: (path: string) => Promise<boolean>;
};

const isReachablePath = async (path: string): Promise<boolean> => {
  try {
    return await pathExists(path);
  } catch {
    return false;
  }
};

export const defaultProbes: DetectionProbes = {
  which: (binary) => Bun.which(binary),
  exists: isReachablePath,
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
