import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { writeSecretFileAtomic } from "../../../shared/atomic-write";
import { backupPathFor, ensureBackup } from "../../../shared/backup";

const CONFIG_DIR_MODE = 0o700;

const ensureConfigDir = async (path: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true, mode: CONFIG_DIR_MODE });
};

export const writeConfigFile = async (path: string, contents: string): Promise<void> => {
  await ensureConfigDir(path);
  await ensureBackup(path);
  await writeSecretFileAtomic(path, contents);
};

export const writeOwnedConfigFile = async (path: string, contents: string): Promise<void> => {
  await ensureConfigDir(path);
  await writeSecretFileAtomic(path, contents);
};

export const removeOwnedConfigFile = async (path: string): Promise<void> => {
  await rm(path, { force: true });
  await rm(backupPathFor(path), { force: true });
};

export const firstExisting = async (candidates: readonly string[]): Promise<string | undefined> => {
  for (const candidate of candidates) {
    if (await Bun.file(candidate).exists()) return candidate;
  }
  return undefined;
};
