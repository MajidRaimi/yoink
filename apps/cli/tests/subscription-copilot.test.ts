import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  copilotIdentity,
  copilotTokenOverrideNotice,
  createCopilotBackend,
  type CopilotBackend,
} from "../src/features/subscriptions/backends/copilot";
import { createUnsupportedKeyring } from "../src/features/subscriptions/shared/keyring";
import type { SubscriptionEnv } from "../src/features/subscriptions/types";
import { ConfigParseError, YoinkError } from "../src/shared/errors";
import { fakeJwt } from "./support/fake-jwt";
import { expectMode, isPosix } from "./support/posix";
const GITHUB = "https://github.com";
const ENTERPRISE = "https://ghe.example.com";

let root: string;
let copilotHome: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "yoink-copilot-"));
  copilotHome = join(root, ".copilot");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const backendWith = (env: SubscriptionEnv = {}): CopilotBackend =>
  createCopilotBackend({
    homeDir: root,
    env,
    platform: "linux",
    keyring: createUnsupportedKeyring("linux"),
    listProcesses: async () => [],
  });

const configPath = (): string => join(copilotHome, "config.json");

const writeConfig = async (config: Record<string, unknown>): Promise<void> => {
  await mkdir(copilotHome, { recursive: true });
  await Bun.write(configPath(), JSON.stringify(config, null, 2));
};

const readConfig = async (): Promise<Record<string, unknown>> =>
  JSON.parse(await Bun.file(configPath()).text()) as Record<string, unknown>;

const alice = { host: GITHUB, login: "alice" };
const bob = { host: GITHUB, login: "Bob" };

const twoUserConfig = (active: { host: string; login: string }): Record<string, unknown> => ({
  banner: "never",
  model: "gpt-5",
  trusted_folders: ["/work"],
  copilot_tokens: { [`${GITHUB}:alice`]: fakeJwt({ sub: "alice" }), [`${GITHUB}:Bob`]: fakeJwt({ sub: "bob" }) },
  last_logged_in_user: active,
  logged_in_users: [alice, bob],
});

test("home defaults to ~/.copilot and honours COPILOT_HOME", () => {
  expect(backendWith().home()).toBe(copilotHome);
  expect(backendWith({ COPILOT_HOME: join(root, "custom") }).home()).toBe(join(root, "custom"));
  expect(backendWith({ COPILOT_HOME: "  " }).home()).toBe(copilotHome);
});

test("login command, process matcher and prepareLogin", async () => {
  const backend = backendWith();
  expect(backend.tool).toBe("copilot");
  expect(backend.loginCommand()).toEqual(["copilot", "login"]);
  expect(backend.processMatcher).toEqual({ names: ["copilot"] });
  await writeConfig(twoUserConfig(alice));
  const before = await Bun.file(configPath()).text();
  await backend.prepareLogin();
  expect(await Bun.file(configPath()).text()).toBe(before);
});

test("detect reflects whether the Copilot home exists", async () => {
  const backend = backendWith();
  expect(await backend.detect()).toBe(false);
  await mkdir(copilotHome, { recursive: true });
  expect(await backend.detect()).toBe(true);
});

test("capture returns null when config.json is missing or has no active user", async () => {
  const backend = backendWith();
  expect(await backend.capture()).toBeNull();
  await writeConfig({ logged_in_users: [alice] });
  expect(await backend.capture()).toBeNull();
  await writeConfig({ last_logged_in_user: { host: GITHUB } });
  expect(await backend.capture()).toBeNull();
});

test("capture rejects an unparseable config", async () => {
  await mkdir(copilotHome, { recursive: true });
  await Bun.write(configPath(), "{ not json");
  await expect(backendWith().capture()).rejects.toBeInstanceOf(ConfigParseError);
});

test("capture records only host and login, never tokens", async () => {
  await writeConfig(twoUserConfig(alice));
  const captured = await backendWith().capture();
  expect(captured).not.toBeNull();
  expect(captured?.snapshot).toEqual({ files: { "identity.json": JSON.stringify(alice) } });
  expect(captured?.snapshot.keyring).toBeUndefined();
  expect(captured?.identity).toEqual({ label: "alice", accountId: "https://github.com/alice" });
  const serialized = JSON.stringify(captured);
  expect(serialized).not.toContain("copilot_tokens");
  expect(serialized).not.toContain(fakeJwt({ sub: "alice" }));
});

test("identity labels enterprise hosts and normalizes the account id", () => {
  expect(copilotIdentity({ host: `${ENTERPRISE}/`, login: "Carol" })).toEqual({
    label: "Carol@ghe.example.com",
    accountId: "https://ghe.example.com/carol",
  });
  expect(copilotIdentity({ host: "https://GitHub.com/", login: "Bob" }).label).toBe("Bob");
});

test("restore switches the active user and preserves every other key", async () => {
  const original = twoUserConfig(alice);
  await writeConfig(original);
  await backendWith().restore({ files: { "identity.json": JSON.stringify(bob) } });
  expect(await readConfig()).toEqual({ ...original, last_logged_in_user: bob });
  expect(Object.keys(await readConfig())).toEqual(Object.keys(original));
});

