import { CLAUDE_CONFIG_PATH } from "./paths";
import { YoinkError } from "./errors";
import { writeFileAtomic } from "./atomic-write";
import { parseJsonText, readJsonFile, readTextFile } from "./json-file";

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
  const config = await readJsonFile<{ oauthAccount?: OauthAccount }>(CLAUDE_CONFIG_PATH);
  return config?.oauthAccount ?? null;
};

export const writeOauthAccount = async (account: OauthAccount): Promise<void> => {
  const raw = await readTextFile(CLAUDE_CONFIG_PATH);
  if (raw === null) {
    throw new YoinkError(`${CLAUDE_CONFIG_PATH} not found. Is Claude Code installed and logged in?`);
  }
  const config = parseJsonText<Record<string, unknown>>(CLAUDE_CONFIG_PATH, raw);
  config.oauthAccount = account;
  await writeFileAtomic(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, detectIndent(raw)));
};
