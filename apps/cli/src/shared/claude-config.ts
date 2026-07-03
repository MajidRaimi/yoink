import { CLAUDE_CONFIG_PATH } from "./paths";
import { YoinkError } from "./errors";
import { writeFileAtomic } from "./atomic-write";

export type OauthAccount = {
  emailAddress?: string;
  organizationName?: string;
  displayName?: string;
  [key: string]: unknown;
};

const detectIndent = (raw: string): number | undefined => {
  const match = raw.match(/^\{\r?\n([ \t]+)/);
  if (!match?.[1]) return undefined;
  return match[1].replace(/\t/g, "  ").length;
};

export const readOauthAccount = async (): Promise<OauthAccount | null> => {
  const file = Bun.file(CLAUDE_CONFIG_PATH);
  if (!(await file.exists())) return null;
  const config = (await file.json()) as { oauthAccount?: OauthAccount };
  return config.oauthAccount ?? null;
};

export const writeOauthAccount = async (account: OauthAccount): Promise<void> => {
  const file = Bun.file(CLAUDE_CONFIG_PATH);
  if (!(await file.exists())) {
    throw new YoinkError(`${CLAUDE_CONFIG_PATH} not found. Is Claude Code installed and logged in?`);
  }
  const raw = await file.text();
  const config = JSON.parse(raw) as Record<string, unknown>;
  config.oauthAccount = account;
  await writeFileAtomic(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, detectIndent(raw)));
};
