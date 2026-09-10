import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Screenshots of the adult area for docs/screens (needs an admin whose password is final):
 *   E2E_ADMIN_PASSWORD=... pnpm exec playwright test e2e/screens.spec.ts
 */
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-0");

test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to capture the adult-area screenshots");

test("admin dashboard, users, health and parent pages render inside the shell", async ({ page }) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USER);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin\/users/);

  for (const [path, file, heading] of [
    ["/admin", "admin-dashboard.png", "Bảng điều khiển"],
    ["/admin/users", "admin-users.png", "Người dùng"],
    ["/admin/health", "admin-health.png", "Sức khoẻ hệ thống"],
    ["/parent", "parent-home.png", "Các con"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Điều hướng chính" })).toBeVisible();
    await page.screenshot({ path: join(SHOTS, file), fullPage: true });
  }

  // Account menu exposes password change and logout.
  await page.getByRole("button", { name: /Admin/ }).click();
  await expect(page.getByRole("menuitem", { name: "Đăng xuất" })).toBeVisible();
});
