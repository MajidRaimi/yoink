import { expect, test } from "bun:test";
import { assertClaudeSaveTarget, claudeSaveConflict, createSaveProfile } from "../src/features/profiles/service";
import type { Profile, ProfileStore } from "../src/features/profiles/types";
import { YoinkError } from "../src/shared/errors";
import { claudeProfile, mixedStore } from "./support/account-fixture";
import { makeProvider } from "./support/provider-fixture";

type SaveHarness = {
  saved: ProfileStore[];
  clears: number;
  save: (name: string) => Promise<Profile>;
};

const saveHarness = (store: ProfileStore): SaveHarness => {
  const harness: SaveHarness = {
    saved: [],
    clears: 0,
    save: createSaveProfile({
      store: {
        loadStore: async () => structuredClone(store),
        saveStore: async (next) => {
          harness.saved.push(structuredClone(next));
        },
      },
      snapshotLiveLogin: async (name) => claudeProfile(name, "live@example.com"),
      clearExternalEnv: async () => {
        harness.clears += 1;
      },
    }),
  };
  return harness;
};

test("saving a Claude login over a subscription profile is refused", () => {
  const store = mixedStore();
  expect(() => assertClaudeSaveTarget(store, "cx-personal")).toThrow(YoinkError);
  expect(() => assertClaudeSaveTarget(store, "kimi-main")).toThrow(/already exists for something else/);
  expect(store.currentByTool?.codex).toBe("cx-personal");
});

test("saving a Claude login over a provider profile is refused", () => {
  const store = mixedStore();
  expect(() => assertClaudeSaveTarget(store, "fuse")).toThrow(/already exists for something else/);
  expect(claudeSaveConflict(Object.values(store.profiles), "fuse")).toMatch(/already exists for something else/);
});

test("saving a Claude login over a Claude profile or a fresh name is allowed", () => {
  const store = mixedStore();
  expect(() => assertClaudeSaveTarget(store, "work")).not.toThrow();
  expect(() => assertClaudeSaveTarget(store, "brand-new")).not.toThrow();
  expect(claudeSaveConflict(Object.values(store.profiles), "home")).toBeUndefined();
});

test("saving while a provider is current releases Claude Code from it", async () => {
  const store = mixedStore();
  store.current = "fuse";
  store.profiles.fuse = makeProvider({
    connections: { "claude-code": { connectedAt: "2026-01-01T00:00:00.000Z", defaultModel: "m" }, pi: { connectedAt: "2026-01-01T00:00:00.000Z" } },
  });
  const harness = saveHarness(store);

  await harness.save("fresh");

  expect(harness.clears).toBe(1);
  const saved = harness.saved.at(-1);
  expect(saved?.current).toBe("fresh");
  const provider = saved?.profiles.fuse;
  expect(provider?.type === "external" ? Object.keys(provider.connections ?? {}) : []).toEqual(["pi"]);
});

test("saving while a Claude profile is current leaves Claude Code settings alone", async () => {
  const harness = saveHarness(mixedStore());

  await harness.save("work");

  expect(harness.clears).toBe(0);
  expect(harness.saved.at(-1)?.current).toBe("work");
});

test("saving over a provider name changes nothing", async () => {
  const harness = saveHarness(mixedStore());

  await expect(harness.save("fuse")).rejects.toThrow(YoinkError);
  expect(harness.saved).toHaveLength(0);
  expect(harness.clears).toBe(0);
});
