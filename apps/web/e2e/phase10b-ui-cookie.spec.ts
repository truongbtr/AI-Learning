import { expect, type Page, test } from "@playwright/test";

/**
 * Pha 10b việc 6: one device tries the cities on a server that stays on the old world.
 * Run against a server with KID_UI=world (dev: the `web-world` launch config, port 5002).
 *
 *   $env:E2E_BASE_URL="http://localhost:5002"; pnpm --filter @mtct/web exec playwright test e2e/phase10b-ui-cookie.spec.ts
 */
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const KID = { name: "Mai Thy", pin: ["Mèo", "Thỏ", "Bướm", "Cá"] };

async function adminLogin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USER);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/admin|\/change-password/);
}

async function kidLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: KID.name }).first().click();
  for (const picture of KID.pin) {
    await page.getByRole("button", { name: picture, exact: true }).click();
  }
  await page.waitForURL(/\/kid\/(home|city)/, { timeout: 20_000 });
}

/** Leave the adult session but keep this device's cookies (the override must survive logout). */
async function dropSession(page: Page) {
  const context = page.context();
  const keep = (await context.cookies()).filter((c) => c.name === "mtct_ui");
  await context.clearCookies();
  if (keep.length) await context.addCookies(keep);
}

test("the device cookie turns the cities on for this browser only, and off again", async ({
  page,
  browser,
}) => {
  test.skip(!ADMIN_PASSWORD, "E2E_ADMIN_PASSWORD not set");
  test.setTimeout(120_000);

  // the server itself is on the old world
  await kidLogin(page);
  await expect(page).toHaveURL(/\/kid\/home$/);

  await page.context().clearCookies();
  await adminLogin(page);
  await page.goto("/admin/health");
  await page.getByTestId("kid-ui-city-on").click();
  await expect(page.getByTestId("kid-ui-device-mode")).toContainText("thành phố");
  const cookie = (await page.context().cookies()).find((c) => c.name === "mtct_ui");
  expect(cookie?.value).toBe("city");
  expect(cookie?.httpOnly).toBe(true);
  // about 30 days
  expect((cookie?.expires ?? 0) - Date.now() / 1000).toBeGreaterThan(29 * 86400);

  await dropSession(page);
  await kidLogin(page);
  await page.waitForURL(/\/kid\/city$/);
  await expect(page.getByTestId("world-map")).toBeVisible();

  // another browser (no cookie) still gets the old world
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await kidLogin(otherPage);
  await expect(otherPage).toHaveURL(/\/kid\/home$/);
  await other.close();

  // switching it off again
  await page.context().clearCookies();
  await page.context().addCookies(cookie ? [cookie] : []);
  await adminLogin(page);
  await page.goto("/admin/health");
  await page.getByTestId("kid-ui-city-off").click();
  await expect(page.getByTestId("kid-ui-device-mode")).toContainText("thế giới cũ");
  expect((await page.context().cookies()).some((c) => c.name === "mtct_ui")).toBe(false);
});

test("the server reads the device cookie before KID_UI (no admin needed)", async ({ browser }) => {
  const base = process.env.E2E_BASE_URL ?? "http://localhost:5000";
  const withCookie = await browser.newContext();
  await withCookie.addCookies([{ name: "mtct_ui", value: "city", url: base }]);
  const cityPage = await withCookie.newPage();
  await kidLogin(cityPage);
  await cityPage.waitForURL(/\/kid\/city$/);
  await expect(cityPage.getByTestId("world-map")).toBeVisible();
  await withCookie.close();

  const plain = await browser.newContext();
  const worldPage = await plain.newPage();
  await kidLogin(worldPage);
  await expect(worldPage).toHaveURL(/\/kid\/home$/);
  await plain.close();
});
