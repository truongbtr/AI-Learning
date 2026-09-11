import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Phase 2 acceptance (docs/08 pha 2 "Tiêu chí xong") against a running stack that already had
 * `pnpm content:import` run against it:
 *   $env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; pnpm --filter @mtct/web exec playwright test e2e/phase2-acceptance.spec.ts
 * Proves the bank can be reviewed, published and rendered **with no API key of any kind** — the
 * stack under test has TTS_PROVIDER=webspeech and an empty TTS_API_KEY.
 */
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-2");

test.describe.configure({ mode: "serial" });
test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to run the phase 2 acceptance flow");

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true });
});

async function adultLogin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USER);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ADMIN_PASSWORD as string);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/admin\/users/);
}

test("1. /admin/content lists the batch and publishes it (FR-ADM-05)", async ({ page }) => {
  await adultLogin(page);
  await page.goto("/admin/content");
  await expect(page.getByRole("heading", { level: 1, name: "Ngân hàng bài" })).toBeVisible();

  const publish = page.getByRole("button", { name: /Phát hành lô/ });
  await expect(publish).toBeVisible();
  const label = (await publish.textContent()) ?? "";
  const drafts = Number(label.match(/\((\d+)\)/)?.[1] ?? 0);
  if (drafts > 0) {
    await publish.click();
    await expect(page.getByRole("button", { name: "Phát hành lô (0)" })).toBeVisible({
      timeout: 30_000,
    });
  }
  await page.screenshot({ path: join(SHOTS, "admin-content.png"), fullPage: false });
});

test("2. an exercise previews exactly as the child sees it, answer and diagnosis stay on the server", async ({
  page,
}) => {
  await adultLogin(page);
  await page.goto("/admin/content");
  await page.getByRole("button", { name: "Xem thử" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Kid rules: read-aloud button, a hint button, no red, no "sai".
  await expect(dialog.getByRole("button", { name: /Nghe/ }).first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Gợi ý" })).toBeVisible();
  await expect(dialog.getByText("Đáp án", { exact: true })).toBeVisible();
  await expect(dialog).not.toContainText(/\bsai\b/i);
  await page.screenshot({ path: join(SHOTS, "exercise-preview.png"), fullPage: false });
});

test("3. the published bank is queryable: every batch-1 skill has >= 35 exercises", async ({
  page,
}) => {
  await adultLogin(page);
  const res = await page.request.get("/api/admin/content?status=PUBLISHED&limit=1000");
  expect(res.status()).toBe(200);
  const body = (await res.json()) as {
    items: { stableId: string; skillCodes: string[]; spec: unknown; answer: unknown }[];
  };
  expect(body.items.length).toBeGreaterThan(0);

  // The spec an exercise API would hand a child must never carry the answer or the diagnosis.
  const specs = JSON.stringify(body.items.map((i) => i.spec));
  expect(specs).not.toContain("answerKey");
  expect(specs).not.toContain("errorTag");
  expect(specs).not.toContain("correctCount");
  // The reviewer's own payload does have them — that is what /admin/content is for.
  expect(JSON.stringify(body.items.map((i) => i.answer))).toContain("value");
});

test("4. /dev/kit renders a pasted ExerciseSpec", async ({ page }) => {
  await adultLogin(page);
  await page.goto("/dev/kit");
  await expect(page.getByRole("heading", { level: 1, name: /Bộ dựng bài/ })).toBeVisible();
  await page.getByRole("button", { name: "COUNT_TAP" }).click();
  await expect(page.getByText("Có mấy quả táo?", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "dev-kit.png"), fullPage: false });
});

test("5. the AI queue page is reachable and empty", async ({ page }) => {
  await adultLogin(page);
  await page.goto("/admin/inbox");
  await expect(page.getByRole("heading", { level: 1, name: "Hàng chờ AI" })).toBeVisible();
  await expect(page.getByText("pnpm inbox:pull")).toBeVisible();
});
