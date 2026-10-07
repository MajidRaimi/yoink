import { YoinkError } from "../errors";

export const KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE = 44;
export const SECURITY_INTERACTIVE_LINE_LIMIT = 4000;

const LINE_BREAKS = /[\r\n]/;
const SECURITY_ESCAPABLE = /[\\"]/g;

export type KeychainWritePlan = { argv: string[]; stdin: string };

export class KeychainSecretTooLargeError extends YoinkError {
  constructor(service: string, commandBytes: number) {
    super(
      `The "${service}" Keychain entry is too large to save safely (${commandBytes} bytes, the limit is ${SECURITY_INTERACTIVE_LINE_LIMIT}). yoink will not pass credentials on the command line where other processes can read them. Switch the tool to file-based credential storage (for Codex, set cli_auth_credentials_store = "file" in config.toml) and try again.`,
    );
    this.name = "KeychainSecretTooLargeError";
  }
}

const quoteForSecurity = (value: string): string => {
  if (LINE_BREAKS.test(value)) {
    throw new YoinkError("Keychain values cannot contain line breaks.");
  }
  return `"${value.replace(SECURITY_ESCAPABLE, (character) => `\\${character}`)}"`;
};

export const toHex = (value: string): string => Buffer.from(value, "utf8").toString("hex");

export const buildKeychainAddCommand = (service: string, account: string, blob: string): string =>
  `add-generic-password -U -a ${quoteForSecurity(account)} -s ${quoteForSecurity(service)} -X ${toHex(blob)}\n`;

export const planKeychainWrite = (service: string, account: string, blob: string): KeychainWritePlan => {
  const command = buildKeychainAddCommand(service, account, blob);
  const commandBytes = Buffer.byteLength(command, "utf8");
  if (commandBytes > SECURITY_INTERACTIVE_LINE_LIMIT) {
    throw new KeychainSecretTooLargeError(service, commandBytes);
  }
  return { argv: ["security", "-i"], stdin: command };
};

export const interpretKeychainRead = (exitCode: number, output: string): string | null => {
  if (exitCode === KEYCHAIN_ITEM_NOT_FOUND_EXIT_CODE) return null;
  if (exitCode !== 0) {
    throw new YoinkError(
      `Could not read Claude Code credentials from Keychain (security exited with ${exitCode}). Unlock the Keychain and allow access, then try again.`,
    );
  }
  const trimmed = output.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const assertKeychainWriteSucceeded = (exitCode: number, errorOutput: string): void => {
  if (exitCode === 0 && errorOutput.trim().length === 0) return;
  throw new YoinkError(`Failed to write credentials to Keychain (security exited with ${exitCode}).`);
};
