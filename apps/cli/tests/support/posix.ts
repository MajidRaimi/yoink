import { expect } from "bun:test";
import { stat } from "node:fs/promises";

export const isPosix: boolean = process.platform !== "win32";

export const fileMode = async (path: string): Promise<number> => (await stat(path)).mode & 0o777;

export const expectMode = async (path: string, mode: number): Promise<void> => {
  if (!isPosix) return;
  expect(await fileMode(path)).toBe(mode);
};
