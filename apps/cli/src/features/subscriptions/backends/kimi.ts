import { readdir, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { errorMessage, YoinkError } from "../../../shared/errors";
import { parseJsonOrNull, pathExists } from "../../../shared/fs-errors";
import { isRecord } from "../../../shared/guards";
import type { SubscriptionIdentity, SubscriptionSnapshot } from "../../profiles/types";
import { createDefaultBackendDeps } from "../deps";
import { decodeJwtPayload, stringClaim } from "../shared/jwt-claims";
import { readSnapshotFiles, restoreSnapshotFiles } from "../shared/snapshot-files";
import type { SubscriptionBackend, SubscriptionBackendDeps, SubscriptionCapture } from "../types";

export type KimiBackend = SubscriptionBackend & {
  restoreAfterFailedLogin: () => Promise<boolean>;
  finishLogin: () => Promise<void>;
};

export type KimiBackendOptions = {
  now?: () => Date;
};

const LABEL = "Kimi Code";
const CREDENTIALS_DIRECTORY = "credentials";
const CREDENTIAL_PATTERNS = [`${CREDENTIALS_DIRECTORY}/*.json`] as const;
const PREFERRED_CREDENTIAL = `${CREDENTIALS_DIRECTORY}/kimi-code.json`;
const SET_ASIDE_PREFIX = `${CREDENTIALS_DIRECTORY}.yoink-`;
const MAX_SET_ASIDE_ATTEMPTS = 100;

const accessTokenOf = (contents: string): unknown => {
  const parsed = parseJsonOrNull(contents);
  return isRecord(parsed) ? parsed.access_token : undefined;
};

const identityFromFile = (contents: string): SubscriptionIdentity | null => {
  const claims = decodeJwtPayload(accessTokenOf(contents));
  const userId = stringClaim(claims, "user_id");
  if (userId === undefined) return null;
  const region = stringClaim(claims, "region");
  return { label: `kimi:${userId}`, accountId: userId, ...(region === undefined ? {} : { plan: region }) };
};

const orderedCredentialPaths = (files: Readonly<Record<string, string>>): string[] =>
  Object.keys(files).sort((left, right) => {
    if (left === PREFERRED_CREDENTIAL) return -1;
    if (right === PREFERRED_CREDENTIAL) return 1;
    return left.localeCompare(right);
  });

export const kimiIdentityFromFiles = (files: Readonly<Record<string, string>>): SubscriptionIdentity | null => {
  for (const path of orderedCredentialPaths(files)) {
    const contents = files[path];
    const identity = contents === undefined ? null : identityFromFile(contents);
    if (identity) return identity;
  }
  return null;
};

const isCredentialFile = (name: string): boolean => name.endsWith(".json");

const timestampSuffix = (date: Date): string => date.toISOString().replace(/[-:.]/g, "");

export const createKimiBackend = (deps: SubscriptionBackendDeps, options: KimiBackendOptions = {}): KimiBackend => {
  const now = options.now ?? ((): Date => new Date());
  let setAsidePath: string | null = null;

  const home = (): string => {
    const override = deps.env.KIMI_CODE_HOME;
    return override !== undefined && override.length > 0 ? override : join(deps.homeDir, ".kimi-code");
  };

  const credentialsPath = (): string => join(home(), CREDENTIALS_DIRECTORY);

  const detect = async (): Promise<boolean> => pathExists(home(), "directory");

  const capture = async (): Promise<SubscriptionCapture | null> => {
    const files = await readSnapshotFiles(home(), CREDENTIAL_PATTERNS);
    if (Object.keys(files).length === 0) return null;
    const identity = kimiIdentityFromFiles(files);
    if (!identity) {
      throw new YoinkError(
        `Could not identify the ${LABEL} login in ${credentialsPath()}. Run \`kimi login\` again, then retry.`,
      );
    }
    return { snapshot: { files }, identity };
  };

  const restore = async (snapshot: SubscriptionSnapshot): Promise<void> => {
    await restoreSnapshotFiles(home(), snapshot.files, CREDENTIAL_PATTERNS);
  };

  const freeSetAsidePath = async (): Promise<string> => {
    const base = join(home(), `${SET_ASIDE_PREFIX}${timestampSuffix(now())}`);
    for (let attempt = 0; attempt < MAX_SET_ASIDE_ATTEMPTS; attempt++) {
      const candidate = attempt === 0 ? base : `${base}-${attempt}`;
      if (!(await pathExists(candidate))) return candidate;
    }
    throw new YoinkError(`Could not find a free name to set the ${LABEL} credentials aside in ${home()}.`);
  };

  const prepareLogin = async (): Promise<void> => {
    setAsidePath = null;
    const live = credentialsPath();
    if (!(await pathExists(live, "directory"))) return;
    await capture();
    const target = await freeSetAsidePath();
    try {
      await rename(live, target);
    } catch (error) {
      throw new YoinkError(`Could not set the current ${LABEL} credentials aside: ${errorMessage(error)}`);
    }
    setAsidePath = target;
  };

  const restoreAfterFailedLogin = async (): Promise<boolean> => {
    const saved = setAsidePath;
    if (saved === null) return false;
    const live = credentialsPath();
    await rm(live, { recursive: true, force: true });
    await rename(saved, live);
    setAsidePath = null;
    return true;
  };

  const carryOverSetAsideEntries = async (saved: string, live: string): Promise<void> => {
    for (const entry of await readdir(saved, { withFileTypes: true })) {
      if (entry.isFile() && isCredentialFile(entry.name)) continue;
      const destination = join(live, entry.name);
      if (await pathExists(destination)) continue;
      await rename(join(saved, entry.name), destination);
    }
  };

  const finishLogin = async (): Promise<void> => {
    const saved = setAsidePath;
    if (saved === null) return;
    setAsidePath = null;
    try {
      const live = credentialsPath();
      if (await pathExists(live, "directory")) await carryOverSetAsideEntries(saved, live);
      await rm(saved, { recursive: true, force: true });
    } catch (error) {
      throw new YoinkError(`Could not clean up the previous ${LABEL} credentials in ${saved}: ${errorMessage(error)}`);
    }
  };

  return {
    tool: "kimi",
    label: LABEL,
    home,
    detect,
    capture,
    restore,
    prepareLogin,
    restoreAfterFailedLogin,
    finishLogin,
    loginCommand: (): string[] => ["kimi", "login"],
    processMatcher: { names: ["kimi"] },
  };
};

export const kimiBackend: KimiBackend = createKimiBackend(createDefaultBackendDeps());
