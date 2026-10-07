import { chmod, copyFile } from "node:fs/promises";

export const BACKUP_SUFFIX = ".yoink.bak";

const BACKUP_FILE_MODE = 0o600;

export const ensureBackup = async (path: string): Promise<void> => {
  const source = Bun.file(path);
  if (!(await source.exists())) return;
  const backupPath = `${path}${BACKUP_SUFFIX}`;
  if (await Bun.file(backupPath).exists()) return;
  await copyFile(path, backupPath);
  if (process.platform !== "win32") await chmod(backupPath, BACKUP_FILE_MODE);
};
