import { createHash } from "node:crypto";
import { realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { SubscriptionIdentity, SubscriptionSnapshot } from "../../profiles/types";
import {
  CODEX_AUTH_FILE,
  codexConfigPath,
  codexOverridingModelProvider,
  codexProviderOverrideNotice,
} from "../../../shared/codex-config";
import { parseJsonText } from "../../../shared/json-file";
import { ConfigParseError, YoinkError } from "../../../shared/errors";
import { pathExists, readOptionalText } from "../../../shared/fs-errors";
import { isRecord } from "../../../shared/guards";
import { parseToml } from "../../../shared/toml";
import { createDefaultBackendDeps } from "../deps";
import { decodeJwtPayload, stringClaim, type JwtClaims } from "../shared/jwt-claims";
import { isKeyringSupported } from "../shared/keyring";
import { assertDeclaredPath, readSnapshotFiles, restoreSnapshotFiles } from "../shared/snapshot-files";
import type { SubscriptionBackend, SubscriptionBackendDeps, SubscriptionCapture } from "../types";

export const CODEX_KEYRING_SERVICE = "Codex Auth";

const AUTH_PATTERNS = [CODEX_AUTH_FILE] as const;
const OPENAI_AUTH_CLAIM = "https://api.openai.com/auth";
const STORE_KEY_HASH_LENGTH = 16;
const API_KEY_FINGERPRINT_LENGTH = 16;
const API_KEY_ACCOUNT_PREFIX = "apikey:";
const CODEX_LABEL = "ChatGPT (Codex)";

export type CodexStorageMode = "file" | "keyring" | "auto";

type CodexStorage = { kind: "file" } | { kind: "keyring"; account: string };

const STORAGE_MODES: readonly CodexStorageMode[] = ["file", "keyring", "auto"];

const isStorageMode = (value: unknown): value is CodexStorageMode =>
  typeof value === "string" && (STORAGE_MODES as readonly string[]).includes(value);

export const parseCodexStorageMode = (configText: string | null, configPath: string): CodexStorageMode => {
  if (configText === null) return "file";
  let parsed: unknown;
  try {
    parsed = parseToml(configText);
  } catch {
    throw new ConfigParseError(configPath, new Error("TOML syntax error"));
  }
  const mode = isRecord(parsed) ? parsed.cli_auth_credentials_store : undefined;
  if (mode === undefined) return "file";
  if (isStorageMode(mode)) return mode;
  throw new YoinkError(
    `${configPath} sets cli_auth_credentials_store = ${JSON.stringify(mode)}, which yoink cannot switch. Use "file" or "keyring".`,
  );
};

export const codexKeyringAccount = async (home: string): Promise<string> => {
  let canonical: string;
  try {
    canonical = await realpath(home);
  } catch {
    canonical = home;
  }
  const digest = createHash("sha256").update(canonical).digest("hex");
  return `cli|${digest.slice(0, STORE_KEY_HASH_LENGTH)}`;
};

const parseAuthPayload = (payload: string, source: string): Record<string, unknown> => {
  const parsed = parseJsonText<unknown>(source, payload);
  if (!isRecord(parsed)) throw new ConfigParseError(source, new Error("expected a JSON object"));
  return parsed;
};

const idTokenClaims = (auth: Record<string, unknown>): JwtClaims | null => {
  const tokens = auth.tokens;
  return isRecord(tokens) ? decodeJwtPayload(tokens.id_token) : null;
};

const tokenAccountId = (auth: Record<string, unknown>): string | undefined => {
  const tokens = auth.tokens;
  const accountId = isRecord(tokens) ? tokens.account_id : undefined;
  return typeof accountId === "string" && accountId.length > 0 ? accountId : undefined;
};

const apiKeyOf = (auth: Record<string, unknown>): string | undefined =>
  typeof auth.OPENAI_API_KEY === "string" && auth.OPENAI_API_KEY.length > 0 ? auth.OPENAI_API_KEY : undefined;

const apiKeyFingerprint = (apiKey: string): string =>
  `${API_KEY_ACCOUNT_PREFIX}${createHash("sha256").update(apiKey).digest("hex").slice(0, API_KEY_FINGERPRINT_LENGTH)}`;

const fallbackLabel = (auth: Record<string, unknown>): string =>
  apiKeyOf(auth) === undefined ? "ChatGPT" : "OpenAI API key";

export const codexIdentityFromAuth = (auth: Record<string, unknown>): SubscriptionIdentity => {
  const claims = idTokenClaims(auth);
  const email = stringClaim(claims, "email");
  const plan = stringClaim(claims, OPENAI_AUTH_CLAIM, "chatgpt_plan_type");
  const tokenAccount = stringClaim(claims, OPENAI_AUTH_CLAIM, "chatgpt_account_id") ?? tokenAccountId(auth);
  const apiKey = email === undefined && tokenAccount === undefined ? apiKeyOf(auth) : undefined;
  const accountId = tokenAccount ?? (apiKey === undefined ? undefined : apiKeyFingerprint(apiKey));
  return {
    label: email ?? tokenAccount ?? fallbackLabel(auth),
    ...(email !== undefined && { email }),
    ...(plan !== undefined && { plan }),
    ...(accountId !== undefined && { accountId }),
  };
};

const keyringStorageDescription = (mode: CodexStorageMode): string =>
  mode === "auto"
    ? "Codex is set to auto storage, which can keep this login in the system keyring"
    : "Codex keeps this login in the system keyring";

const keyringRefusal = (mode: CodexStorageMode, platform: NodeJS.Platform, configPath: string): YoinkError =>
  new YoinkError(
    `${keyringStorageDescription(mode)}, which yoink can only switch on macOS (this is ${platform}). ` +
      `Set cli_auth_credentials_store = "file" in ${configPath}, run \`codex login\` again, then retry.`,
  );

const snapshotPayload = (snapshot: SubscriptionSnapshot, account: string | null): string | null => {
  for (const relativePath of Object.keys(snapshot.files)) assertDeclaredPath(relativePath, AUTH_PATTERNS);
  const filePayload = snapshot.files[CODEX_AUTH_FILE];
  if (filePayload !== undefined) return filePayload;
  const secrets = Object.entries(snapshot.keyring ?? {});
  const own = account === null ? undefined : secrets.find(([key]) => key === account);
  if (own) return own[1];
  if (secrets.length > 1) throw new YoinkError(`This ${CODEX_LABEL} profile holds more than one keyring login. Save it again.`);
  return secrets[0]?.[1] ?? null;
};

export const createCodexBackend = (deps: SubscriptionBackendDeps): SubscriptionBackend => {
  const home = (): string => {
    const configured = deps.env.CODEX_HOME;
    return configured !== undefined && configured.length > 0 ? resolve(configured) : join(deps.homeDir, ".codex");
  };

  const configPath = (): string => codexConfigPath(home());
  const authPath = (): string => join(home(), CODEX_AUTH_FILE);

  const assertKeyringSupported = (mode: CodexStorageMode): void => {
    if (!isKeyringSupported(deps.platform)) throw keyringRefusal(mode, deps.platform, configPath());
  };

  const storageMode = async (): Promise<CodexStorageMode> =>
    parseCodexStorageMode(await readOptionalText(configPath()), configPath());

  const resolveStorage = async (): Promise<CodexStorage> => {
    const mode = await storageMode();
    if (mode === "file") return { kind: "file" };
    assertKeyringSupported(mode);
    if (mode === "auto" && (await pathExists(authPath(), "file"))) return { kind: "file" };
    return { kind: "keyring", account: await codexKeyringAccount(home()) };
  };

  const captureFile = async (): Promise<SubscriptionCapture | null> => {
    const files = await readSnapshotFiles(home(), AUTH_PATTERNS);
    const payload = files[CODEX_AUTH_FILE];
    if (payload === undefined) return null;
    return { snapshot: { files }, identity: codexIdentityFromAuth(parseAuthPayload(payload, authPath())) };
  };

  const captureKeyring = async (account: string): Promise<SubscriptionCapture | null> => {
    const secret = await deps.keyring.read(CODEX_KEYRING_SERVICE, account);
    if (secret === null) return null;
    const identity = codexIdentityFromAuth(parseAuthPayload(secret, `the "${CODEX_KEYRING_SERVICE}" keyring item`));
    return { snapshot: { files: {}, keyring: { [account]: secret } }, identity };
  };

  const capture = async (): Promise<SubscriptionCapture | null> => {
    const storage = await resolveStorage();
    return storage.kind === "file" ? captureFile() : captureKeyring(storage.account);
  };

  const restore = async (snapshot: SubscriptionSnapshot): Promise<void> => {
    const storage = await resolveStorage();
    const account = storage.kind === "keyring" ? storage.account : null;
    const payload = snapshotPayload(snapshot, account);
    if (payload !== null) parseAuthPayload(payload, `the saved ${CODEX_LABEL} login`);
    if (storage.kind === "file") {
      await restoreSnapshotFiles(home(), payload === null ? {} : { [CODEX_AUTH_FILE]: payload }, AUTH_PATTERNS);
      return;
    }
    if (payload === null) await deps.keyring.remove(CODEX_KEYRING_SERVICE, storage.account);
    else await deps.keyring.write(CODEX_KEYRING_SERVICE, storage.account, payload);
  };

  const prepareLogin = async (): Promise<void> => {
    const mode = await storageMode();
    if (mode !== "file") assertKeyringSupported(mode);
  };

  const postSwitchNotice = (): string | null => {
    const provider = codexOverridingModelProvider(home());
    return provider === null ? null : codexProviderOverrideNotice(home(), provider);
  };

  return {
    tool: "codex",
    label: CODEX_LABEL,
    home,
    detect: () => pathExists(home(), "directory"),
    capture,
    restore,
    prepareLogin,
    loginCommand: () => ["codex", "login"],
    processMatcher: { names: ["codex"], argvContains: ["@openai/codex"] },
    postSwitchNotice,
  };
};

export const codexBackend: SubscriptionBackend = createCodexBackend(createDefaultBackendDeps());
