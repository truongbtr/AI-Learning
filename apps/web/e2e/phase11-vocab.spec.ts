import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Pha 11 acceptance — Bến Cảng Từ: the vocabulary games and the Sổ từ.
 *
 *   $env:E2E_BASE_URL="http://localhost:5000"; $env:E2E_CHANNEL="msedge"
 *   pnpm --filter @mtct/web exec playwright test e2e/phase11-vocab.spec.ts
 *
 * What it checks: a station plays a game rather than asking a question, tapping a picture keeps
 * the round moving, the word goes into the Sổ từ, and the whole thing obeys the rules of the
 * child's world — no "sai", no score, no countdown, no price.
 *
 * The station is reached through the dev preview rather than by waiting for the planner to pick a
 * vocabulary skill: `/dev/vocab` renders one station with words that are due (admin only).
 */
const KID = { name: "Mai Thy", pin: ["Mèo", "Thỏ", "Bướm", "Cá"] };
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-11");
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;

test.describe.configure({ mode: "serial" });
test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

/** The bench lives under /dev, which is admin-only — the games themselves need no password. */
async function adminLogin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USER);
  await page.getByLabel("Mật khẩu").fill(ADMIN_PASSWORD as string);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/admin/, { timeout: 20_000 });
}

async function kidLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: KID.name }).first().click();
  for (const picture of KID.pin) {
    await page.getByRole("button", { name: picture, exact: true }).click();
  }
  await page.waitForURL(/\/kid\/(home|city)/, { timeout: 20_000 });
}

async function kidSafe(page: Page) {
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toMatch(/\bsai\b/);
  expect(body).not.toMatch(/điểm số|đồng hồ đếm|mua ngay|giá tiền|💰|🪙/);
}

test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to open the /dev/vocab bench");

test("nghe rồi chạm tranh: a round plays, and every tap target is big enough", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/dev/vocab?game=listen-touch");
  const station = page.getByTestId("vocab-station");
  await expect(station).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("vocab-listen-touch")).toBeVisible({ timeout: 20_000 });

  const options = page.getByTestId("vocab-option");
  await expect(options.first()).toBeVisible();
  expect(await options.count()).toBeGreaterThanOrEqual(2);

  // docs/06 §1 rule 2: nothing a child taps is smaller than 64 px
  for (const box of await options.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height),
  )) {
    expect(box).toBeGreaterThanOrEqual(64);
  }

  await options.first().click();
  await page.waitForTimeout(1400);
  await kidSafe(page);
  await page.screenshot({ path: join(SHOTS, "p1-nghe-cham-tranh.png"), fullPage: false });
});

test("lật thẻ tìm đôi: a card turns over and shows its face", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/dev/vocab?game=match-pairs");
  await expect(page.getByTestId("vocab-match-pairs")).toBeVisible({ timeout: 20_000 });

  const cards = page.getByTestId("pair-card");
  expect(await cards.count()).toBe(8);
  await expect(cards.first()).toHaveAttribute("data-open", "false");
  await cards.first().click();
  await expect(cards.first()).toHaveAttribute("data-open", "true", { timeout: 5_000 });

  await kidSafe(page);
  await page.screenshot({ path: join(SHOTS, "p2-lat-the-tim-doi.png"), fullPage: false });
});

test("sổ từ: the words a child has met are in the book, with no score", async ({ page }) => {
  await kidLogin(page);
  await page.goto("/kid/so-tu");
  await expect(page.getByText(/Sổ từ của/)).toBeVisible({ timeout: 20_000 });

  const cards = page.getByTestId("word-card");
  if ((await cards.count()) > 0) {
    await cards.first().click();
    await expect(page.getByText(/Con đã gặp từ này/)).toBeVisible({ timeout: 5_000 });
  }
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\d+\s*%/); // no percentage anywhere
  await kidSafe(page);
  await page.screenshot({ path: join(SHOTS, "p3-so-tu.png"), fullPage: true });
});
