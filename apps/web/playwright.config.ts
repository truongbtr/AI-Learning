import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke e2e (docs/08 pha 0): opens /login against a running server.
 * Start the stack first (`pnpm dev` or docker compose), then `pnpm e2e`.
 * Set E2E_BASE_URL to point elsewhere (default http://localhost:5000).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  // One worker: the login throttle is per IP and tests share 127.0.0.1.
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5000",
    // No locator action may hang for the whole test budget: a covered button is a failure to
    // report, not a reason to wait ten minutes.
    actionTimeout: 10_000,
    trace: "retain-on-failure",
    locale: "vi-VN",
    // E2E_VIDEO=1 records the run — how docs/screens/pha-3 gets its video of a whole session.
    video: process.env.E2E_VIDEO === "1" ? "on" : "off",
  },
  // E2E_CHANNEL=chrome|msedge uses an installed browser (no download); unset → bundled Chromium.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: process.env.E2E_CHANNEL || undefined },
    },
  ],
});
