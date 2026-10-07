import { rm } from "node:fs/promises";
import { join } from "node:path";
import { writeSecretFileAtomic } from "../../../shared/atomic-write";
import { YoinkError } from "../../../shared/errors";
import { parseJsonOrNull, pathExists } from "../../../shared/fs-errors";
import { isRecord } from "../../../shared/guards";
import type { SubscriptionIdentity, SubscriptionSnapshot } from "../../profiles/types";
import { createDefaultBackendDeps } from "../deps";
import { decodeJwtPayload, stringClaim } from "../shared/jwt-claims";
import { readSnapshotFiles, restoreSnapshotFiles } from "../shared/snapshot-files";
import type { SubscriptionBackend, SubscriptionBackendDeps, SubscriptionCapture } from "../types";

const GEMINI_DIRECTORY = ".gemini";
const OAUTH_CREDS_FILE = "oauth_creds.json";
const GOOGLE_ACCOUNTS_FILE = "google_accounts.json";
const ENCRYPTED_CREDENTIALS_FILE = "gemini-credentials.json";
const SNAPSHOT_PATTERNS = [OAUTH_CREDS_FILE, GOOGLE_ACCOUNTS_FILE] as const;
const FORCE_ENCRYPTED_STORAGE_ENV = "GEMINI_FORCE_ENCRYPTED_FILE_STORAGE";
const FALLBACK_LABEL = "Gemini account";

type GoogleAccounts = {
  active: string | null;
  old: string[];
};

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const parseGoogleAccounts = (text: string | undefined): GoogleAccounts | null => {
  const parsed = parseJsonOrNull(text);
  if (!isRecord(parsed)) return null;
  const old = Array.isArray(parsed.old) ? parsed.old.filter((entry): entry is string => typeof entry === "string") : [];
  return { active: nonEmptyString(parsed.active) ?? null, old };
};

export const geminiIdentityFromFiles = (files: Readonly<Record<string, string>>): SubscriptionIdentity => {
  const accounts = parseGoogleAccounts(files[GOOGLE_ACCOUNTS_FILE]);
  const creds = parseJsonOrNull(files[OAUTH_CREDS_FILE]);
  const claims = isRecord(creds) ? decodeJwtPayload(creds.id_token) : null;
  const email = accounts?.active ?? stringClaim(claims, "email");
  const accountId = stringClaim(claims, "sub");
  return {
    label: email ?? FALLBACK_LABEL,
    ...(email === undefined ? {} : { email }),
    ...(accountId === undefined ? {} : { accountId }),
  };
};

export const createGeminiBackend = (deps: SubscriptionBackendDeps): SubscriptionBackend => {
  const home = (): string => join(nonEmptyString(deps.env.GEMINI_CLI_HOME) ?? deps.homeDir, GEMINI_DIRECTORY);

  const assertFileStorage = async (): Promise<void> => {
    if (deps.env[FORCE_ENCRYPTED_STORAGE_ENV]?.trim().toLowerCase() === "true") {
      throw new YoinkError(
        `Gemini CLI is set to keep its login in encrypted storage (${FORCE_ENCRYPTED_STORAGE_ENV}=true), which yoink cannot switch. Unset it and log in again to use Gemini profiles.`,
      );
    }
    const directory = home();
    if (await pathExists(join(directory, OAUTH_CREDS_FILE))) return;
    if (await pathExists(join(directory, ENCRYPTED_CREDENTIALS_FILE))) {
      throw new YoinkError(
        `Gemini CLI keeps this login in encrypted storage (${ENCRYPTED_CREDENTIALS_FILE}), which yoink cannot switch. Only logins saved to ${OAUTH_CREDS_FILE} are supported.`,
      );
    }
  };

  const detect = async (): Promise<boolean> => pathExists(home());

  const capture = async (): Promise<SubscriptionCapture | null> => {
    await assertFileStorage();
    const files = await readSnapshotFiles(home(), SNAPSHOT_PATTERNS);
    if (files[OAUTH_CREDS_FILE] === undefined) return null;
    return { snapshot: { files }, identity: geminiIdentityFromFiles(files) };
  };

  const restore = async (snapshot: SubscriptionSnapshot): Promise<void> => {
    await assertFileStorage();
    await restoreSnapshotFiles(home(), snapshot.files, SNAPSHOT_PATTERNS);
  };

  const signOutActiveAccount = async (directory: string): Promise<void> => {
    const accountsPath = join(directory, GOOGLE_ACCOUNTS_FILE);
    if (!(await pathExists(accountsPath))) return;
    const accounts = parseGoogleAccounts(await Bun.file(accountsPath).text());
    if (!accounts?.active) return;
    const old = accounts.old.includes(accounts.active) ? accounts.old : [...accounts.old, accounts.active];
    await writeSecretFileAtomic(accountsPath, `${JSON.stringify({ active: null, old }, null, 2)}\n`);
  };

  const prepareLogin = async (): Promise<void> => {
    await assertFileStorage();
    const directory = home();
    await rm(join(directory, OAUTH_CREDS_FILE), { force: true });
    await signOutActiveAccount(directory);
  };

  return {
    tool: "gemini",
    label: "Gemini",
    home,
    detect,
    capture,
    restore,
    prepareLogin,
    loginCommand: () => ["gemini"],
    processMatcher: { names: ["gemini"], argvContains: ["@google/gemini-cli"] },
  };
};

export const geminiBackend: SubscriptionBackend = createGeminiBackend(createDefaultBackendDeps());
