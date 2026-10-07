import { expect, test } from "bun:test";
import { assertClaudeSaveTarget } from "../src/features/profiles/service";
import { YoinkError } from "../src/shared/errors";
import { mixedStore } from "./support/account-fixture";

test("saving a Claude login over a subscription profile is refused", () => {
  const store = mixedStore();
  expect(() => assertClaudeSaveTarget(store, "cx-personal")).toThrow(YoinkError);
  expect(() => assertClaudeSaveTarget(store, "kimi-main")).toThrow(/already exists for something else/);
  expect(store.currentByTool?.codex).toBe("cx-personal");
});

test("saving a Claude login over a Claude profile or a fresh name is allowed", () => {
  const store = mixedStore();
  expect(() => assertClaudeSaveTarget(store, "work")).not.toThrow();
  expect(() => assertClaudeSaveTarget(store, "brand-new")).not.toThrow();
});
