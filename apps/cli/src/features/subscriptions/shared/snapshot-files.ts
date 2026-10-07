import { mkdir, rm } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, sep } from "node:path";
import { writeSecretFileAtomic } from "../../../shared/atomic-write";
import { YoinkError } from "../../../shared/errors";
import { isMissingFileError, readOptionalText } from "../../../shared/fs-errors";

const PRIVATE_DIRECTORY_MODE = 0o700;

const toPosix = (path: string): string => path.split(sep).join("/");

const isContained = (relativePath: string): boolean => {
  if (relativePath.length === 0 || isAbsolute(relativePath)) return false;
  const normalized = toPosix(normalize(relativePath));
  return normalized === relativePath && !normalized.split("/").includes("..");
};

const matchesDeclared = (relativePath: string, patterns: readonly string[]): boolean =>
  patterns.some((pattern) => new Bun.Glob(pattern).match(relativePath));

export const assertDeclaredPath = (relativePath: string, patterns: readonly string[]): void => {
  if (isContained(relativePath) && matchesDeclared(relativePath, patterns)) return;
  throw new YoinkError(`Refusing to touch "${relativePath}": it is outside the files this login uses.`);
};

const scanPattern = async (home: string, pattern: string): Promise<string[]> => {
  try {
    return await Array.fromAsync(
      new Bun.Glob(pattern).scan({ cwd: home, onlyFiles: true, dot: true, followSymlinks: true }),
    );
  } catch (error) {
    if (isMissingFileError(error)) return [];
    throw error;
  }
};

export const listSnapshotFiles = async (home: string, patterns: readonly string[]): Promise<string[]> => {
  const found = await Promise.all(patterns.map((pattern) => scanPattern(home, pattern)));
  const unique = new Set(found.flat().map(toPosix).filter((path) => isContained(path)));
  return [...unique].sort();
};

export const readSnapshotFiles = async (
  home: string,
  patterns: readonly string[],
): Promise<Record<string, string>> => {
  const files: Record<string, string> = {};
  for (const relativePath of await listSnapshotFiles(home, patterns)) {
    const contents = await readOptionalText(join(home, relativePath));
    if (contents !== null) files[relativePath] = contents;
  }
  return files;
};

const writeSnapshotFile = async (home: string, relativePath: string, contents: string): Promise<void> => {
  const target = join(home, relativePath);
  await mkdir(dirname(target), { recursive: true, mode: PRIVATE_DIRECTORY_MODE });
  await writeSecretFileAtomic(target, contents);
};

export const restoreSnapshotFiles = async (
  home: string,
  files: Readonly<Record<string, string>>,
  patterns: readonly string[],
): Promise<void> => {
  const entries = Object.entries(files);
  for (const [relativePath] of entries) assertDeclaredPath(relativePath, patterns);
  for (const [relativePath, contents] of entries) await writeSnapshotFile(home, relativePath, contents);
  const stale = (await listSnapshotFiles(home, patterns)).filter((relativePath) => !Object.hasOwn(files, relativePath));
  for (const relativePath of stale) await rm(join(home, relativePath), { force: true });
};
