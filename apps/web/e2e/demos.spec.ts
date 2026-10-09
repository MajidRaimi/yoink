import { expect, test, type Locator, type Page } from "@playwright/test";
import { DEMO_IDS } from "../src/shared/contract";
import { DEMO_GROUP_SELECTOR, DOC_PAGE_PATHS, VIEWPORT_HEIGHT } from "./support";

const DEMO_PATHS: readonly string[] = ["/", ...DOC_PAGE_PATHS];

const ACTIVE_LISTBOX_SELECTOR = '[role="listbox"][aria-activedescendant]';

const statusOf = (group: Locator): Locator => group.getByRole("status");

const activeDescendantOf = async (group: Locator): Promise<string | null> => {
  const listbox = group.locator(ACTIVE_LISTBOX_SELECTOR).first();
  return (await listbox.count()) === 0 ? null : listbox.getAttribute("aria-activedescendant");
};

const scrollYOf = (page: Page): Promise<number> => page.evaluate(() => window.scrollY);

const exerciseDemo = async (page: Page, group: Locator): Promise<void> => {
  await group.scrollIntoViewIfNeeded();
  await expect(group, "demo becomes interactive").toHaveAttribute("tabindex", "0");
  await group.focus();
  await expect(group).toBeFocused();
  const status = statusOf(group);
  await expect(status).toHaveAttribute("aria-live", "polite");

  const descendantBefore = await activeDescendantOf(group);
  await page.keyboard.press("j");
  if (descendantBefore !== null) {
    await expect
      .poll(() => activeDescendantOf(group), { message: "j moves the listbox selection" })
      .not.toBe(descendantBefore);
  }

  const scrollBefore = await scrollYOf(page);
  await page.keyboard.press("ArrowDown");
  expect(await scrollYOf(page), "ArrowDown is handled by the demo, not the page").toBe(scrollBefore);

  const statusBefore = (await status.textContent()) ?? "";
  await page.keyboard.press("Enter");
  await expect(status, "Enter updates the live region").not.toHaveText(statusBefore);
  await expect(group).toBeFocused();
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: VIEWPORT_HEIGHT });
});

for (const path of DEMO_PATHS) {
  test(`demos on ${path} respond to the keyboard`, async ({ page }) => {
    await page.goto(path, { waitUntil: "load" });
    const groups = page.locator(DEMO_GROUP_SELECTOR);
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
