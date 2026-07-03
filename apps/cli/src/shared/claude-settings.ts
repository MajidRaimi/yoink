import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { writeFileAtomic } from "./atomic-write";
import { claudeConfigDir } from "./paths";

export const GLOBAL_SETTINGS_PATH = join(claudeConfigDir(), "settings.json");

export const localSettingsPath = (cwd: string): string => join(cwd, ".claude", "settings.local.json");

export type ExternalEnvInput = {
  baseUrl: string;
  token: string;
  model: string;
};

const MANAGED_ENV_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
] as const;

type Settings = { env?: Record<string, string> } & Record<string, unknown>;

const readSettings = async (path: string): Promise<Settings> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return {};
  return (await file.json()) as Settings;
};

const managedEnv = (input: ExternalEnvInput): Record<string, string> => ({
  ANTHROPIC_BASE_URL: input.baseUrl,
  ANTHROPIC_AUTH_TOKEN: input.token,
  ANTHROPIC_MODEL: input.model,
  ANTHROPIC_DEFAULT_OPUS_MODEL: input.model,
  ANTHROPIC_DEFAULT_SONNET_MODEL: input.model,
  ANTHROPIC_DEFAULT_HAIKU_MODEL: input.model,
  CLAUDE_CODE_SUBAGENT_MODEL: input.model,
});

export const readExternalEnv = async (path: string): Promise<Record<string, string> | null> => {
  const settings = await readSettings(path);
  return settings.env ?? null;
};

export const applyExternalEnv = async (path: string, input: ExternalEnvInput): Promise<void> => {
  const settings = await readSettings(path);
  settings.env = { ...(settings.env ?? {}), ...managedEnv(input) };
  await mkdir(dirname(path), { recursive: true });
  await writeFileAtomic(path, `${JSON.stringify(settings, null, 2)}\n`);
};

export const clearExternalEnv = async (path: string): Promise<void> => {
  const file = Bun.file(path);
  if (!(await file.exists())) return;
  const settings = (await file.json()) as Settings;
  if (!settings.env) return;
  for (const key of MANAGED_ENV_KEYS) delete settings.env[key];
  if (Object.keys(settings.env).length === 0) delete settings.env;
  await writeFileAtomic(path, `${JSON.stringify(settings, null, 2)}\n`);
};
