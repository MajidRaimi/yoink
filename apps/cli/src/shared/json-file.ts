import { ConfigParseError } from "./errors";

export const readTextFile = async (path: string): Promise<string | null> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;
  return file.text();
};

export const parseJsonText = <T>(path: string, text: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new ConfigParseError(path, error);
  }
};

export const readJsonFile = async <T>(path: string): Promise<T | null> => {
  const text = await readTextFile(path);
  if (text === null || text.trim().length === 0) return null;
  return parseJsonText<T>(path, text);
};
