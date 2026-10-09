import { describe, expect, test } from "bun:test";
import { compareVersions, fallbackDesktop, parseReleases, pickDesktopRelease, serializeRelease } from "./resolve-release";

const release = (tag: string, assetNames: readonly string[], extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  tag_name: tag,
  draft: false,
  prerelease: false,
  assets: assetNames.map((name) => ({ name, browser_download_url: `https://dl.example/${name}` })),
  ...extra,
});

const bothDmgs = (version: string): string[] => [`Yoink_${version}_aarch64.dmg`, `Yoink_${version}_x64.dmg`];

describe("compareVersions", () => {
  test("orders numerically, not lexically", () => {
    expect(compareVersions("0.1.10", "0.1.9")).toBeGreaterThan(0);
    expect(compareVersions("0.2.0", "0.2")).toBe(0);
    expect(compareVersions("1.0.0", "1.0.1")).toBeLessThan(0);
  });
});

describe("pickDesktopRelease", () => {
  test("picks the newest desktop release that ships both DMGs", () => {
    const releases = parseReleases([
      release("v0.6.5", []),
      release("desktop-v0.1.8", ["Yoink_0.1.8_aarch64.dmg"]),
      release("desktop-v0.1.7", bothDmgs("0.1.7")),
      release("desktop-v0.1.9", bothDmgs("0.1.9"), { draft: true }),
      release("desktop-v0.1.6", bothDmgs("0.1.6")),
    ]);
    expect(pickDesktopRelease(releases)).toEqual({
      version: "0.1.7",
      dmg: {
        arm64: "https://dl.example/Yoink_0.1.7_aarch64.dmg",
        x64: "https://dl.example/Yoink_0.1.7_x64.dmg",
      },
    });
  });

  test("returns null when nothing qualifies", () => {
    expect(pickDesktopRelease(parseReleases([release("desktop-v1.0.0", [], { prerelease: true })]))).toBeNull();
  });

  test("ignores malformed payloads", () => {
    expect(parseReleases({ message: "rate limited" })).toEqual([]);
    expect(parseReleases([null, 4, { tag_name: 1 }])).toEqual([]);
  });
});

describe("fallbackDesktop", () => {
  test("builds the standard download URLs", () => {
    expect(fallbackDesktop("0.1.6").dmg).toEqual({
      arm64: "https://github.com/MajidRaimi/yoink/releases/download/desktop-v0.1.6/Yoink_0.1.6_aarch64.dmg",
      x64: "https://github.com/MajidRaimi/yoink/releases/download/desktop-v0.1.6/Yoink_0.1.6_x64.dmg",
    });
  });
});

describe("serializeRelease", () => {
  test("writes stable key order with a trailing newline", () => {
    const text = serializeRelease({ cli: "0.6.5", desktop: fallbackDesktop("0.1.6") });
    expect(text.endsWith("}\n")).toBe(true);
    expect(Object.keys(JSON.parse(text))).toEqual(["cli", "desktop"]);
  });
});
