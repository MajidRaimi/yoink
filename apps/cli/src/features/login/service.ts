import { readClaudeCredentials } from "../../shared/credentials";
import { readOauthAccount } from "../../shared/claude-config";
import { runInteractiveCommand, wrapForPlatform } from "../../shared/interactive-command";

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

const CLAUDE_LOGIN_ARGV = ["claude", "auth", "login", "--claudeai"] as const;

export const buildClaudeLoginCommand = (platform: NodeJS.Platform): string[] =>
  wrapForPlatform(CLAUDE_LOGIN_ARGV, platform);

export const runClaudeLogin = async (): Promise<void> =>
  runInteractiveCommand(CLAUDE_LOGIN_ARGV, {
    notFound: "Claude Code CLI not found on PATH. Install Claude Code first.",
    failed: "`claude auth login` did not complete successfully.",
  });
