import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProfileStore, type ProfileStoreRepository } from "../src/features/profiles/store";
import type { ClaudeProfile, SubscriptionProfile, SubscriptionSnapshot } from "../src/features/profiles/types";
import { decodeJwtPayload, stringClaim } from "../src/features/subscriptions/shared/jwt-claims";
import { readSnapshotFiles, restoreSnapshotFiles } from "../src/features/subscriptions/shared/snapshot-files";
import {
  createSubscriptionService,
  SubscriptionSwitchRefusedError,
  type SubscriptionService,
} from "../src/features/subscriptions/switch";
import type { SubscriptionBackend, SubscriptionCapture } from "../src/features/subscriptions/types";
import { YoinkError } from "../src/shared/errors";
import { fakeJwt } from "./support/fake-jwt";

const PATTERNS = ["auth.json"];

let dir: string;
let home: string;
let repository: ProfileStoreRepository;
let running: boolean;
let failRestoreFor: string | null;
let confirmCalls: number;
let notice: string | null | undefined;

const authFor = (email: string, accountId: string, refresh = "r1"): string =>
  JSON.stringify({ tokens: { id_token: fakeJwt({ email, account: accountId }), refresh_token: refresh } });

const captureHome = async (): Promise<SubscriptionCapture | null> => {
  const files = await readSnapshotFiles(home, PATTERNS);
  const auth = files["auth.json"];
  if (auth === undefined) return null;
  const claims = decodeJwtPayload((JSON.parse(auth) as { tokens: { id_token: string } }).tokens.id_token);
  const email = stringClaim(claims, "email");
  const accountId = stringClaim(claims, "account");
  return { snapshot: { files }, identity: { label: email ?? "unknown", email, accountId } };
};

const fakeBackend = (): SubscriptionBackend => ({
  tool: "codex",
  label: "Fake Codex",
  home: () => home,
  detect: async () => true,
  capture: captureHome,
  restore: async (snapshot: SubscriptionSnapshot) => {
    const auth = snapshot.files["auth.json"];
    if (failRestoreFor !== null && auth?.includes("refresh") && auth.includes(failRestoreFor)) {
      await Bun.write(join(home, "auth.json"), "half-written");
      throw new Error("disk full");
    }
    await restoreSnapshotFiles(home, snapshot.files, PATTERNS);
  },
  prepareLogin: async () => {},
  loginCommand: () => ["fake-codex", "login"],
  processMatcher: { names: ["fake-codex"] },
  ...(notice === undefined ? {} : { postSwitchNotice: () => notice ?? null }),
});

const service = (): SubscriptionService =>
  createSubscriptionService({
    store: repository,
    backends: [fakeBackend()],
    isRunning: async () => running,
    confirmRunning: async () => {
      confirmCalls++;
      return false;
    },
    now: () => "2026-02-02T00:00:00.000Z",
  });

const liveAuth = (): Promise<string> => Bun.file(join(home, "auth.json")).text();

const writeLive = (contents: string): Promise<number> => Bun.write(join(home, "auth.json"), contents);

const loadProfile = async (name: string): Promise<SubscriptionProfile> =>
  (await repository.loadStore()).profiles[name] as SubscriptionProfile;

const authA = authFor("a@example.com", "acct-a");
const authB = authFor("b@example.com", "acct-b");

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "yoink-subscriptions-"));
  home = join(dir, "codex-home");
  repository = createProfileStore(join(dir, "profiles.json"));
  running = false;
  failRestoreFor = null;
  confirmCalls = 0;
  notice = undefined;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const saveTwoAccounts = async (): Promise<void> => {
  await writeLive(authA);
  await service().saveSubscription("codex", "a");
  await writeLive(authB);
  await service().saveSubscription("codex", "b");
};

test("saveSubscription snapshots the live login and marks it current for the tool only", async () => {
  await repository.saveStore({ current: "claude", profiles: { claude: { type: "claude", name: "claude", keychain: "k", account: null, updatedAt: "t" } } });
  await writeLive(authA);
  const profile = await service().saveSubscription("codex", "a");
  expect(profile.identity).toEqual({ label: "a@example.com", email: "a@example.com", accountId: "acct-a" });
  expect(profile.snapshot.files["auth.json"]).toBe(authA);
  const store = await repository.loadStore();
  expect(store.current).toBe("claude");
  expect(store.currentByTool).toEqual({ codex: "a" });
});

