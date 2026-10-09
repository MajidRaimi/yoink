import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const MARKERS: readonly string[] = [join("docs", "README.md"), join("apps", "web", "package.json")];

const isRepoRoot = (dir: string): boolean => MARKERS.every((marker) => existsSync(join(dir, marker)));

const findRepoRoot = (start: string): string | null => {
  let current = resolve(start);
  for (;;) {
    if (isRepoRoot(current)) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

let cachedRoot: string | null = null;

export const repoRoot = (): string => {
  if (cachedRoot !== null) return cachedRoot;
  const found = findRepoRoot(process.cwd());
  if (found === null) throw new Error(`Could not find the repo docs/ folder from ${process.cwd()}`);
  cachedRoot = found;
  return found;
};

export const docsDir = (): string => join(repoRoot(), "docs");
