import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createKimiBackend,
  kimiIdentityFromFiles,
  type KimiBackend,
} from "../src/features/subscriptions/backends/kimi";
import { createSubscriptionLoginService } from "../src/features/subscriptions/add-login";
import { createUnsupportedKeyring } from "../src/features/subscriptions/shared/keyring";
import type { SubscriptionBackendDeps, SubscriptionEnv } from "../src/features/subscriptions/types";
import { YoinkError } from "../src/shared/errors";
import { fakeJwt } from "./support/fake-jwt";

const posix = process.platform !== "win32";
const FIXED_NOW = new Date("2026-10-07T12:34:56.789Z");

let userHome: string;
let kimiHome: string;

const depsFor = (env: SubscriptionEnv = {}): SubscriptionBackendDeps => ({
  homeDir: userHome,
  env,
  platform: process.platform,
  keyring: createUnsupportedKeyring(process.platform),
  listProcesses: async () => [],
});

const backendFor = (env: SubscriptionEnv = {}): KimiBackend => createKimiBackend(depsFor(env), { now: () => FIXED_NOW });

const credentialFor = (claims: Record<string, unknown>, refresh = "refresh-fake"): string =>
  JSON.stringify({ access_token: fakeJwt(claims), refresh_token: refresh, token_type: "Bearer" });

const writeKimi = async (relativePath: string, contents: string): Promise<void> => {
  await Bun.write(join(kimiHome, relativePath), contents);
};

const readKimi = async (relativePath: string): Promise<string> => Bun.file(join(kimiHome, relativePath)).text();

beforeEach(async () => {
  userHome = await mkdtemp(join(tmpdir(), "yoink-kimi-"));
  kimiHome = join(userHome, ".kimi-code");
});

afterEach(async () => {
  await rm(userHome, { recursive: true, force: true });
});

test("home defaults to ~/.kimi-code and honours KIMI_CODE_HOME", () => {
  expect(backendFor().home()).toBe(kimiHome);
  expect(backendFor({ KIMI_CODE_HOME: "/custom/kimi" }).home()).toBe("/custom/kimi");
  expect(backendFor({ KIMI_CODE_HOME: "" }).home()).toBe(kimiHome);
});

test("exposes the login command, label and process matcher", () => {
  const backend = backendFor();
  expect(backend.tool).toBe("kimi");
  expect(backend.label).toBe("Kimi Code");
  expect(backend.loginCommand()).toEqual(["kimi", "login"]);
  expect(backend.processMatcher).toEqual({ names: ["kimi"] });
});

test("detect reports whether the kimi home exists", async () => {
  expect(await backendFor().detect()).toBe(false);
  await mkdir(kimiHome, { recursive: true });
  expect(await backendFor().detect()).toBe(true);
});

test("capture returns null when there are no credential files", async () => {
  expect(await backendFor().capture()).toBeNull();
  await writeKimi("config.toml", "model = \"k2\"");
  await mkdir(join(kimiHome, "credentials"), { recursive: true });
  expect(await backendFor().capture()).toBeNull();
});

test("capture snapshots every credentials json and extracts identity from the access token", async () => {
  const main = credentialFor({ user_id: "u-123", region: "cn" });
  const extra = JSON.stringify({ note: "other" });
  await writeKimi("credentials/kimi-code.json", main);
  await writeKimi("credentials/extra.json", extra);
  await writeKimi("credentials/readme.txt", "skip");
  await writeKimi("config.toml", "skip");
  const capture = await backendFor().capture();
  expect(capture?.snapshot).toEqual({ files: { "credentials/extra.json": extra, "credentials/kimi-code.json": main } });
  expect(capture?.identity).toEqual({ label: "kimi:u-123", accountId: "u-123", plan: "cn" });
});

test("capture reads from KIMI_CODE_HOME", async () => {
  const custom = join(userHome, "elsewhere");
  await Bun.write(join(custom, "credentials/kimi-code.json"), credentialFor({ user_id: 42 }));
  const capture = await backendFor({ KIMI_CODE_HOME: custom }).capture();
  expect(capture?.identity).toEqual({ label: "kimi:42", accountId: "42" });
});

test("identity prefers kimi-code.json and falls back to other credential files", () => {
  expect(
    kimiIdentityFromFiles({
      "credentials/a.json": credentialFor({ user_id: "first" }),
      "credentials/kimi-code.json": credentialFor({ user_id: "preferred" }),
    })?.accountId,
  ).toBe("preferred");
  expect(
    kimiIdentityFromFiles({
      "credentials/a.json": "not json",
      "credentials/b.json": credentialFor({ user_id: "second" }),
    })?.accountId,
  ).toBe("second");
  expect(kimiIdentityFromFiles({ "credentials/a.json": JSON.stringify({ access_token: "opaque" }) })).toBeNull();
  expect(kimiIdentityFromFiles({ "credentials/a.json": credentialFor({ sub: "no-user-id" }) })).toBeNull();
  expect(kimiIdentityFromFiles({})).toBeNull();
});

