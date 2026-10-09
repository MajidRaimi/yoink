import { expect, test, type Page } from "@playwright/test";
import { DEMO_IDS } from "../src/shared/contract";
import {
  DEMO_GROUP_SELECTOR,
  REDUCED_MOTION_PROJECT,
  VIEWPORT_HEIGHT,
  VISIBLE_DEMO_GROUP_SELECTOR,
  demoFocusTarget,
} from "./support";

const SETTLE_WINDOW_MS = 2_000;

const demoStatuses = (page: Page): Promise<readonly string[]> =>
  page.locator(`${DEMO_GROUP_SELECTOR} [role="status"]`).allTextContents();

const runningAnimations = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => animation.playState === "running")
      .map((animation) => {
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        const name = animation instanceof CSSAnimation ? animation.animationName : animation.id;
        const element = target === null ? "unknown" : target.tagName.toLowerCase();
        const classes = target?.getAttribute("class") ?? "";
        return `${name.length > 0 ? name : "animation"} on ${element} ${classes}`.trim();
      }),
  );

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== REDUCED_MOTION_PROJECT, "reduced motion assertions run only in the reduced-motion project");
  await page.setViewportSize({ width: 1280, height: VIEWPORT_HEIGHT });
  await page.goto("/", { waitUntil: "load" });
});

test("demos hold their frame without input", async ({ page }) => {
  const groups = page.locator(VISIBLE_DEMO_GROUP_SELECTOR);
  await expect(groups).toHaveCount(DEMO_IDS.length);
  for (const group of await groups.all()) {
    await group.scrollIntoViewIfNeeded();
    await expect(demoFocusTarget(group), "demo hydrates").toHaveAttribute("tabindex", "0");
  }
  const before = await demoStatuses(page);
  await page.waitForTimeout(SETTLE_WINDOW_MS);
  expect(await demoStatuses(page), "demo status text without input").toEqual(before);
});

test("the landing page runs no animations", async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await runningAnimations(page), "running animations").toEqual([]);
});
