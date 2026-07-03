import { basename, dirname } from "node:path";

const gitSucceeds = async (args: string[]): Promise<boolean> => {
  try {
    const proc = Bun.spawn(["git", ...args], { stdout: "ignore", stderr: "ignore" });
    return (await proc.exited) === 0;
  } catch {
    return false;
  }
};

export const isTrackedAndNotIgnored = async (filePath: string): Promise<boolean> => {
  const dir = dirname(filePath);
  const name = basename(filePath);
  const tracked = await gitSucceeds(["-C", dir, "ls-files", "--error-unmatch", name]);
  if (!tracked) return false;
  const ignored = await gitSucceeds(["-C", dir, "check-ignore", "-q", name]);
  return !ignored;
};
