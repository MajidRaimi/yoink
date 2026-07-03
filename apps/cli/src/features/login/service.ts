import { readClaudeCredentials } from "../../shared/keychain";
import { readOauthAccount } from "../../shared/claude-config";
import { YoinkError } from "../../shared/errors";

export type LiveLogin = {
  keychain: string | null;
  email: string | null;
};

export const captureLiveLogin = async (): Promise<LiveLogin> => {
  const keychain = await readClaudeCredentials();
  const account = keychain ? await readOauthAccount() : null;
  return { keychain, email: account?.emailAddress ?? null };
};

export const defaultNameFromEmail = (email: string | null): string => {
  const local = email?.split("@")[0];
  return local && local.length > 0 ? local : "account";
};

export const runClaudeLogin = async (): Promise<void> => {
  const proc = Bun.spawn(["claude", "auth", "login", "--claudeai"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new YoinkError("`claude auth login` did not complete successfully.");
  }
};
