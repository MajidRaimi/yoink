import { appendFile, mkdir, realpath } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { readOptionalText } from "./fs-errors";

type GitResult = { ok: boolean; stdout: string };

const runGit = async (args: string[]): Promise<GitResult> => {
  try {
    const proc = Bun.spawn(["git", ...args], { stdout: "pipe", stderr: "ignore" });
    const [stdout, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
    return { ok: code === 0, stdout: stdout.trim() };
  } catch {
    return { ok: false, stdout: "" };
  }
};

const resolvedPath = async (filePath: string): Promise<string> => {
  try {
    return await realpath(filePath);
  } catch {
    return filePath;
  }
};

export const isTrackedAndNotIgnored = async (filePath: string): Promise<boolean> => {
  const target = await resolvedPath(filePath);
  const dir = dirname(target);
  const name = basename(target);
  const tracked = await runGit(["-C", dir, "ls-files", "--error-unmatch", "--", name]);
  if (!tracked.ok) return false;
  const ignored = await runGit(["-C", dir, "check-ignore", "-q", "--", name]);
  return !ignored.ok;
};

const repoExcludePath = async (dir: string): Promise<string | null> => {
  const inside = await runGit(["-C", dir, "rev-parse", "--is-inside-work-tree"]);
  if (!inside.ok || inside.stdout !== "true") return null;
  const excludePath = await runGit(["-C", dir, "rev-parse", "--git-path", "info/exclude"]);
  return excludePath.ok && excludePath.stdout.length > 0 ? resolve(dir, excludePath.stdout) : null;
};

const hasLine = (text: string, line: string): boolean => text.split(/\r?\n/).some((entry) => entry.trim() === line);

export const excludeFromEnclosingRepo = async (filePath: string, pattern: string): Promise<void> => {
  const dir = await resolvedPath(dirname(filePath));
  const excludePath = await repoExcludePath(dir);
  if (excludePath === null) return;
  const current = (await readOptionalText(excludePath)) ?? "";
  if (hasLine(current, pattern)) return;
  const separator = current.length === 0 || current.endsWith("\n") ? "" : "\n";
  await mkdir(dirname(excludePath), { recursive: true });
  await appendFile(excludePath, `${separator}${pattern}\n`);
};
