import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isRecord, type UnknownRecord } from "./guards";

export const CODEX_CONFIG_FILE = "config.toml";
export const CODEX_AUTH_FILE = "auth.json";

const BUILT_IN_OPENAI_PROVIDER = "openai";
const MODEL_PROVIDER_KEY = "model_provider";

const readTextSync = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

const parseRecordSync = (path: string, parse: (text: string) => unknown): UnknownRecord | null => {
  const text = readTextSync(path);
  if (text === null) return null;
  try {
    const parsed = parse(text);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const codexConfigPath = (codexHome: string): string => join(codexHome, CODEX_CONFIG_FILE);

export const codexOverridingModelProvider = (codexHome: string): string | null => {
  const config = parseRecordSync(codexConfigPath(codexHome), (text) => Bun.TOML.parse(text));
  const provider = config?.[MODEL_PROVIDER_KEY];
  return typeof provider === "string" && provider.length > 0 && provider !== BUILT_IN_OPENAI_PROVIDER ? provider : null;
};

export const hasCodexChatGptLogin = (codexHome: string): boolean => {
  const auth = parseRecordSync(join(codexHome, CODEX_AUTH_FILE), (text) => JSON.parse(text));
  return isRecord(auth?.tokens);
};

export const codexProviderOverrideNotice = (codexHome: string, provider: string): string =>
  `Codex is set to model_provider = "${provider}" in ${codexConfigPath(codexHome)}, which overrides the ChatGPT login. ` +
  `Run \`yoink disconnect ${provider} --from codex\` or remove model_provider from that file to use ChatGPT.`;