test("saveSubscription refuses when there is no live login or the name belongs to another type", async () => {
  await expect(service().saveSubscription("codex", "a")).rejects.toThrow("No Fake Codex login");
  const claude: ClaudeProfile = { type: "claude", name: "taken", keychain: "k", account: null, updatedAt: "t" };
  await repository.saveStore({ current: null, profiles: { taken: claude } });
  await writeLive(authA);
  await expect(service().saveSubscription("codex", "taken")).rejects.toBeInstanceOf(YoinkError);
  expect((await repository.loadStore()).profiles.taken).toEqual(claude);
});

test("switchSubscription restores the target and re-captures the matching current login", async () => {
  await saveTwoAccounts();
  const refreshedB = authFor("b@example.com", "acct-b", "r2");
  await writeLive(refreshedB);
  const result = await service().switchSubscription("a");
  expect(result.switched).toBe(true);
  expect(await liveAuth()).toBe(authA);
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(refreshedB);
  expect((await repository.loadStore()).currentByTool).toEqual({ codex: "a" });
});

test("switchSubscription never re-captures a live login that belongs to someone else", async () => {
  await saveTwoAccounts();
  const stranger = authFor("c@example.com", "acct-c");
  await writeLive(stranger);
  await service().switchSubscription("a");
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(authB);
  expect(await liveAuth()).toBe(authA);
});

test("switchSubscription to the current matching profile only refreshes it", async () => {
  await saveTwoAccounts();
  const refreshedB = authFor("b@example.com", "acct-b", "r3");
  await writeLive(refreshedB);
  const result = await service().switchSubscription("b");
  expect(result.switched).toBe(false);
  expect(result.profile.snapshot.files["auth.json"]).toBe(refreshedB);
  expect(await liveAuth()).toBe(refreshedB);
});

test("switchSubscription to the current profile restores it when the live login drifted", async () => {
  await saveTwoAccounts();
  await writeLive(authFor("c@example.com", "acct-c"));
  const result = await service().switchSubscription("b");
  expect(result.switched).toBe(true);
  expect(await liveAuth()).toBe(authB);
});

test("switchSubscription asks when the tool is running and refuses on no", async () => {
  await saveTwoAccounts();
  running = true;
  await expect(service().switchSubscription("a")).rejects.toBeInstanceOf(SubscriptionSwitchRefusedError);
  expect(confirmCalls).toBe(1);
  expect(await liveAuth()).toBe(authB);
  expect((await repository.loadStore()).currentByTool).toEqual({ codex: "b" });
});

test("switchSubscription honours a per-call confirm and --force", async () => {
  await saveTwoAccounts();
  running = true;
  await service().switchSubscription("a", { confirmRunning: async () => true });
  expect(await liveAuth()).toBe(authA);
  await service().switchSubscription("b", { force: true });
  expect(await liveAuth()).toBe(authB);
  expect(confirmCalls).toBe(0);
});

test("switchSubscription rolls back to the captured live login when restore fails", async () => {
  await saveTwoAccounts();
  const brokenTarget = authFor("a@example.com", "acct-a", "refresh-broken");
  const store = await repository.loadStore();
  const a = store.profiles.a as SubscriptionProfile;
  store.profiles.a = { ...a, snapshot: { files: { "auth.json": brokenTarget } } };
  await repository.saveStore(store);
  failRestoreFor = "refresh-broken";
  await expect(service().switchSubscription("a")).rejects.toThrow("disk full");
  expect(await liveAuth()).toBe(authB);
  expect((await repository.loadStore()).currentByTool).toEqual({ codex: "b" });
});

test("switchSubscription rollback clears files when there was no live login", async () => {
  await saveTwoAccounts();
  await rm(join(home, "auth.json"));
  const store = await repository.loadStore();
  const a = store.profiles.a as SubscriptionProfile;
  store.profiles.a = { ...a, snapshot: { files: { "auth.json": authFor("a@example.com", "acct-a", "refresh-broken") } } };
  await repository.saveStore(store);
  failRestoreFor = "refresh-broken";
  await expect(service().switchSubscription("a")).rejects.toThrow("disk full");
  expect(await Bun.file(join(home, "auth.json")).exists()).toBe(false);
});

