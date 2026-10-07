import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGeminiBackend, geminiIdentityFromFiles } from "../src/features/subscriptions/backends/gemini";
import { matchesProcess } from "../src/shared/processes/process-detection";
import type { SubscriptionBackend, SubscriptionEnv } from "../src/features/subscriptions/types";
import { YoinkError } from "../src/shared/errors";
import { fakeJwt } from "./support/fake-jwt";
import { expectMode } from "./support/posix";

let homeDir: string;

beforeEach(async () => {
  homeDir = await mkdtemp(join(tmpdir(), "yoink-gemini-"));
});

afterEach(async () => {
  await rm(homeDir, { recursive: true, force: true });
});

const backendWith = (env: SubscriptionEnv = {}): SubscriptionBackend =>
  createGeminiBackend({
    homeDir,
    env,
    platform: "linux",
    keyring: {
      read: async () => {
        throw new Error("keyring must not be used");
      },
      write: async () => {
        throw new Error("keyring must not be used");
      },
      remove: async () => {
        throw new Error("keyring must not be used");
      },
    },
    listProcesses: async () => [],
  });

const geminiPath = (relativePath: string): string => join(homeDir, ".gemini", relativePath);

const writeGemini = async (relativePath: string, contents: string): Promise<void> => {
  await Bun.write(geminiPath(relativePath), contents);
};

const readGemini = (relativePath: string): Promise<string> => Bun.file(geminiPath(relativePath)).text();

const geminiFileExists = (relativePath: string): Promise<boolean> => Bun.file(geminiPath(relativePath)).exists();

const oauthCreds = (claims: Record<string, unknown>, refreshToken: string): string =>
  JSON.stringify({
    access_token: "fake-access",
    refresh_token: refreshToken,
    id_token: fakeJwt(claims),
    token_type: "Bearer",
    expiry_date: 1,
  });

const accounts = (active: string | null, old: string[] = []): string => JSON.stringify({ active, old });

const loginAs = async (email: string, sub: string): Promise<void> => {
  await writeGemini("oauth_creds.json", oauthCreds({ email, sub }, `refresh-${sub}`));
  await writeGemini("google_accounts.json", accounts(email));
};

test("home defaults to ~/.gemini and honours GEMINI_CLI_HOME", () => {
  expect(backendWith().home()).toBe(join(homeDir, ".gemini"));
  expect(backendWith({ GEMINI_CLI_HOME: "/elsewhere" }).home()).toBe(join("/elsewhere", ".gemini"));
  expect(backendWith({ GEMINI_CLI_HOME: "" }).home()).toBe(join(homeDir, ".gemini"));
});

test("detect reports whether the gemini home exists", async () => {
  expect(await backendWith().detect()).toBe(false);
  await writeGemini("settings.json", "{}");
  expect(await backendWith().detect()).toBe(true);
});

test("capture snapshots only the login files and reads identity from google_accounts", async () => {
  await loginAs("ada@example.com", "111");
  await writeGemini("settings.json", "{\"theme\":\"dark\"}");
  const captured = await backendWith().capture();
  expect(captured).not.toBeNull();
  expect(Object.keys(captured?.snapshot.files ?? {}).sort()).toEqual(["google_accounts.json", "oauth_creds.json"]);
  expect(captured?.snapshot.keyring).toBeUndefined();
  expect(captured?.identity).toEqual({ label: "ada@example.com", email: "ada@example.com", accountId: "111" });
});

test("capture returns null when no oauth credentials exist", async () => {
  expect(await backendWith().capture()).toBeNull();
  await writeGemini("google_accounts.json", accounts("ada@example.com"));
  expect(await backendWith().capture()).toBeNull();
});

test("identity falls back to the id_token email when google_accounts has no active account", () => {
  const files = {
    "oauth_creds.json": oauthCreds({ email: "bob@example.com", sub: "222" }, "r"),
    "google_accounts.json": accounts(null, ["old@example.com"]),
  };
  expect(geminiIdentityFromFiles(files)).toEqual({ label: "bob@example.com", email: "bob@example.com", accountId: "222" });
});

test("identity prefers the active google account over the id_token email", () => {
  const files = {
    "oauth_creds.json": oauthCreds({ email: "token@example.com" }, "r"),
    "google_accounts.json": accounts("active@example.com"),
  };
  expect(geminiIdentityFromFiles(files)).toEqual({ label: "active@example.com", email: "active@example.com" });
});

test("identity survives malformed files with a generic label", () => {
  expect(geminiIdentityFromFiles({ "oauth_creds.json": "not json", "google_accounts.json": "[1,2]" })).toEqual({
    label: "Gemini account",
  });
  expect(geminiIdentityFromFiles({ "oauth_creds.json": JSON.stringify({ id_token: "garbage" }) })).toEqual({
    label: "Gemini account",
  });
});

test("restore writes the snapshot files with mode 0600", async () => {
  await backendWith().restore({
    files: {
      "oauth_creds.json": oauthCreds({ email: "ada@example.com" }, "r1"),
      "google_accounts.json": accounts("ada@example.com"),
    },
  });
  expect(JSON.parse(await readGemini("google_accounts.json"))).toEqual({ active: "ada@example.com", old: [] });
  await expectMode(geminiPath("oauth_creds.json"), 0o600);
  await expectMode(geminiPath("google_accounts.json"), 0o600);
  await expectMode(join(homeDir, ".gemini"), 0o700);
});

