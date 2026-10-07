import { expect, test } from "bun:test";
import type { SubscriptionSnapshot } from "../src/features/profiles/types";
import {
  createSubscriptionLoginService,
  describeFailedLogin,
  loginChanged,
  RestoreFailedError,
} from "../src/features/subscriptions/add-login";
import { requireBackend, unsupportedToolMessage } from "../src/features/subscriptions/registry";
import type { PreserveResult } from "../src/features/subscriptions/switch";
import type { SubscriptionBackend, SubscriptionCapture } from "../src/features/subscriptions/types";

type FakeState = { live: SubscriptionSnapshot | null; restored: SubscriptionSnapshot[]; prepared: number; steps: string[] };

const capture = (snapshot: SubscriptionSnapshot | null): SubscriptionCapture | null =>
  snapshot === null ? null : { snapshot, identity: { label: snapshot.files["auth.json"] ?? "none" } };

const fakeBackend = (state: FakeState): SubscriptionBackend => ({
  tool: "kimi",
  label: "Kimi Code",
  home: () => "/nonexistent",
  detect: async () => true,
  capture: async () => capture(state.live),
  restore: async (snapshot) => {
    state.restored.push(snapshot);
    state.live = snapshot;
  },
  prepareLogin: async () => {
    state.prepared++;
    state.live = null;
  },
  loginCommand: () => ["fake-kimi", "login"],
  processMatcher: { names: ["fake-kimi"] },
});

const service = (state: FakeState, runLogin: () => Promise<void>) =>
  createSubscriptionLoginService({
    backends: [fakeBackend(state)],
    syncCurrentSubscription: async () => {
      state.steps.push("sync");
    },
    preserveLiveLogin: async (): Promise<PreserveResult> => {
      state.steps.push("preserve");
      return { kind: "none" };
    },
    runLogin,
  });

const OLD: SubscriptionSnapshot = { files: { "auth.json": "old" } };
const NEW: SubscriptionSnapshot = { files: { "auth.json": "new" } };

const freshState = (): FakeState => ({ live: OLD, restored: [], prepared: 0, steps: [] });

test("prepare syncs, preserves, snapshots and then prepares the login", async () => {
  const state = freshState();
  const preparation = await service(state, async () => {}).prepareSubscriptionLogin("kimi");
  expect(state.steps).toEqual(["sync", "preserve"]);
  expect(preparation.before?.snapshot).toEqual(OLD);
  expect(state.prepared).toBe(1);
  expect(state.live).toBeNull();
});

test("a successful login returns the new capture without restoring", async () => {
  const state = freshState();
  const logins = service(state, async () => {
    state.live = NEW;
  });
  const after = await logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi"));
  expect(after?.snapshot).toEqual(NEW);
  expect(state.restored).toEqual([]);
});

test("a failed login restores the previous login and rethrows", async () => {
  const state = freshState();
  const logins = service(state, async () => {
    throw new Error("login exited 1");
  });
  const preparation = await logins.prepareSubscriptionLogin("kimi");
  await expect(logins.runPreparedLogin(preparation)).rejects.toThrow("login exited 1");
  expect(state.restored).toEqual([OLD]);
  expect(state.live).toEqual(OLD);
});

