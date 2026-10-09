import { expect, test, type Locator, type Page } from "@playwright/test";
import { site } from "../src/shared/brand/site";
import type { Platform } from "../src/shared/contract";

type EmulatedPlatform = Exclude<Platform, "unknown">;

type PlatformProfile = {
  userAgent: string;
  navigatorPlatform: string;
  clientHintPlatform: string;
  architecture: string;
};

const PROFILES: Readonly<Record<EmulatedPlatform, PlatformProfile>> = {
  mac: {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    navigatorPlatform: "MacIntel",
    clientHintPlatform: "macOS",
    architecture: "arm",
  },
  windows: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    navigatorPlatform: "Win32",
    clientHintPlatform: "Windows",
    architecture: "x86",
  },
  linux: {
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    navigatorPlatform: "Linux x86_64",
    clientHintPlatform: "Linux",
    architecture: "x86",
  },
};

const emulatePlatform = async (page: Page, profile: PlatformProfile): Promise<void> => {
  await page.addInitScript((emulated: PlatformProfile) => {
    const userAgentData = {
      brands: [],
      mobile: false,
      platform: emulated.clientHintPlatform,
      getHighEntropyValues: (): Promise<Record<string, string | boolean>> =>
        Promise.resolve({ platform: emulated.clientHintPlatform, architecture: emulated.architecture, mobile: false }),
      toJSON: (): Record<string, string | boolean> => ({ platform: emulated.clientHintPlatform, mobile: false }),
    };
    Object.defineProperty(Navigator.prototype, "platform", { get: () => emulated.navigatorPlatform, configurable: true });
    Object.defineProperty(Navigator.prototype, "userAgentData", { get: () => userAgentData, configurable: true });
  }, profile);
};

const heroOf = (page: Page): Locator =>
  page
    .locator("section")
    .filter({ has: page.getByRole("heading", { level: 1 }) })
    .first();

const EXPECTATIONS: readonly { platform: EmulatedPlatform; assert: (hero: Locator) => Promise<void> }[] = [
  {
    platform: "mac",
    assert: async (hero) => {
      await expect(hero.getByRole("link", { name: "Download for Mac" }).first()).toBeVisible();
    },
  },
  {
    platform: "windows",
    assert: async (hero) => {
      await expect(hero.getByText(site.installCommandWindows, { exact: false }).first()).toBeVisible();
    },
  },
  {
    platform: "linux",
    assert: async (hero) => {
      await expect(hero.getByText(site.installCommand, { exact: false }).first()).toBeVisible();
    },
  },
];

for (const { platform, assert } of EXPECTATIONS) {
  test.describe(`primary CTA on ${platform}`, () => {
    test.use({ userAgent: PROFILES[platform].userAgent });

    test(`hero shows the ${platform} primary action`, async ({ page }) => {
      await emulatePlatform(page, PROFILES[platform]);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto("/", { waitUntil: "load" });
      await assert(heroOf(page));
    });
  });
}