test("capture refuses a login it cannot identify", async () => {
  await writeKimi("credentials/kimi-code.json", JSON.stringify({ access_token: "not-a-jwt" }));
  await expect(backendFor().capture()).rejects.toBeInstanceOf(YoinkError);
});

test("restore writes 0600 credential files, removes stale ones and leaves unrelated files alone", async () => {
  await writeKimi("credentials/stale.json", credentialFor({ user_id: "old" }));
  await writeKimi("credentials/notes.txt", "keep");
  await writeKimi("config.toml", "keep-config");
  await writeKimi("sessions/log.json", "keep-session");
  const target = credentialFor({ user_id: "new" });
  await backendFor().restore({ files: { "credentials/kimi-code.json": target } });
  expect(await readKimi("credentials/kimi-code.json")).toBe(target);
  expect(await Bun.file(join(kimiHome, "credentials/stale.json")).exists()).toBe(false);
  expect(await readKimi("credentials/notes.txt")).toBe("keep");
  expect(await readKimi("config.toml")).toBe("keep-config");
  expect(await readKimi("sessions/log.json")).toBe("keep-session");
  if (posix) expect((await stat(join(kimiHome, "credentials/kimi-code.json"))).mode & 0o777).toBe(0o600);
});

test("restore into a missing home creates a private credentials directory", async () => {
  await backendFor().restore({ files: { "credentials/kimi-code.json": credentialFor({ user_id: "u" }) } });
  if (posix) {
    expect((await stat(join(kimiHome, "credentials"))).mode & 0o777).toBe(0o700);
    expect((await stat(join(kimiHome, "credentials/kimi-code.json"))).mode & 0o777).toBe(0o600);
  }
});

test("restore refuses paths outside the credential files before writing anything", async () => {
  await writeKimi("config.toml", "original");
  const backend = backendFor();
  for (const path of ["config.toml", "../escape.json", "credentials/../config.toml", "/abs/credentials/x.json"]) {
    await expect(
      backend.restore({ files: { "credentials/kimi-code.json": "{}", [path]: "evil" } }),
    ).rejects.toBeInstanceOf(YoinkError);
  }
  expect(await readKimi("config.toml")).toBe("original");
  expect(await Bun.file(join(kimiHome, "credentials/kimi-code.json")).exists()).toBe(false);
  expect(await Bun.file(join(userHome, "escape.json")).exists()).toBe(false);
});

test("capture and restore round trip between two accounts", async () => {
  const backend = backendFor();
  const alice = credentialFor({ user_id: "alice", region: "global" }, "r-alice");
  const bob = credentialFor({ user_id: "bob" }, "r-bob");
  await writeKimi("credentials/kimi-code.json", alice);
  const aliceCapture = await backend.capture();
  await backend.restore({ files: { "credentials/kimi-code.json": bob } });
  expect((await backend.capture())?.identity.accountId).toBe("bob");
  if (!aliceCapture) throw new Error("expected a capture");
  await backend.restore(aliceCapture.snapshot);
  expect(await readKimi("credentials/kimi-code.json")).toBe(alice);
  expect(await backend.capture()).toEqual(aliceCapture);
});

test("restoring an empty snapshot clears only the credential files", async () => {
  await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u" }));
  await writeKimi("config.toml", "keep");
  await backendFor().restore({ files: {} });
  expect(await backendFor().capture()).toBeNull();
  expect(await readKimi("config.toml")).toBe("keep");
});

test("prepareLogin moves the credentials directory aside to a timestamped sibling inside home", async () => {
  const live = credentialFor({ user_id: "u-1" });
  await writeKimi("credentials/kimi-code.json", live);
  await writeKimi("config.toml", "keep");
  const backend = backendFor();
  await backend.prepareLogin();
  expect(await backend.capture()).toBeNull();
  const entries = (await readdir(kimiHome)).sort();
  expect(entries).toEqual(["config.toml", "credentials.yoink-20261007T123456789Z"]);
  expect(await readKimi("credentials.yoink-20261007T123456789Z/kimi-code.json")).toBe(live);
  expect(await readKimi("config.toml")).toBe("keep");
});

test("prepareLogin picks a free name when the timestamped sibling already exists", async () => {
  await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u-1" }));
  await mkdir(join(kimiHome, "credentials.yoink-20261007T123456789Z"), { recursive: true });
  await backendFor().prepareLogin();
  expect(await Bun.file(join(kimiHome, "credentials.yoink-20261007T123456789Z-1/kimi-code.json")).exists()).toBe(true);
});

test("prepareLogin does nothing when there is no credentials directory", async () => {
  const backend = backendFor();
  await backend.prepareLogin();
  expect(await backend.restoreAfterFailedLogin()).toBe(false);
  expect(await backend.detect()).toBe(false);
});

