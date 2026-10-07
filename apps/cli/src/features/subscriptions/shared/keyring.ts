import {
  KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE,
  assertKeychainWriteSucceeded,
  planKeychainWrite,
} from "../../../shared/credentials/keychain-command";
import { YoinkError } from "../../../shared/errors";
import type { KeyringAdapter } from "../types";

export type CommandResult = { exitCode: number; stdout: string; stderr: string };

export type CommandRunner = (argv: string[], stdin?: string) => Promise<CommandResult>;

export class KeyringUnsupportedError extends YoinkError {
  constructor(platform: NodeJS.Platform) {
    super(`yoink can only switch keyring-stored logins on macOS (this is ${platform}). Switch the tool to file storage first.`);
    this.name = "KeyringUnsupportedError";
  }
}

export const runSecurityCommand: CommandRunner = async (argv, stdin) => {
  const proc = Bun.spawn(argv, { stdin: stdin === undefined ? "ignore" : "pipe", stdout: "pipe", stderr: "pipe" });
  if (stdin !== undefined && proc.stdin) {
    proc.stdin.write(stdin);
    await proc.stdin.end();
  }
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { exitCode, stdout, stderr };
};

const stripTrailingNewline = (value: string): string => value.replace(/\r?\n$/, "");

export const createMacKeyring = (run: CommandRunner = runSecurityCommand): KeyringAdapter => ({
  read: async (service, account) => {
    const result = await run(["security", "find-generic-password", "-w", "-s", service, "-a", account]);
    if (result.exitCode === KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE) return null;
    if (result.exitCode !== 0) {
      throw new YoinkError(
        `Could not read "${service}" from Keychain (security exited with ${result.exitCode}). Unlock the Keychain and allow access, then try again.`,
      );
    }
    const secret = stripTrailingNewline(result.stdout);
    return secret.length > 0 ? secret : null;
  },
  write: async (service, account, secret) => {
    const plan = planKeychainWrite(service, account, secret);
    const result = await run(plan.argv, plan.stdin);
    assertKeychainWriteSucceeded(result.exitCode, result.stderr);
  },
  remove: async (service, account) => {
    const result = await run(["security", "delete-generic-password", "-s", service, "-a", account]);
    if (result.exitCode === 0 || result.exitCode === KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE) return;
    throw new YoinkError(`Could not remove "${service}" from Keychain (security exited with ${result.exitCode}).`);
  },
});

export const createUnsupportedKeyring = (platform: NodeJS.Platform): KeyringAdapter => {
  const refuse = async (): Promise<never> => {
    throw new KeyringUnsupportedError(platform);
  };
  return { read: refuse, write: refuse, remove: refuse };
};

export const isKeyringSupported = (platform: NodeJS.Platform): boolean => platform === "darwin";

export const createKeyring = (platform: NodeJS.Platform, run: CommandRunner = runSecurityCommand): KeyringAdapter =>
  isKeyringSupported(platform) ? createMacKeyring(run) : createUnsupportedKeyring(platform);
