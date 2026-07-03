import { homedir } from "node:os";
import { YoinkError } from "../errors";
import { keychainBackend } from "./keychain-backend";
import { createFileBackend, resolveCredentialsPath } from "./file-backend";
import type { CredentialBackend } from "./types";

export type { CredentialBackend } from "./types";
export { resolveCredentialsPath, createFileBackend } from "./file-backend";
export { keychainBackend } from "./keychain-backend";

export const selectBackend = (platform: NodeJS.Platform): CredentialBackend => {
  if (platform === "darwin") return keychainBackend;
  if (platform === "linux" || platform === "win32") {
    return createFileBackend(resolveCredentialsPath(process.env, homedir()));
  }
  throw new YoinkError("yoink supports macOS, Linux, and Windows.");
};

export const readClaudeCredentials = (): Promise<string | null> =>
  selectBackend(process.platform).read();

export const writeClaudeCredentials = (blob: string): Promise<void> =>
  selectBackend(process.platform).write(blob);
