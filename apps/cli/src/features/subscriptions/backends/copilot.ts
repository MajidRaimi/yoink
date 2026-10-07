import { join, resolve } from "node:path";
import { writeSecretFileAtomic } from "../../../shared/atomic-write";
import { ConfigParseError, YoinkError } from "../../../shared/errors";
import { pathExists, readOptionalText } from "../../../shared/fs-errors";
import { isRecord, readTrimmedString } from "../../../shared/guards";
import { parseJsonText } from "../../../shared/json-file";
import type { SubscriptionIdentity, SubscriptionSnapshot } from "../../profiles/types";
import { createDefaultBackendDeps } from "../deps";
import { assertDeclaredPath } from "../shared/snapshot-files";
import type { SubscriptionBackend, SubscriptionBackendDeps, SubscriptionCapture, SubscriptionEnv } from "../types";

export type CopilotUser = { host: string; login: string };

export type CopilotBackend = SubscriptionBackend & {
  postSwitchNotice: () => string | null;
};

type CopilotConfig = Record<string, unknown>;

const CONFIG_FILE = "config.json";
const IDENTITY_KEY = "identity.json";
const IDENTITY_PATTERNS = [IDENTITY_KEY] as const;
const DEFAULT_HOST = "https://github.com";
const TOKEN_ENV_VARS = ["COPILOT_GITHUB_TOKEN", "GH_TOKEN", "GITHUB_TOKEN"] as const;

const normalizeHost = (host: string): string => host.trim().replace(/\/+$/, "").toLowerCase();

const toCopilotUser = (value: unknown): CopilotUser | null => {
  if (!isRecord(value)) return null;
  const { host, login } = value;
  if (typeof host !== "string" || typeof login !== "string") return null;
  if (host.trim().length === 0 || login.trim().length === 0) return null;
  return { host, login };
};

const sameUser = (left: CopilotUser, right: CopilotUser): boolean =>
  normalizeHost(left.host) === normalizeHost(right.host) && left.login.toLowerCase() === right.login.toLowerCase();

const hostLabel = (host: string): string => {
  try {
    return new URL(host).host;
  } catch {
    return host;
  }
};

export const copilotIdentity = (user: CopilotUser): SubscriptionIdentity => {
  const isDefaultHost = normalizeHost(user.host) === normalizeHost(DEFAULT_HOST);
  return {
    label: isDefaultHost ? user.login : `${user.login}@${hostLabel(user.host)}`,
    accountId: `${normalizeHost(user.host)}/${user.login.toLowerCase()}`,
  };
};

export const copilotTokenOverrideNotice = (env: SubscriptionEnv): string | null => {
  const present = TOKEN_ENV_VARS.filter((name) => readTrimmedString(env[name]) !== undefined);
  if (present.length === 0) return null;
  const [verb, effect] = present.length === 1 ? ["is", "overrides"] : ["are", "override"];
  return `${present.join(", ")} ${verb} set and ${effect} the stored GitHub Copilot login. Unset ${present.length === 1 ? "it" : "them"} for the switch to take effect.`;
};

const parseConfig = (path: string, raw: string): CopilotConfig => {
  const parsed = parseJsonText<unknown>(path, raw);
  if (!isRecord(parsed)) throw new ConfigParseError(path, new Error("expected a JSON object"));
  return parsed;
};

const readConfig = async (path: string): Promise<CopilotConfig | null> => {
  const raw = await readOptionalText(path);
  return raw === null ? null : parseConfig(path, raw);
};

const writeConfig = async (path: string, config: CopilotConfig): Promise<void> => {
  await writeSecretFileAtomic(path, `${JSON.stringify(config, null, 2)}\n`);
};

const parseSnapshotUser = (snapshot: SubscriptionSnapshot): CopilotUser | null => {
  const keys = Object.keys(snapshot.files);
  for (const key of keys) assertDeclaredPath(key, IDENTITY_PATTERNS);
  const raw = snapshot.files[IDENTITY_KEY];
  if (raw === undefined) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new YoinkError("This GitHub Copilot profile is damaged. Save it again with `yoink save`.");
  }
  const user = toCopilotUser(parsed);
  if (!user) throw new YoinkError("This GitHub Copilot profile is damaged. Save it again with `yoink save`.");
  return user;
};

const loggedInUsers = (config: CopilotConfig): CopilotUser[] => {
  const users = config.logged_in_users;
  if (!Array.isArray(users)) return [];
  return users.map(toCopilotUser).filter((user): user is CopilotUser => user !== null);
};

export const createCopilotBackend = (deps: SubscriptionBackendDeps): CopilotBackend => {
  const home = (): string => {
    const override = readTrimmedString(deps.env.COPILOT_HOME);
    return override === undefined ? join(deps.homeDir, ".copilot") : resolve(override);
  };

  const configPath = (): string => join(home(), CONFIG_FILE);

  const capture = async (): Promise<SubscriptionCapture | null> => {
    const config = await readConfig(configPath());
    const user = config ? toCopilotUser(config.last_logged_in_user) : null;
    if (!user) return null;
    const recorded: CopilotUser = { host: user.host, login: user.login };
    return {
      snapshot: { files: { [IDENTITY_KEY]: JSON.stringify(recorded) } },
      identity: copilotIdentity(user),
    };
  };

  const clearActiveUser = async (path: string): Promise<void> => {
    const config = await readConfig(path);
    if (!config || !Object.hasOwn(config, "last_logged_in_user")) return;
    const remaining: CopilotConfig = { ...config };
    delete remaining.last_logged_in_user;
    await writeConfig(path, remaining);
  };

  const restore = async (snapshot: SubscriptionSnapshot): Promise<void> => {
    const target = parseSnapshotUser(snapshot);
    const path = configPath();
    if (!target) {
      await clearActiveUser(path);
      return;
    }
    const config = await readConfig(path);
    if (!config) {
      throw new YoinkError(
        `GitHub Copilot has no config at ${path}. Run \`copilot login\` as ${target.login} first.`,
      );
    }
    const match = loggedInUsers(config).find((user) => sameUser(user, target));
    if (!match) {
      throw new YoinkError(
        `${copilotIdentity(target).label} is not logged in to GitHub Copilot on this machine. Run \`copilot login\` as that user first.`,
      );
    }
    await writeConfig(path, { ...config, last_logged_in_user: { host: match.host, login: match.login } });
  };

  return {
    tool: "copilot",
    label: "GitHub Copilot",
    home,
    detect: () => pathExists(home()),
    capture,
    restore,
    prepareLogin: async () => {},
    loginCommand: () => ["copilot", "login"],
    processMatcher: { names: ["copilot"] },
    postSwitchNotice: () => copilotTokenOverrideNotice(deps.env),
  };
};

export const copilotBackend: CopilotBackend = createCopilotBackend(createDefaultBackendDeps());
