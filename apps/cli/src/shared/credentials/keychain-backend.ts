import { userInfo } from "node:os";
import {
  assertKeychainWriteSucceeded,
  interpretKeychainRead,
  planKeychainWrite,
  type KeychainWritePlan,
} from "./keychain-command";
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
    new Response(proc.stderr).text(),
  ]);
  return interpretKeychainRead(exitCode, output);
};

const spawnWrite = async (plan: KeychainWritePlan): Promise<{ errorOutput: string; exitCode: number }> => {
  const proc = Bun.spawn(plan.argv, {
    stdin: plan.kind === "interactive" ? "pipe" : "ignore",
    stdout: "ignore",
    stderr: "pipe",
  });
  if (plan.kind === "interactive" && proc.stdin) {
    proc.stdin.write(plan.stdin);
    await proc.stdin.end();
  }
  const [errorOutput, exitCode] = await Promise.all([
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { errorOutput, exitCode };
};

const write = async (blob: string): Promise<void> => {
  const { errorOutput, exitCode } = await spawnWrite(planKeychainWrite(SERVICE, account(), blob));
  assertKeychainWriteSucceeded(exitCode, errorOutput);
};

export const keychainBackend: CredentialBackend = { read, write };
