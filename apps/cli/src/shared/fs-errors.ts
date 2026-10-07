import { stat } from "node:fs/promises";

export type PathKind = "any" | "file" | "directory";

export const errorCode = (error: unknown): string | undefined =>
  error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;

export const isMissingFileError = (error: unknown): boolean => {
  const code = errorCode(error);
  return code === "ENOENT" || code === "ENOTDIR";
};

export const readOptionalText = async (path: string): Promise<string | null> => {
  try {
    return await Bun.file(path).text();
  } catch (error) {
    if (isMissingFileError(error)) return null;
    throw error;
  }
};

export const pathExists = async (path: string, kind: PathKind = "any"): Promise<boolean> => {
  try {
    const info = await stat(path);
    if (kind === "file") return info.isFile();
    if (kind === "directory") return info.isDirectory();
    return true;
  } catch (error) {
    if (isMissingFileError(error)) return false;
    throw error;
  }
};

export const parseJsonOrNull = (text: string | undefined): unknown => {
  if (text === undefined) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
