import { expect, test, type Locator, type Page } from "@playwright/test";
import { DEMO_IDS } from "../src/shared/contract";
import { DOC_PAGE_PATHS, VIEWPORT_HEIGHT, VISIBLE_DEMO_GROUP_SELECTOR, demoFocusTarget } from "./support";

const DEMO_PATHS: readonly string[] = ["/", ...DOC_PAGE_PATHS];

const statusOf = (group: Locator): Locator => group.getByRole("status");

const activeDescendantOf = (target: Locator): Promise<string | null> => target.getAttribute("aria-activedescendant");

const scrollYOf = (page: Page): Promise<number> => page.evaluate(() => window.scrollY);

const exerciseDemo = async (page: Page, group: Locator): Promise<void> => {
  await expect(async () => {
    await group.scrollIntoViewIfNeeded({ timeout: 2_000 });
  }, "demo scrolls into view while its island swaps in").toPass();
  const target = demoFocusTarget(group);
  await expect(target, "demo becomes interactive").toHaveAttribute("tabindex", "0");
  await target.focus();
  await expect(target).toBeFocused();
  const status = statusOf(group);
  await expect(status).toHaveAttribute("aria-live", "polite");

  const descendantBefore = await activeDescendantOf(target);
  await page.keyboard.press("j");
  if (descendantBefore !== null) {
    await expect
      .poll(() => activeDescendantOf(target), { message: "j moves the listbox selection" })
      .not.toBe(descendantBefore);
  }

  const scrollBefore = await scrollYOf(page);
  await page.keyboard.press("ArrowDown");
  expect(await scrollYOf(page), "ArrowDown is handled by the demo, not the page").toBe(scrollBefore);

  const statusBefore = (await status.textContent()) ?? "";
  await page.keyboard.press("Enter");
  await expect(status, "Enter updates the live region").not.toHaveText(statusBefore);
  await expect(target).toBeFocused();
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: VIEWPORT_HEIGHT });
});

for (const path of DEMO_PATHS) {
  test(`demos on ${path} respond to the keyboard`, async ({ page }) => {
    await page.goto(path, { waitUntil: "load" });
    const groups = page.locator(VISIBLE_DEMO_GROUP_SELECTOR);
    if (path === "/") {
      await expect(groups).toHaveCount(DEMO_IDS.length);
    }
    const count = await groups.count();
    test.skip(count === 0, `no demos on ${path}`);
    for (let index = 0; index < count; index += 1) {
      await test.step(`demo ${index + 1} of ${count}`, () => exerciseDemo(page, groups.nth(index)));
    }
  });
}
