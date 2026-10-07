import { describe, expect, test } from "bun:test";
import { connectNotices } from "../src/features/providers/connect-notices";
import type { HarnessId, HarnessStatus } from "../src/shared/types";

const status = (id: HarnessId, overrides: Partial<HarnessStatus> = {}): HarnessStatus => ({
  id,
  label: id,
  installed: true,
  configPath: `/tmp/${id}`,
  compatible: true,
  connected: true,
  parseError: null,
  exclusive: false,
  experimental: false,
  notice: null,
  defaultModel: null,
  ...overrides,
});

describe("connectNotices", () => {
  test("lists notices for connected harnesses picked in the wizard", () => {
    const statuses = [
      status("zed", { label: "Zed", notice: "Set ACME_API_KEY before launching Zed." }),
      status("goose", { label: "Goose", notice: "Export CUSTOM_ACME_API_KEY." }),
      status("pi"),
    ];
    expect(connectNotices(statuses, ["zed", "goose", "pi"])).toEqual([
      { id: "zed", label: "Zed", notice: "Set ACME_API_KEY before launching Zed." },
      { id: "goose", label: "Goose", notice: "Export CUSTOM_ACME_API_KEY." },
    ]);
  });

  test("skips harnesses that were not picked or did not connect", () => {
    const statuses = [
      status("zed", { notice: "zed notice" }),
      status("goose", { connected: false, notice: "goose notice" }),
    ];
    expect(connectNotices(statuses, ["goose"])).toEqual([]);
  });

  test("returns nothing when no harness was picked", () => {
    expect(connectNotices([status("zed", { notice: "zed notice" })], [])).toEqual([]);
  });
});