test("restore leaves unrelated files in the gemini home untouched", async () => {
  await loginAs("ada@example.com", "111");
  await writeGemini("settings.json", "SETTINGS");
  await writeGemini("tmp/chat.json", "CHAT");
  await writeGemini("installation_id", "INSTALL");
  await backendWith().restore({
    files: { "oauth_creds.json": oauthCreds({ email: "bob@example.com" }, "r2") },
  });
  expect(await readGemini("settings.json")).toBe("SETTINGS");
  expect(await readGemini("tmp/chat.json")).toBe("CHAT");
  expect(await readGemini("installation_id")).toBe("INSTALL");
  expect(await geminiFileExists("google_accounts.json")).toBe(false);
});

test("restore rejects files outside the declared login files", async () => {
  const backend = backendWith();
  await expect(backend.restore({ files: { "settings.json": "{}" } })).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.restore({ files: { "../escape.json": "{}" } })).rejects.toBeInstanceOf(YoinkError);
  expect(await geminiFileExists("settings.json")).toBe(false);
});

test("capture and restore round trip between two accounts", async () => {
  const backend = backendWith();
  await loginAs("ada@example.com", "111");
  const ada = await backend.capture();
  await loginAs("bob@example.com", "222");
  const bob = await backend.capture();
  if (!ada || !bob) throw new Error("expected both captures");
  await backend.restore(ada.snapshot);
  expect(await backend.capture()).toEqual(ada);
  await backend.restore(bob.snapshot);
  expect(await backend.capture()).toEqual(bob);
  expect(bob.identity.email).toBe("bob@example.com");
});

test("refuses when encrypted storage is forced by the environment", async () => {
  await loginAs("ada@example.com", "111");
  const backend = backendWith({ GEMINI_FORCE_ENCRYPTED_FILE_STORAGE: "true" });
  await expect(backend.capture()).rejects.toThrow(/GEMINI_FORCE_ENCRYPTED_FILE_STORAGE/);
  await expect(backend.restore({ files: {} })).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.prepareLogin()).rejects.toBeInstanceOf(YoinkError);
  expect(await geminiFileExists("oauth_creds.json")).toBe(true);
});

test("ignores the encryption flag when it is not true", async () => {
  await loginAs("ada@example.com", "111");
  expect(await backendWith({ GEMINI_FORCE_ENCRYPTED_FILE_STORAGE: "false" }).capture()).not.toBeNull();
});

test("refuses when the login lives in gemini-credentials.json", async () => {
  await writeGemini("gemini-credentials.json", "ENCRYPTED");
  await writeGemini("google_accounts.json", accounts("ada@example.com"));
  const backend = backendWith();
  await expect(backend.capture()).rejects.toThrow(/gemini-credentials\.json/);
  await expect(backend.restore({ files: { "oauth_creds.json": "{}" } })).rejects.toBeInstanceOf(YoinkError);
  expect(await geminiFileExists("oauth_creds.json")).toBe(false);
  expect(await readGemini("gemini-credentials.json")).toBe("ENCRYPTED");
});

test("an encrypted file next to oauth_creds.json does not block switching", async () => {
  await loginAs("ada@example.com", "111");
  await writeGemini("gemini-credentials.json", "ENCRYPTED");
  const captured = await backendWith().capture();
  expect(captured?.identity.email).toBe("ada@example.com");
  expect(Object.keys(captured?.snapshot.files ?? {})).not.toContain("gemini-credentials.json");
});

test("prepareLogin signs out the live account and keeps other files without writing to the terminal", async () => {
  await writeGemini("oauth_creds.json", oauthCreds({ email: "ada@example.com" }, "r"));
  await writeGemini("google_accounts.json", accounts("ada@example.com", ["old@example.com"]));
  await writeGemini("settings.json", "SETTINGS");
  const stderrWrites = spyOn(process.stderr, "write");
  const stdoutWrites = spyOn(process.stdout, "write");
  let terminalWrites = -1;
  try {
    await backendWith().prepareLogin();
    terminalWrites = stderrWrites.mock.calls.length + stdoutWrites.mock.calls.length;
  } finally {
    stderrWrites.mockRestore();
    stdoutWrites.mockRestore();
  }
  expect(terminalWrites).toBe(0);
  expect(await geminiFileExists("oauth_creds.json")).toBe(false);
  expect(JSON.parse(await readGemini("google_accounts.json"))).toEqual({
    active: null,
    old: ["old@example.com", "ada@example.com"],
  });
  expect(await readGemini("settings.json")).toBe("SETTINGS");
});

test("prepareLogin works on a machine with no gemini login", async () => {
  await backendWith().prepareLogin();
  expect(await geminiFileExists("oauth_creds.json")).toBe(false);
  expect(await geminiFileExists("google_accounts.json")).toBe(false);
});

test("login command and process matcher target the gemini CLI", () => {
  const backend = backendWith();
  expect(backend.loginCommand()).toEqual(["gemini"]);
  expect(backend.tool).toBe("gemini");
  expect(matchesProcess(backend.processMatcher, { pid: 1, name: "gemini", argv: ["gemini"] })).toBe(true);
  expect(
    matchesProcess(backend.processMatcher, {
      pid: 2,
      name: "node",
      argv: ["node", "/usr/lib/node_modules/@google/gemini-cli/dist/index.js"],
    }),
  ).toBe(true);
  expect(matchesProcess(backend.processMatcher, { pid: 3, name: "node", argv: ["node", "server.js"] })).toBe(false);
});
