import { afterEach, beforeEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, realpath, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CODEX_KEYRING_SERVICE,
  codexIdentityFromAuth,
  codexKeyringAccount,
  createCodexBackend,
  parseCodexStorageMode,
} from "../src/features/subscriptions/backends/codex";
import { matchesProcess } from "../src/shared/processes/process-detection";
import type { KeyringAdapter, SubscriptionBackend, SubscriptionBackendDeps } from "../src/features/subscriptions/types";
import { ConfigParseError, YoinkError } from "../src/shared/errors";
import { sameIdentity } from "../src/features/subscriptions/identity";
import { fakeJwt } from "./support/fake-jwt";

const posix = process.platform !== "win32";
const AUTH_CLAIM = "https://api.openai.com/auth";

type MemoryKeyring = KeyringAdapter & { items: Map<string, string> };

const createMemoryKeyring = (): MemoryKeyring => {
  const items = new Map<string, string>();
  const key = (service: string, account: string): string => `${service}\n${account}`;
  return {
    items,
    read: async (service, account) => items.get(key(service, account)) ?? null,
    write: async (service, account, secret) => {
      items.set(key(service, account), secret);
    },
    remove: async (service, account) => {
      items.delete(key(service, account));
    },
  };
};

let userHome: string;
let codexHome: string;
let keyring: MemoryKeyring;

beforeEach(async () => {
  userHome = await mkdtemp(join(tmpdir(), "yoink-codex-"));
  codexHome = join(userHome, ".codex");
  keyring = createMemoryKeyring();
});

afterEach(async () => {
  await rm(userHome, { recursive: true, force: true });
});

const backendFor = (overrides: Partial<SubscriptionBackendDeps> = {}): SubscriptionBackend =>
  createCodexBackend({
    homeDir: userHome,
    env: {},
    platform: "darwin",
    keyring,
    listProcesses: async () => [],
    ...overrides,
  });