test("switchSubscription rejects unknown names, non-subscription profiles and unsupported tools", async () => {
  await expect(service().switchSubscription("nope")).rejects.toThrow("No profile named");
  const claude: ClaudeProfile = { type: "claude", name: "c", keychain: "k", account: null, updatedAt: "t" };
  const kimi: SubscriptionProfile = { type: "kimi", name: "k", snapshot: { files: {} }, identity: { label: "kimi:1" }, updatedAt: "t" };
  await repository.saveStore({ current: null, profiles: { c: claude, k: kimi } });
  await expect(service().switchSubscription("c")).rejects.toThrow("not a subscription login");
  await expect(service().switchSubscription("k")).rejects.toThrow("does not support kimi");
});

test("captureForAdd suggests a fresh name or the matching existing profile", async () => {
  expect(await service().captureForAdd("codex")).toBeNull();
  await writeLive(authA);
  const fresh = await service().captureForAdd("codex");
  expect(fresh?.existing).toBeNull();
  expect(fresh?.suggestedName).toBe("codex-a");
  await service().saveSubscription("codex", "work");
  const again = await service().captureForAdd("codex");
  expect(again?.existing?.name).toBe("work");
  expect(again?.suggestedName).toBe("work");
});

test("preserveLiveLogin saves an unmanaged login, refreshes a known one and skips when logged out", async () => {
  expect(await service().preserveLiveLogin("codex")).toEqual({ kind: "none" });
  await writeLive(authA);
  const saved = await service().preserveLiveLogin("codex");
  expect(saved.kind).toBe("saved");
  if (saved.kind === "none") throw new Error("expected a profile");
  expect(saved.profile.name).toBe("codex-a");
  const rotated = authFor("a@example.com", "acct-a", "r9");
  await writeLive(rotated);
  const refreshed = await service().preserveLiveLogin("codex");
  expect(refreshed.kind).toBe("refreshed");
  expect((await loadProfile("codex-a")).snapshot.files["auth.json"]).toBe(rotated);
  expect((await repository.loadStore()).currentByTool).toEqual({ codex: "codex-a" });
});

test("syncCurrentSubscription re-captures only a matching current profile", async () => {
  await saveTwoAccounts();
  const rotated = authFor("b@example.com", "acct-b", "r4");
  await writeLive(rotated);
  await service().syncCurrentSubscription("codex");
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(rotated);
  await writeLive(authFor("z@example.com", "acct-z"));
  await service().syncCurrentSubscription("codex");
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(rotated);
});

const dropCurrentByTool = async (): Promise<void> => {
  const { currentByTool: _dropped, ...rest } = await repository.loadStore();
  await repository.saveStore(rest);
};

test("switchSubscription re-captures the live login by identity when an older writer dropped currentByTool", async () => {
  await saveTwoAccounts();
  await dropCurrentByTool();
  const rotatedB = authFor("b@example.com", "acct-b", "r5");
  await writeLive(rotatedB);
  const result = await service().switchSubscription("a");
  expect(result.switched).toBe(true);
  expect(await liveAuth()).toBe(authA);
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(rotatedB);
  expect((await repository.loadStore()).currentByTool).toEqual({ codex: "a" });
});

test("switchSubscription without currentByTool still skips a live login that matches no profile", async () => {
  await saveTwoAccounts();
  await dropCurrentByTool();
  await writeLive(authFor("c@example.com", "acct-c"));
  await service().switchSubscription("a");
  expect((await loadProfile("a")).snapshot.files["auth.json"]).toBe(authA);
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(authB);
  expect(await liveAuth()).toBe(authA);
});

test("syncCurrentSubscription falls back to the identity match and restores currentByTool", async () => {
  await saveTwoAccounts();
  await dropCurrentByTool();
  const rotatedB = authFor("b@example.com", "acct-b", "r6");
  await writeLive(rotatedB);
  await service().syncCurrentSubscription("codex");
  expect((await loadProfile("b")).snapshot.files["auth.json"]).toBe(rotatedB);
  expect((await repository.loadStore()).currentByTool).toEqual({ codex: "b" });
});

test("switchSubscription reports the backend post-switch notice", async () => {
  await saveTwoAccounts();
  expect((await service().switchSubscription("a")).notice).toBeNull();
  expect(service().postSwitchNotice("codex")).toBeNull();
  notice = "GH_TOKEN is set";
  expect((await service().switchSubscription("b")).notice).toBe("GH_TOKEN is set");
  expect((await service().switchSubscription("b")).notice).toBe("GH_TOKEN is set");
  expect(service().postSwitchNotice("codex")).toBe("GH_TOKEN is set");
  notice = null;
  expect((await service().switchSubscription("a")).notice).toBeNull();
});
