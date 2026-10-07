import { expect, test } from "bun:test";
import type { ProfileStore } from "../src/features/profiles/types";
import { SubscriptionSwitchRefusedError, type SwitchSubscriptionOptions } from "../src/features/subscriptions/switch";
import type { SubscriptionBackend } from "../src/features/subscriptions/types";
import { createUseProfile, type UseProfileDeps } from "../src/features/switch/use-profile";
import { YoinkError } from "../src/shared/errors";
import { mixedStore } from "./support/account-fixture";

type Calls = { claude: string[]; subscription: [string, SwitchSubscriptionOptions | undefined][]; confirms: number };

const harness = (
  store: ProfileStore,
  options: { confirm?: boolean; subscriptionSwitched?: boolean; notice?: string } = {},
) => {
  const calls: Calls = { claude: [], subscription: [], confirms: 0 };
  const deps: UseProfileDeps = {
    loadStore: async () => store,
    assertClaudeSwitchable: async () => {},
    confirmClaudeRunning: async () => {
      calls.confirms++;
      return options.confirm ?? true;
    },
    switchClaude: async (name) => {
      calls.claude.push(name);
      const profile = store.profiles[name];
      if (!profile) throw new Error("missing");
      return { profile, switched: true };
    },
    switchSubscription: async (name, switchOptions) => {
      calls.subscription.push([name, switchOptions]);
      const profile = store.profiles[name];
      if (!profile || profile.type !== "codex") throw new Error("not codex");
      return { profile, switched: options.subscriptionSwitched ?? true, notice: options.notice ?? null };
    },
  };
  return { use: createUseProfile(deps), calls };
};

test("a subscription profile routes to the subscription switch and passes --force", async () => {
  const { use, calls } = harness(mixedStore());
  const outcome = await use("cx-work", { force: true });
  expect(outcome.kind).toBe("switched");
  expect(calls.subscription).toEqual([["cx-work", { force: true }]]);
  expect(calls.claude).toEqual([]);
  expect(calls.confirms).toBe(0);
});

test("a subscription that is already live reports already", async () => {
  const { use } = harness(mixedStore(), { subscriptionSwitched: false });
  expect((await use("cx-personal")).kind).toBe("already");
});

test("a Claude profile routes to the Claude switch after the running check", async () => {
  const { use, calls } = harness(mixedStore());
  expect((await use("home")).kind).toBe("switched");
  expect(calls.claude).toEqual(["home"]);
  expect(calls.confirms).toBe(1);
  expect(calls.subscription).toEqual([]);
});

test("--force skips the Claude running check and a declined check cancels", async () => {
  const forced = harness(mixedStore(), { confirm: false });
  expect((await forced.use("home", { force: true })).kind).toBe("switched");
  expect(forced.calls.confirms).toBe(0);

  const declined = harness(mixedStore(), { confirm: false });
  expect((await declined.use("home")).kind).toBe("cancelled");
  expect(declined.calls.claude).toEqual([]);
});

test("the active Claude profile is already on and an unknown name fails", async () => {
  const { use, calls } = harness(mixedStore());
  expect((await use("work")).kind).toBe("already");
  expect(calls.claude).toEqual([]);
  await expect(use("nope")).rejects.toThrow(YoinkError);
});

test("a refused subscription switch surfaces the refusal", async () => {
  const store = mixedStore();
  const backend = { label: "ChatGPT (Codex)" } as SubscriptionBackend;
  const use = createUseProfile({
    loadStore: async () => store,
    assertClaudeSwitchable: async () => {},
    confirmClaudeRunning: async () => true,
    switchClaude: async () => {
      throw new Error("unexpected");
    },
    switchSubscription: async () => {
      throw new SubscriptionSwitchRefusedError(backend);
    },
  });
  await expect(use("cx-work")).rejects.toThrow(/--force/);
});

test("a subscription switch carries the backend notice and a Claude switch carries none", async () => {
  const { use } = harness(mixedStore(), { notice: "GH_TOKEN is set" });
  expect(await use("cx-work")).toMatchObject({ kind: "switched", notice: "GH_TOKEN is set" });
  const already = harness(mixedStore(), { subscriptionSwitched: false, notice: "GH_TOKEN is set" });
  expect(await already.use("cx-personal")).toMatchObject({ kind: "already", notice: "GH_TOKEN is set" });
  expect(await use("home")).toMatchObject({ kind: "switched", notice: null });
  expect(await use("work")).toMatchObject({ kind: "already", notice: null });
});