const authJson = (claims: Record<string, unknown>, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({
    OPENAI_API_KEY: null,
    tokens: { id_token: fakeJwt(claims), access_token: "fake-access", refresh_token: "fake-refresh" },
    ...extra,
  });

const aliceAuth = authJson({
  email: "alice@example.com",
  [AUTH_CLAIM]: { chatgpt_plan_type: "plus", chatgpt_account_id: "acct-alice" },
});

const bobAuth = authJson({
  email: "bob@example.com",
  [AUTH_CLAIM]: { chatgpt_plan_type: "pro", chatgpt_account_id: "acct-bob" },
});

const writeCodex = async (relativePath: string, contents: string): Promise<void> => {
  await Bun.write(join(codexHome, relativePath), contents);
};

const readCodex = (relativePath: string): Promise<string> => Bun.file(join(codexHome, relativePath)).text();

const expectedAccount = async (home: string): Promise<string> =>
  `cli|${createHash("sha256").update(await realpath(home)).digest("hex").slice(0, 16)}`;

test("home defaults to ~/.codex and honors CODEX_HOME", () => {
  expect(backendFor().home()).toBe(codexHome);
  const custom = join(userHome, "custom-codex");
  expect(backendFor({ env: { CODEX_HOME: custom } }).home()).toBe(custom);
  expect(backendFor({ env: { CODEX_HOME: "" } }).home()).toBe(codexHome);
});

test("detect reports whether the codex home exists", async () => {
  expect(await backendFor().detect()).toBe(false);
  await mkdir(codexHome, { recursive: true });
  expect(await backendFor().detect()).toBe(true);
});

test("login command and process matcher target the codex CLI", () => {
  const backend = backendFor();
  expect(backend.loginCommand()).toEqual(["codex", "login"]);
  expect(matchesProcess(backend.processMatcher, { pid: 1, name: "codex", argv: ["codex"] })).toBe(true);
  expect(
    matchesProcess(backend.processMatcher, {
      pid: 2,
      name: "node",
      argv: ["node", "/usr/lib/node_modules/@openai/codex/bin/codex.js"],
    }),
  ).toBe(true);
  expect(matchesProcess(backend.processMatcher, { pid: 3, name: "node", argv: ["node", "server.js"] })).toBe(false);
});

test("codexIdentityFromAuth reads email, plan and account from the id token", () => {
  expect(codexIdentityFromAuth(JSON.parse(aliceAuth))).toEqual({
    label: "alice@example.com",
    email: "alice@example.com",
    plan: "plus",
    accountId: "acct-alice",
  });
});

test("codexIdentityFromAuth falls back to tokens.account_id and an API key label", () => {
  const withoutClaims = { tokens: { id_token: "not-a-jwt", account_id: "acct-raw" } };
  expect(codexIdentityFromAuth(withoutClaims)).toEqual({ label: "acct-raw", accountId: "acct-raw" });
  const apiKeyIdentity = codexIdentityFromAuth({ OPENAI_API_KEY: "sk-fake" });
  expect(apiKeyIdentity.label).toBe("OpenAI API key");
  expect(apiKeyIdentity.accountId).toMatch(/^apikey:[0-9a-f]{16}$/);
  expect(apiKeyIdentity.accountId).not.toContain("sk-fake");
  expect(codexIdentityFromAuth({})).toEqual({ label: "ChatGPT" });
});

test("parseCodexStorageMode defaults to file and rejects unknown modes and bad TOML", () => {
  expect(parseCodexStorageMode(null, "config.toml")).toBe("file");
  expect(parseCodexStorageMode('model = "o3"\n', "config.toml")).toBe("file");
  expect(parseCodexStorageMode('cli_auth_credentials_store = "keyring"\n', "config.toml")).toBe("keyring");
  expect(parseCodexStorageMode('cli_auth_credentials_store = "auto"\n', "config.toml")).toBe("auto");
  expect(() => parseCodexStorageMode('cli_auth_credentials_store = "ephemeral"\n', "config.toml")).toThrow(YoinkError);
  expect(() => parseCodexStorageMode("cli_auth_credentials_store = [", "config.toml")).toThrow(ConfigParseError);
});

test("codexKeyringAccount hashes the canonical home path", async () => {
  await mkdir(codexHome, { recursive: true });
  const linked = join(userHome, "codex-link");
  if (posix) await symlink(codexHome, linked);
  const account = await codexKeyringAccount(codexHome);
  expect(account).toBe(await expectedAccount(codexHome));
  expect(account).toMatch(/^cli\|[0-9a-f]{16}$/);
  if (posix) expect(await codexKeyringAccount(linked)).toBe(account);
  const missing = join(userHome, "missing");
  expect(await codexKeyringAccount(missing)).toBe(
    `cli|${createHash("sha256").update(missing).digest("hex").slice(0, 16)}`,
  );
});

test("capture returns null when no login exists", async () => {
  expect(await backendFor().capture()).toBeNull();
  await writeCodex("config.toml", 'model = "o3"\n');
  expect(await backendFor().capture()).toBeNull();
});

test("capture reads auth.json only, with identity from the id token", async () => {
  await writeCodex("auth.json", aliceAuth);
  await writeCodex("config.toml", 'model = "o3"\n');
  await writeCodex("history.jsonl", "{}\n");
  const captured = await backendFor().capture();
  expect(captured?.snapshot).toEqual({ files: { "auth.json": aliceAuth } });
  expect(captured?.identity).toEqual({
    label: "alice@example.com",
    email: "alice@example.com",
    plan: "plus",
    accountId: "acct-alice",
  });
});

test("capture refuses an auth.json that is not valid JSON", async () => {
  await writeCodex("auth.json", "{nope");
  await expect(backendFor().capture()).rejects.toBeInstanceOf(ConfigParseError);
});

test("restore writes auth.json with mode 0600 and leaves other files untouched", async () => {
  await writeCodex("auth.json", aliceAuth);
  await writeCodex("config.toml", 'model = "o3"\n');
  await writeCodex("sessions/one.jsonl", "session");
  const backend = backendFor();
  await backend.restore({ files: { "auth.json": bobAuth } });
  expect(await readCodex("auth.json")).toBe(bobAuth);
  expect(await readCodex("config.toml")).toBe('model = "o3"\n');
  expect(await readCodex("sessions/one.jsonl")).toBe("session");
  if (posix) expect((await stat(join(codexHome, "auth.json"))).mode & 0o777).toBe(0o600);
});

test("restore creates a missing codex home with a 0600 auth.json", async () => {
  await backendFor().restore({ files: { "auth.json": aliceAuth } });
  expect(await readCodex("auth.json")).toBe(aliceAuth);
  if (posix) expect((await stat(join(codexHome, "auth.json"))).mode & 0o777).toBe(0o600);
});

test("capture and restore round trip between two accounts", async () => {
  const backend = backendFor();
  await writeCodex("auth.json", aliceAuth);
  const alice = await backend.capture();
  await writeCodex("auth.json", bobAuth);
  const bob = await backend.capture();
  if (!alice || !bob) throw new Error("expected both captures");
  await backend.restore(alice.snapshot);
  expect((await backend.capture())?.identity.email).toBe("alice@example.com");
  await backend.restore(bob.snapshot);
  expect(await backend.capture()).toEqual(bob);
});

test("restoring an empty snapshot removes auth.json only", async () => {
  await writeCodex("auth.json", aliceAuth);
  await writeCodex("config.toml", 'model = "o3"\n');
  await backendFor().restore({ files: {} });
  expect(await Bun.file(join(codexHome, "auth.json")).exists()).toBe(false);
  expect(await readCodex("config.toml")).toBe('model = "o3"\n');
});

test("restore refuses undeclared paths and invalid payloads without touching auth.json", async () => {
  await writeCodex("auth.json", aliceAuth);
  const backend = backendFor();
  await expect(backend.restore({ files: { "config.toml": "x" } })).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.restore({ files: { "../auth.json": bobAuth } })).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.restore({ files: { "auth.json": "{broken" } })).rejects.toBeInstanceOf(ConfigParseError);
  expect(await readCodex("auth.json")).toBe(aliceAuth);
});