test("restore matches the stored user case-insensitively and writes its stored casing", async () => {
  await writeConfig(twoUserConfig(alice));
  await backendWith().restore({ files: { "identity.json": JSON.stringify({ host: `${GITHUB}/`, login: "bob" }) } });
  expect((await readConfig()).last_logged_in_user).toEqual(bob);
});

test("restore refuses a user that is not logged in and leaves config untouched", async () => {
  await writeConfig(twoUserConfig(alice));
  const before = await Bun.file(configPath()).text();
  const stranger = { host: GITHUB, login: "mallory" };
  await expect(backendWith().restore({ files: { "identity.json": JSON.stringify(stranger) } })).rejects.toThrow(
    /mallory is not logged in to GitHub Copilot/,
  );
  const otherHost = { host: ENTERPRISE, login: "alice" };
  await expect(backendWith().restore({ files: { "identity.json": JSON.stringify(otherHost) } })).rejects.toThrow(
    /alice@ghe.example.com is not logged in/,
  );
  expect(await Bun.file(configPath()).text()).toBe(before);
});

test("restore refuses when config.json is missing", async () => {
  await expect(backendWith().restore({ files: { "identity.json": JSON.stringify(alice) } })).rejects.toBeInstanceOf(
    YoinkError,
  );
  expect(await Bun.file(configPath()).exists()).toBe(false);
});

test("restore refuses undeclared snapshot keys and damaged identities", async () => {
  await writeConfig(twoUserConfig(alice));
  const backend = backendWith();
  await expect(backend.restore({ files: { "config.json": "{}" } })).rejects.toThrow(/Refusing to touch "config.json"/);
  await expect(backend.restore({ files: { "../identity.json": "{}" } })).rejects.toBeInstanceOf(YoinkError);
  await expect(backend.restore({ files: { "identity.json": "nope" } })).rejects.toThrow(/damaged/);
  await expect(backend.restore({ files: { "identity.json": JSON.stringify({ login: "alice" }) } })).rejects.toThrow(
    /damaged/,
  );
  expect((await readConfig()).last_logged_in_user).toEqual(alice);
});

test("restore of an empty snapshot clears only the active user", async () => {
  const original = twoUserConfig(alice);
  await writeConfig(original);
  await backendWith().restore({ files: {} });
  const { last_logged_in_user: _cleared, ...expected } = original;
  expect(await readConfig()).toEqual(expected);
  expect(await backendWith().capture()).toBeNull();
});

test("restore of an empty snapshot with no config does nothing", async () => {
  await backendWith().restore({ files: {} });
  expect(await Bun.file(configPath()).exists()).toBe(false);
});

test("capture then restore round trips between two users", async () => {
  const backend = backendWith();
  await writeConfig(twoUserConfig(alice));
  const asAlice = await backend.capture();
  await backend.restore({ files: { "identity.json": JSON.stringify(bob) } });
  const asBob = await backend.capture();
  expect(asBob?.identity.label).toBe("Bob");
  if (!asAlice) throw new Error("expected a capture");
  await backend.restore(asAlice.snapshot);
  expect(await backend.capture()).toEqual(asAlice);
  expect(await readConfig()).toEqual(twoUserConfig(alice));
});

test("written config is 0600 and unrelated files in the home are untouched", async () => {
  await writeConfig(twoUserConfig(alice));
  if (isPosix) await chmod(configPath(), 0o644);
  await Bun.write(join(copilotHome, "history-session-state", "s1.json"), "session");
  await Bun.write(join(copilotHome, "mcp-config.json"), "{\"servers\":{}}");
  await backendWith().restore({ files: { "identity.json": JSON.stringify(bob) } });
  expect(await Bun.file(join(copilotHome, "history-session-state", "s1.json")).text()).toBe("session");
  expect(await Bun.file(join(copilotHome, "mcp-config.json")).text()).toBe("{\"servers\":{}}");
  await expectMode(configPath(), 0o600);
});

test("restore writes to COPILOT_HOME when it is set", async () => {
  const custom = join(root, "custom");
  copilotHome = custom;
  await writeConfig(twoUserConfig(alice));
  await backendWith({ COPILOT_HOME: custom }).restore({ files: { "identity.json": JSON.stringify(bob) } });
  expect((await readConfig()).last_logged_in_user).toEqual(bob);
  expect(await Bun.file(join(root, ".copilot", "config.json")).exists()).toBe(false);
});

test("token environment variables produce an override notice", () => {
  expect(copilotTokenOverrideNotice({})).toBeNull();
  expect(copilotTokenOverrideNotice({ GH_TOKEN: "" })).toBeNull();
  expect(copilotTokenOverrideNotice({ GH_TOKEN: "x" })).toBe(
    "GH_TOKEN is set and overrides the stored GitHub Copilot login. Unset it for the switch to take effect.",
  );
  const both = copilotTokenOverrideNotice({ COPILOT_GITHUB_TOKEN: "secret-one", GITHUB_TOKEN: "secret-two" });
  expect(both).toBe(
    "COPILOT_GITHUB_TOKEN, GITHUB_TOKEN are set and override the stored GitHub Copilot login. Unset them for the switch to take effect.",
  );
  expect(both).not.toContain("secret");
  expect(backendWith({ GITHUB_TOKEN: "y" }).postSwitchNotice()).toContain("GITHUB_TOKEN");
  expect(backendWith().postSwitchNotice()).toBeNull();
});
