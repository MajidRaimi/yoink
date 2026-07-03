import { readClaudeCredentials } from "../../shared/credentials";
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

export const buildClaudeLoginCommand = (platform: NodeJS.Platform): string[] =>
  platform === "win32"
    ? ["cmd", "/c", "claude", "auth", "login", "--claudeai"]
    : ["claude", "auth", "login", "--claudeai"];

export const runClaudeLogin = async (): Promise<void> => {
  let proc: ReturnType<typeof Bun.spawn>;
  try {
    proc = Bun.spawn(buildClaudeLoginCommand(process.platform), {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
  } catch {
    throw new YoinkError("Claude Code CLI not found on PATH. Install Claude Code first.");
  }
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new YoinkError("`claude auth login` did not complete successfully.");
  }
};