test("keyring storage on macOS captures and restores through the keyring", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "keyring"\n');
  await writeCodex("unrelated.json", "keep");
  const account = await expectedAccount(codexHome);
  const backend = backendFor();
  expect(await backend.capture()).toBeNull();
  await keyring.write(CODEX_KEYRING_SERVICE, account, aliceAuth);
  const alice = await backend.capture();
  expect(alice?.snapshot).toEqual({ files: {}, keyring: { [account]: aliceAuth } });
  expect(alice?.identity.accountId).toBe("acct-alice");
  await backend.restore({ files: {}, keyring: { [account]: bobAuth } });
  expect(await keyring.read(CODEX_KEYRING_SERVICE, account)).toBe(bobAuth);
  await backend.restore({ files: {} });
  expect(await keyring.read(CODEX_KEYRING_SERVICE, account)).toBeNull();
  expect(await Bun.file(join(codexHome, "auth.json")).exists()).toBe(false);
  expect(await readCodex("unrelated.json")).toBe("keep");
});

test("keyring restore accepts a file snapshot and a snapshot from another home", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "keyring"\n');
  const account = await expectedAccount(codexHome);
  const backend = backendFor();
  await backend.restore({ files: { "auth.json": aliceAuth } });
  expect(await keyring.read(CODEX_KEYRING_SERVICE, account)).toBe(aliceAuth);
  await backend.restore({ files: {}, keyring: { "cli|0000000000000000": bobAuth } });
  expect(await keyring.read(CODEX_KEYRING_SERVICE, account)).toBe(bobAuth);
});

test("file storage restore accepts a keyring snapshot", async () => {
  await backendFor().restore({ files: {}, keyring: { "cli|0000000000000000": bobAuth } });
  expect(await readCodex("auth.json")).toBe(bobAuth);
});

