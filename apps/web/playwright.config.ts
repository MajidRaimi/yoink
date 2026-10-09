import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;
const isCi = process.env.CI !== undefined && process.env.CI !== "";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 2 : undefined,
  reporter: isCi ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `bunx serve out -l ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCi,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium-light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light", reducedMotion: "no-preference" },
    },
    {
      name: "chromium-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark", reducedMotion: "no-preference" },
    },
    {
      name: "reduced-motion",
      use: { ...devices["Desktop Chrome"], colorScheme: "light", reducedMotion: "reduce" },
    },
  ],
});
