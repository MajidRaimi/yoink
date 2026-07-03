import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { writeFileAtomic } from "../atomic-write";
import type { CredentialBackend } from "./types";

export const resolveCredentialsPath = (
  env: Record<string, string | undefined>,
  home: string,
): string =>
  env.CLAUDE_CONFIG_DIR
    ? join(env.CLAUDE_CONFIG_DIR, ".credentials.json")
    : join(home, ".claude", ".credentials.json");

export const createFileBackend = (path: string): CredentialBackend => ({
  read: async () => {
    let content: string;
    try {
      content = await readFile(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  },
  write: async (blob) => {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFileAtomic(path, blob, 0o600);
  },
});
