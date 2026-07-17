import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // The dev server compiles routes on demand, and the webServer readiness probe
  // only warms /dashboard. A long flow that visits ~20 further routes pays the
  // first-compile cost mid-test, so the 30s default leaves no headroom.
  timeout: 90_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    // Sandboxed CI images often pre-install a single Chromium that does not
    // match this Playwright version's registry; allow pointing at it directly.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000/dashboard",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