test("a login that leaves nothing behind restores the previous login", async () => {
  const state = freshState();
  const logins = service(state, async () => {});
  expect(await logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi"))).toBeNull();
  expect(state.live).toEqual(OLD);
});

test("with no previous login there is nothing to restore", async () => {
  const state: FakeState = { live: null, restored: [], prepared: 0, steps: [] };
  const logins = service(state, async () => {
    throw new Error("boom");
  });
  const preparation = await logins.prepareSubscriptionLogin("kimi");
  await expect(logins.runPreparedLogin(preparation)).rejects.toThrow("boom");
  expect(state.restored).toEqual([]);
});

test("loginChanged compares snapshots regardless of key order", () => {
  const before = capture({ files: { a: "1", b: "2" } });
  expect(loginChanged(before, { snapshot: { files: { b: "2", a: "1" } }, identity: { label: "x" } })).toBe(false);
  expect(loginChanged(before, { snapshot: { files: { a: "1", b: "3" } }, identity: { label: "x" } })).toBe(true);
  expect(loginChanged(null, { snapshot: { files: {} }, identity: { label: "x" } })).toBe(true);
});

test("prepare rejects a tool with no registered backend before touching any login", async () => {
  const state = freshState();
  await expect(service(state, async () => {}).prepareSubscriptionLogin("codex")).rejects.toThrow(
    unsupportedToolMessage("codex"),
  );
  expect(state.steps).toEqual([]);
  expect(state.prepared).toBe(0);
});

test("requireBackend returns the registered backend or throws the shared unsupported message", () => {
  const backend = fakeBackend(freshState());
  expect(requireBackend("kimi", [backend])).toBe(backend);
  expect(() => requireBackend("gemini", [backend])).toThrow("yoink does not support gemini logins yet.");
});

const failingRestoreService = (state: FakeState, preserved: PreserveResult, runLogin: () => Promise<void>) =>
  createSubscriptionLoginService({
    backends: [
      {
        ...fakeBackend(state),
        restore: async () => {
          throw new Error("keychain locked");
        },
      },
    ],
    syncCurrentSubscription: async () => {},
    preserveLiveLogin: async (): Promise<PreserveResult> => preserved,
    runLogin,
  });

const savedOld = (): PreserveResult => ({
  kind: "saved",
  profile: { type: "kimi", name: "kimi-old", snapshot: OLD, identity: { label: "old" }, updatedAt: "2026-01-01T00:00:00.000Z" },
});

test("a failed restore after a failed login reports which profile still holds the previous login", async () => {
  const state = freshState();
  const logins = failingRestoreService(state, savedOld(), async () => {
    throw new Error("login exited 1");
  });
  const preparation = await logins.prepareSubscriptionLogin("kimi");
  const error = await logins.runPreparedLogin(preparation).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(RestoreFailedError);
  expect(error instanceof RestoreFailedError ? error.holderName : null).toBe("kimi-old");
  const message = describeFailedLogin(preparation, error);
  expect(message).toContain("login exited 1");
  expect(message).toContain("keychain locked");
  expect(message).toContain("yoink use kimi-old");
  expect(message).not.toContain("was restored");
});

test("a failed restore after an empty login is reported once, not retried", async () => {
  const state = freshState();
  let attempts = 0;
  const logins = createSubscriptionLoginService({
    backends: [
      {
        ...fakeBackend(state),
        restore: async () => {
          attempts++;
          throw new Error("disk full");
        },
      },
    ],
    syncCurrentSubscription: async () => {},
    preserveLiveLogin: async (): Promise<PreserveResult> => savedOld(),
    runLogin: async () => {},
  });
  const preparation = await logins.prepareSubscriptionLogin("kimi");
  await expect(logins.runPreparedLogin(preparation)).rejects.toThrow(RestoreFailedError);
  expect(attempts).toBe(1);
});

test("a failed restore while preparing tells the user how to recover", async () => {
  const state = freshState();
  const logins = createSubscriptionLoginService({
    backends: [
      {
        ...fakeBackend(state),
        prepareLogin: async () => {
          throw new Error("cannot move credentials");
        },
        restore: async () => {
          throw new Error("read-only home");
        },
      },
    ],
    syncCurrentSubscription: async () => {},
    preserveLiveLogin: async (): Promise<PreserveResult> => savedOld(),
    runLogin: async () => {},
  });
  await expect(logins.prepareSubscriptionLogin("kimi")).rejects.toThrow("yoink use kimi-old");
});

test("describeFailedLogin only claims a restore when one succeeded", async () => {
  const state = freshState();
  const logins = service(state, async () => {});
  const preparation = await logins.prepareSubscriptionLogin("kimi");
  expect(describeFailedLogin(preparation, new Error("login exited 1"))).toBe(
    "login exited 1 Your previous login was restored.",
  );
  expect(describeFailedLogin({ ...preparation, before: null }, new Error("boom"))).toBe("boom");
  const restoreFailure = new RestoreFailedError("Kimi Code", "boom", new Error("locked"), null);
  expect(describeFailedLogin(preparation, restoreFailure)).not.toContain("was restored");
});

type HookCalls = { backendRestores: number; finishes: number };

const hookedService = (state: FakeState, calls: HookCalls, restoredByBackend: boolean, runLogin: () => Promise<void>) =>
  createSubscriptionLoginService({
    backends: [
      {
        ...fakeBackend(state),
        restoreAfterFailedLogin: async () => {
          calls.backendRestores++;
          if (restoredByBackend) state.live = OLD;
          return restoredByBackend;
        },
        finishLogin: async () => {
          calls.finishes++;
        },
      },
    ],
    syncCurrentSubscription: async () => {},
    preserveLiveLogin: async (): Promise<PreserveResult> => ({ kind: "none" }),
    runLogin,
  });

test("a failed login prefers the backend's own restore over the snapshot rewrite", async () => {
  const state = freshState();
  const calls: HookCalls = { backendRestores: 0, finishes: 0 };
  const logins = hookedService(state, calls, true, async () => {
    throw new Error("login exited 1");
  });
  await expect(logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi"))).rejects.toThrow("login exited 1");
  expect(calls).toEqual({ backendRestores: 1, finishes: 0 });
  expect(state.restored).toEqual([]);
  expect(state.live).toEqual(OLD);
});

test("the snapshot restore still runs when the backend has nothing of its own to restore", async () => {
  const state = freshState();
  const calls: HookCalls = { backendRestores: 0, finishes: 0 };
  const logins = hookedService(state, calls, false, async () => {});
  expect(await logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi"))).toBeNull();
  expect(calls).toEqual({ backendRestores: 1, finishes: 0 });
  expect(state.restored).toEqual([OLD]);
});

test("a successful login lets the backend finish without restoring", async () => {
  const state = freshState();
  const calls: HookCalls = { backendRestores: 0, finishes: 0 };
  const logins = hookedService(state, calls, true, async () => {
    state.live = NEW;
  });
  expect((await logins.runPreparedLogin(await logins.prepareSubscriptionLogin("kimi")))?.snapshot).toEqual(NEW);
  expect(calls).toEqual({ backendRestores: 0, finishes: 1 });
});
