import { expect, test } from "@playwright/test";

/** Smoke (docs/08 pha 0): /login renders both entrances and guests are redirected. */
test("login page renders kid cards area and the adult form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Học cùng Mai Thy/ })).toBeVisible();
  await expect(page.getByLabel("Tên đăng nhập")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
});

test("guest is redirected from /parent to /login", async ({ page }) => {
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/login\?next=%2Fparent/);
});

test("wrong username and wrong password show the same message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill("nobody-e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong-password-1");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  const msg1 = await page.locator("p[role=alert]").textContent();

  await page.getByLabel("Tên đăng nhập").fill("admin");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong-password-2");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.locator("p[role=alert]")).toBeVisible();
  const msg2 = await page.locator("p[role=alert]").textContent();
  expect(msg1).toBe(msg2);
});

test("/api/health answers with db status", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.db).toBe("ok");
});
