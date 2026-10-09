import AxeBuilder from "@axe-core/playwright";
import type { ConsoleMessage, Locator, Page } from "@playwright/test";
import { DOC_ALIASES, INDEXABLE_PATHS, docPath, withTrailingSlash, type DocAlias } from "../src/shared/lib/routes";

export type AliasRoute = {
  path: string;
  target: string;
};

export const VIEWPORT_WIDTHS: readonly number[] = [360, 375, 768, 1280];

export const VIEWPORT_HEIGHT = 900;

export const NOT_FOUND_PATH = "/this-page-does-not-exist/";

export const ALIAS_ROUTES: readonly AliasRoute[] = (Object.keys(DOC_ALIASES) as DocAlias[]).map((alias) => ({
  path: withTrailingSlash(`/docs/${alias}`),
  target: docPath(DOC_ALIASES[alias]),
}));

export const PAGE_PATHS: readonly string[] = INDEXABLE_PATHS;

export const DOC_PAGE_PATHS: readonly string[] = INDEXABLE_PATHS.filter((path) => path.startsWith("/docs/"));

export type ConsoleErrorTracker = {
  errors: () => readonly string[];
};

const describeMessage = (message: ConsoleMessage): string => {
  const location = message.location();
  return location.url.length > 0 ? `${message.text()} (${location.url}:${location.lineNumber})` : message.text();
};

export const trackConsoleErrors = (page: Page, ignore: (message: ConsoleMessage) => boolean = () => false): ConsoleErrorTracker => {
  const collected: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !ignore(message)) collected.push(describeMessage(message));
  });
  page.on("pageerror", (error) => collected.push(`pageerror: ${error.message}`));
  return { errors: () => collected };
};

export type OverflowReport = {
  scrollWidth: number;
  clientWidth: number;
  offenders: readonly string[];
};

export const measureHorizontalOverflow = (page: Page): Promise<OverflowReport> =>
  page.evaluate(() => {
    const root = document.documentElement;
    const clientWidth = root.clientWidth;
    const describe = (element: Element): string => {
      const id = element.id.length > 0 ? `#${element.id}` : "";
      const className = typeof element.className === "string" ? element.className.trim().split(/\s+/).slice(0, 3) : [];
      const classes = className.length > 0 && className[0] !== "" ? `.${className.join(".")}` : "";
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const offenders = [...document.body.querySelectorAll("*")]
      .filter((element) => element.getBoundingClientRect().right > clientWidth + 1)
      .filter((element) => {
        const parent = element.parentElement;
        return parent === null || parent.getBoundingClientRect().right <= clientWidth + 1;
      })
      .slice(0, 5)
      .map(describe);
    return { scrollWidth: root.scrollWidth, clientWidth, offenders };
  });

export const formatAxeViolations = (violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string =>
  violations
    .map((violation) => {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => `    ${node.target.join(" ")}`)
        .join("\n");
      return `  ${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n${targets}`;
    })
    .join("\n");

export const scanAccessibility = async (page: Page): Promise<string> => {
  const results = await new AxeBuilder({ page }).analyze();
  return formatAxeViolations(results.violations);
};

export const DEMO_GROUP_SELECTOR = '[role="group"][aria-roledescription="interactive demo"]';

export const VISIBLE_DEMO_GROUP_SELECTOR = `${DEMO_GROUP_SELECTOR}:visible`;

export const DEMO_FOCUS_XPATH = "xpath=descendant-or-self::*[@data-demo-focus]";

export const demoFocusTarget = (group: Locator): Locator => group.locator(DEMO_FOCUS_XPATH).first();

export const DARK_PROJECT = "chromium-dark";

export const REDUCED_MOTION_PROJECT = "reduced-motion";