test("auto storage uses auth.json when present and the keyring otherwise", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "auto"\n');
  const account = await expectedAccount(codexHome);
  await keyring.write(CODEX_KEYRING_SERVICE, account, bobAuth);
  const backend = backendFor();
  expect((await backend.capture())?.identity.email).toBe("bob@example.com");
  await writeCodex("auth.json", aliceAuth);
  expect((await backend.capture())?.identity.email).toBe("alice@example.com");
});

test("keyring storage on Linux is refused with a clear message", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "keyring"\n');
  const backend = backendFor({ platform: "linux" });
  await expect(backend.capture()).rejects.toThrow(/cli_auth_credentials_store = "file"/);
  await expect(backend.restore({ files: { "auth.json": aliceAuth } })).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.prepareLogin()).rejects.toBeInstanceOf(YoinkError);
  expect(keyring.items.size).toBe(0);
  expect(await Bun.file(join(codexHome, "auth.json")).exists()).toBe(false);
});

test("auto storage on Linux is refused before login, even with auth.json present", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "auto"\n');
  await writeCodex("auth.json", aliceAuth);
  const backend = backendFor({ platform: "linux" });
  await expect(backend.prepareLogin()).rejects.toThrow(/cli_auth_credentials_store = "file"/);
  await expect(backend.capture()).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.restore({ files: { "auth.json": bobAuth } })).rejects.toBeInstanceOf(YoinkError);
  expect(await readCodex("auth.json")).toBe(aliceAuth);
  expect(keyring.items.size).toBe(0);
});

test("auto storage on Linux is refused without auth.json", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "auto"\n');
  const backend = backendFor({ platform: "linux" });
  await expect(backend.prepareLogin()).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.capture()).rejects.toBeInstanceOf(YoinkError);
});

test("auto storage on macOS passes prepareLogin", async () => {
  await writeCodex("config.toml", 'cli_auth_credentials_store = "auto"\n');
  await backendFor().prepareLogin();
});

test("API-key logins get a stable fingerprint that tells different keys apart", async () => {
  const first = codexIdentityFromAuth({ OPENAI_API_KEY: "sk-fake-one" });
  expect(codexIdentityFromAuth({ OPENAI_API_KEY: "sk-fake-one" })).toEqual(first);
  expect(codexIdentityFromAuth({ OPENAI_API_KEY: "sk-fake-two" }).accountId).not.toBe(first.accountId);
  expect(sameIdentity(first, codexIdentityFromAuth({ OPENAI_API_KEY: "sk-fake-one" }))).toBe(true);
  await writeCodex("auth.json", JSON.stringify({ OPENAI_API_KEY: "sk-fake-one" }));
  const captured = await backendFor({ platform: "linux" }).capture();
  expect(captured?.identity).toEqual(first);
});

test("prepareLogin succeeds for file storage and leaves the login in place", async () => {
  await writeCodex("auth.json", aliceAuth);
  await backendFor({ platform: "linux" }).prepareLogin();
  expect(await readCodex("auth.json")).toBe(aliceAuth);
});

test("postSwitchNotice warns when a custom model_provider overrides the ChatGPT login", async () => {
  expect(backendFor().postSwitchNotice?.()).toBeNull();
  await writeCodex("config.toml", 'model_provider = "openai"\n');
  expect(backendFor().postSwitchNotice?.()).toBeNull();
  await writeCodex("config.toml", 'model = "m1"\nmodel_provider = "prov2"\n');
  const notice = backendFor().postSwitchNotice?.();
  expect(notice).toContain('model_provider = "prov2"');
  expect(notice).toContain("yoink disconnect prov2 --from codex");
  expect(notice).toContain(join(codexHome, "config.toml"));
  await writeCodex("config.toml", "model_provider = [");
  expect(backendFor().postSwitchNotice?.()).toBeNull();
});