test("prepareLogin refuses to move an unidentifiable login aside", async () => {
  await writeKimi("credentials/kimi-code.json", "garbage");
  await expect(backendFor().prepareLogin()).rejects.toBeInstanceOf(YoinkError);
  expect(await readKimi("credentials/kimi-code.json")).toBe("garbage");
  expect(await readdir(kimiHome)).toEqual(["credentials"]);
});

test("restoreAfterFailedLogin puts the original credentials back and drops a partial login", async () => {
  const live = credentialFor({ user_id: "u-1" });
  await writeKimi("credentials/kimi-code.json", live);
  const backend = backendFor();
  await backend.prepareLogin();
  await writeKimi("credentials/partial.json", "half-written");
  expect(await backend.restoreAfterFailedLogin()).toBe(true);
  expect(await readdir(kimiHome)).toEqual(["credentials"]);
  expect(await readdir(join(kimiHome, "credentials"))).toEqual(["kimi-code.json"]);
  expect(await readKimi("credentials/kimi-code.json")).toBe(live);
  expect(await backend.restoreAfterFailedLogin()).toBe(false);
});

test("restoreAfterFailedLogin works when the login left no credentials directory", async () => {
  const live = credentialFor({ user_id: "u-1" });
  await writeKimi("credentials/kimi-code.json", live);
  const backend = backendFor();
  await backend.prepareLogin();
  expect(await backend.restoreAfterFailedLogin()).toBe(true);
  expect((await backend.capture())?.identity.accountId).toBe("u-1");
});

test("restoreAfterFailedLogin does nothing without a prior prepareLogin", async () => {
  await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u-1" }));
  await writeKimi("credentials.yoink-old/kimi-code.json", credentialFor({ user_id: "older" }));
  expect(await backendFor().restoreAfterFailedLogin()).toBe(false);
  expect((await backendFor().capture())?.identity.accountId).toBe("u-1");
});

const setAsideEntries = async (): Promise<string[]> =>
  (await readdir(kimiHome)).filter((entry) => entry.startsWith("credentials.yoink-"));

const loginServiceFor = (backend: KimiBackend, runLogin: () => Promise<void>) =>
  createSubscriptionLoginService({
    backends: [backend],
    syncCurrentSubscription: async () => {},
    preserveLiveLogin: async () => ({ kind: "none" }),
    runLogin,
  });

test("finishLogin removes the set-aside directory and carries over non-credential entries", async () => {
  await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u-1" }));
  await writeKimi("credentials/device-id", "device");
  await writeKimi("credentials/cache/state.bin", "cache");
  const backend = backendFor();
  await backend.prepareLogin();
  const fresh = credentialFor({ user_id: "u-2" });
  await writeKimi("credentials/kimi-code.json", fresh);
  await backend.finishLogin();
  expect(await setAsideEntries()).toEqual([]);
  expect((await readdir(join(kimiHome, "credentials"))).sort()).toEqual(["cache", "device-id", "kimi-code.json"]);
  expect(await readKimi("credentials/kimi-code.json")).toBe(fresh);
  expect(await readKimi("credentials/cache/state.bin")).toBe("cache");
  expect(await backend.restoreAfterFailedLogin()).toBe(false);
});

test("finishLogin does nothing without a prior prepareLogin", async () => {
  await writeKimi("credentials.yoink-old/kimi-code.json", credentialFor({ user_id: "older" }));
  await backendFor().finishLogin();
  expect(await setAsideEntries()).toEqual(["credentials.yoink-old"]);
});

test("a successful add leaves no set-aside credentials behind", async () => {
  await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u-1" }));
  const backend = backendFor();
  const logins = loginServiceFor(backend, async () => {
    await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u-2" }));
  });
  const after = await logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi"));
  expect(after?.identity.accountId).toBe("u-2");
  expect(await setAsideEntries()).toEqual([]);
});

test("a failed add puts the whole original directory back and leaves no set-aside copy", async () => {
  const live = credentialFor({ user_id: "u-1" });
  await writeKimi("credentials/kimi-code.json", live);
  await writeKimi("credentials/device-id", "device");
  const backend = backendFor();
  const logins = loginServiceFor(backend, async () => {
    await writeKimi("credentials/partial.json", "half-written");
    throw new Error("login exited 1");
  });
  const preparation = await logins.prepareSubscriptionLogin("kimi");
  await expect(logins.runPreparedLogin(preparation)).rejects.toThrow("login exited 1");
  expect(await setAsideEntries()).toEqual([]);
  expect((await readdir(join(kimiHome, "credentials"))).sort()).toEqual(["device-id", "kimi-code.json"]);
  expect(await readKimi("credentials/kimi-code.json")).toBe(live);
});

test("an add that leaves no login behind restores the original directory", async () => {
  await writeKimi("credentials/kimi-code.json", credentialFor({ user_id: "u-1" }));
  const backend = backendFor();
  const logins = loginServiceFor(backend, async () => {});
  expect(await logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi"))).toBeNull();
  expect(await setAsideEntries()).toEqual([]);
  expect((await backend.capture())?.identity.accountId).toBe("u-1");
});
