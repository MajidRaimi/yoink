import { chmod, lstat, mkdir, readlink, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const RETRYABLE_CODES = new Set(["EPERM", "EBUSY"]);
const RENAME_ATTEMPTS = 3;
const RENAME_RETRY_DELAY_MS = 50;
const SECRET_FILE_MODE = 0o600;
const OWNER_ONLY_MASK = 0o700;
const MAX_SYMLINK_HOPS = 40;

const errorCode = (error: unknown): string | undefined =>
  error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined;

const isRetryable = (error: unknown): boolean => RETRYABLE_CODES.has(errorCode(error) ?? "");

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

const isSymlink = async (path: string): Promise<boolean> => {
  try {
    return (await lstat(path)).isSymbolicLink();
  } catch (error) {
    if (errorCode(error) === "ENOENT" || errorCode(error) === "ENOTDIR") return false;
    throw error;
  }
};

const symlinkLoopError = (path: string): NodeJS.ErrnoException =>
  Object.assign(new Error(`ELOOP: too many symbolic links encountered, '${path}'`), {
    code: "ELOOP",
    path,
  });

const resolveDanglingTarget = async (path: string, hops: number): Promise<string> => {
  if (!(await isSymlink(path))) return path;
  if (hops >= MAX_SYMLINK_HOPS) throw symlinkLoopError(path);
  const next = resolve(dirname(path), await readlink(path));
  return resolveWriteTarget(next, hops + 1);
};

const resolveWriteTarget = async (path: string, hops = 0): Promise<string> => {
  try {
    return await realpath(path);
  } catch (error) {
    if (errorCode(error) !== "ENOENT") throw error;
  }
  const target = await resolveDanglingTarget(path, hops);
  if (target !== path) await mkdir(dirname(target), { recursive: true });
  return target;
};

const existingMode = async (path: string): Promise<number | undefined> => {
  try {
    return (await stat(path)).mode & 0o777;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return undefined;
    throw error;
  }
};

const writeResolved = async (target: string, contents: string, mode: number | undefined): Promise<void> => {
  const tmp = `${target}.${process.pid}.tmp`;
  try {
    await writeFile(tmp, contents, mode !== undefined ? { mode } : {});
    if (mode !== undefined && process.platform !== "win32") await chmod(tmp, mode);
    await renameWithRetry(tmp, target);
  } catch (error) {
    await rm(tmp, { force: true });
    throw error;
  }
};

export const writeFileAtomic = async (path: string, contents: string, mode?: number): Promise<void> => {
  const target = await resolveWriteTarget(path);
  await writeResolved(target, contents, mode ?? (await existingMode(target)));
};

export const writeSecretFileAtomic = async (path: string, contents: string): Promise<void> => {
  const target = await resolveWriteTarget(path);
  const current = await existingMode(target);
  await writeResolved(target, contents, current === undefined ? SECRET_FILE_MODE : current & OWNER_ONLY_MASK);
};
