import { userInfo } from "node:os";
import { YoinkError } from "../errors";
import type { CredentialBackend } from "./types";

const SERVICE = "Claude Code-credentials";

const account = () => userInfo().username;

const read = async (): Promise<string | null> => {
  const proc = Bun.spawn(
    ["security", "find-generic-password", "-w", "-s", SERVICE, "-a", account()],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [output, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) return null;
  const trimmed = output.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const write = async (blob: string): Promise<void> => {
  const proc = Bun.spawn(
    ["security", "add-generic-password", "-U", "-s", SERVICE, "-a", account(), "-w", blob],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [errorOutput, exitCode] = await Promise.all([
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new YoinkError(`Failed to write credentials to Keychain: ${errorOutput.trim()}`);
  }
};

export const keychainBackend: CredentialBackend = { read, write };
