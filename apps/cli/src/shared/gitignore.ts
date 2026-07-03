import { join } from "node:path";

const LOCAL_SETTINGS_ENTRY = ".claude/settings.local.json";
const IGNORE_MATCHES = new Set([
  ".claude/",
  "/.claude/",
  ".claude/settings.local.json",
  "/.claude/settings.local.json",
]);

export const isSettingsIgnored = async (cwd: string): Promise<boolean> => {
  const file = Bun.file(join(cwd, ".gitignore"));
  if (!(await file.exists())) return false;
  const text = await file.text();
  return text
    .split("\n")
    .map((line) => line.trim())
    .some((line) => IGNORE_MATCHES.has(line));
};

export const appendSettingsIgnore = async (cwd: string): Promise<void> => {
  const path = join(cwd, ".gitignore");
  const file = Bun.file(path);
  const existing = (await file.exists()) ? await file.text() : "";
  const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  await Bun.write(path, `${existing}${separator}${LOCAL_SETTINGS_ENTRY}\n`);
};
