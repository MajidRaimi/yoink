import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { writeSecretFileAtomic } from "../../../shared/atomic-write";
import { ensureBackup } from "../../../shared/backup";

const CONFIG_DIR_MODE = 0o700;

export const writeConfigFile = async (path: string, contents: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true, mode: CONFIG_DIR_MODE });
  await ensureBackup(path);
  await writeSecretFileAtomic(path, contents);
};

export const firstExisting = async (candidates: readonly string[]): Promise<string | undefined> => {
  for (const candidate of candidates) {
    if (await Bun.file(candidate).exists()) return candidate;
  }
  return undefined;
};
