import { rename, rm, writeFile } from "node:fs/promises";

const RETRYABLE_CODES = new Set(["EPERM", "EBUSY"]);
const RENAME_ATTEMPTS = 3;
const RENAME_RETRY_DELAY_MS = 50;

const isRetryable = (error: unknown): boolean =>
  error instanceof Error && RETRYABLE_CODES.has((error as NodeJS.ErrnoException).code ?? "");

const renameWithRetry = async (from: string, to: string): Promise<void> => {
  for (let attempt = 1; attempt <= RENAME_ATTEMPTS; attempt++) {
    try {
      await rename(from, to);
      return;
    } catch (error) {
      if (attempt === RENAME_ATTEMPTS || !isRetryable(error)) throw error;
      await Bun.sleep(RENAME_RETRY_DELAY_MS);
    }
  }
};

export const writeFileAtomic = async (path: string, contents: string, mode?: number): Promise<void> => {
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    await writeFile(tmp, contents, mode !== undefined ? { mode } : {});
    await renameWithRetry(tmp, path);
  } catch (error) {
    await rm(tmp, { force: true });
    throw error;
  }
};
