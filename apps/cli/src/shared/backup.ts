import { AsyncLocalStorage } from "node:async_hooks";
import { chmod, copyFile } from "node:fs/promises";
import { writeSecretFileAtomic } from "./atomic-write";
import { readOptionalText } from "./fs-errors";
import { excludeFromEnclosingRepo } from "./git-status";

export const BACKUP_SUFFIX = ".yoink.bak";

const BACKUP_FILE_MODE = 0o600;
const BACKUP_EXCLUDE_PATTERN = `*${BACKUP_SUFFIX}`;

const NO_ORIGINAL_SENTINEL = "";

const touchedBackups = new AsyncLocalStorage<Set<string>>();

export const backupPathFor = (path: string): string => `${path}${BACKUP_SUFFIX}`;

const recordTouchedBackup = (backupPath: string): void => {
  touchedBackups.getStore()?.add(backupPath);
};

export const ensureBackup = async (path: string): Promise<void> => {
  const backupPath = backupPathFor(path);
  recordTouchedBackup(backupPath);
  await excludeFromEnclosingRepo(backupPath, BACKUP_EXCLUDE_PATTERN);
  if (await Bun.file(backupPath).exists()) return;
  if (!(await Bun.file(path).exists())) {
    await writeSecretFileAtomic(backupPath, NO_ORIGINAL_SENTINEL);
    return;
  }
  await copyFile(path, backupPath);
  if (process.platform !== "win32") await chmod(backupPath, BACKUP_FILE_MODE);
};

const secretSpellings = (secret: string): string[] => [...new Set([secret, JSON.stringify(secret).slice(1, -1)])];

const withoutSecrets = (text: string, secrets: readonly string[]): string =>
  secrets.flatMap(secretSpellings).reduce((scrubbed, spelling) => scrubbed.replaceAll(spelling, ""), text);

export const scrubSecretsFromBackup = async (backupPath: string, secrets: readonly string[]): Promise<void> => {
  const text = await readOptionalText(backupPath);
  if (text === null) return;
  const scrubbed = withoutSecrets(text, secrets);
  if (scrubbed !== text) await writeSecretFileAtomic(backupPath, scrubbed);
};

const usableSecrets = (secrets: readonly (string | null | undefined)[]): string[] =>
  secrets.filter((secret): secret is string => typeof secret === "string" && secret.length > 0);

export const scrubbingBackups = async <T>(
  secrets: readonly (string | null | undefined)[],
  action: () => Promise<T>,
): Promise<T> => {
  const retired = usableSecrets(secrets);
  if (retired.length === 0) return action();
  const touched = new Set<string>();
  try {
    return await touchedBackups.run(touched, action);
  } finally {
    for (const backupPath of touched) await scrubSecretsFromBackup(backupPath, retired);
  }
};

export const retiredSecret = (previous: string, next: string): string[] => (previous === next ? [] : [previous]);
