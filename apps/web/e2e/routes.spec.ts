import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { site } from "../src/shared/brand/site";
import { absoluteUrl } from "../src/shared/lib/routes";
import {
  ALIAS_ROUTES,
  DARK_PROJECT,
  measureHorizontalOverflow,
  NOT_FOUND_PATH,
  PAGE_PATHS,
  scanAccessibility,
  trackConsoleErrors,
  VIEWPORT_HEIGHT,
  VIEWPORT_WIDTHS,
} from "./support";

const assertThemeApplied = async (page: Page, testInfo: TestInfo): Promise<void> => {
  const html = page.locator("html");
  if (testInfo.project.name === DARK_PROJECT) await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  else await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
};

const assertHealthyPage = async (page: Page, errors: () => readonly string[]): Promise<void> => {
  await expect(page.locator("h1").first()).toBeVisible();
  await assertThemeApplied(page, test.info());
  const overflow = await measureHorizontalOverflow(page);
  expect(
    overflow.scrollWidth,
    `horizontal overflow ${overflow.scrollWidth}px > ${overflow.clientWidth}px, candidates: ${overflow.offenders.join(", ")}`,
  ).toBeLessThanOrEqual(overflow.clientWidth);
  const violations = await scanAccessibility(page);
  expect(violations, `axe violations:\n${violations}`).toBe("");
  expect(errors(), "console errors").toEqual([]);
};

for (const width of VIEWPORT_WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
    });

    for (const path of PAGE_PATHS) {
      test(`page ${path}`, async ({ page }) => {
        const tracker = trackConsoleErrors(page);
        const response = await page.goto(path, { waitUntil: "load" });
        expect(response?.status(), `status for ${path}`).toBe(200);
        await assertHealthyPage(page, tracker.errors);
      });
    }

    for (const alias of ALIAS_ROUTES) {
      test(`alias ${alias.path}`, async ({ page, request }) => {
        const html = await (await request.get(alias.path)).text();
        expect(html).toContain(`url=${alias.target}`);
        expect(html).toContain(`<link rel="canonical" href="${absoluteUrl(site.url, alias.canonical)}"`);
        expect(html).toMatch(/<meta name="robots" content="[^"]*noindex/);
        const tracker = trackConsoleErrors(page);
        await page.goto(alias.path, { waitUntil: "commit" });
        await page.waitForURL((url) => url.pathname === alias.canonical);
        await page.waitForLoadState("load");
        await assertHealthyPage(page, tracker.errors);
      });
    }

    test("not found page", async ({ page }) => {
      const tracker = trackConsoleErrors(
        page,
        (message) => message.text().includes("404") && message.location().url.endsWith(NOT_FOUND_PATH),
      );
      const response = await page.goto(NOT_FOUND_PATH, { waitUntil: "load" });
      expect(response?.status()).toBe(404);
      await assertHealthyPage(page, tracker.errors);
    });
  });
}
