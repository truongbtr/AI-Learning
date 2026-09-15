import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Pha 10 acceptance (docs/08 pha 10 + bổ sung "cách chơi"): the city world on a server started
 * with `KID_UI=city` (dev: the `web-city` launch config, port 5001).
 *
 *   $env:E2E_BASE_URL="http://localhost:5001"; $env:E2E_CHANNEL="msedge"
 *   pnpm --filter @mtct/web exec playwright test e2e/phase10-city.spec.ts
 *
 * Mai Thy logs in → the six-island map → Thành Số → exactly 3–4 stars on buildings → a star opens the
 * exercise panel over the city → its exercises → the panel goes down, the building grows, the next
 * star blinks → after the last station: new land and a choice of what to build. The URL never
 * leaves the city. Never "sai", never a score, never a timer or a price.
 * Screenshots land in docs/screens/pha-10/.
 */
const KID = { name: "Mai Thy", pin: ["Mèo", "Thỏ", "Bướm", "Cá"] };
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-10");
const CITIES = ["viet", "vmath", "esl", "enl", "emath", "esci"];

test.describe.configure({ mode: "serial" });
test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

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

const visible = (page: Page, id: string) =>
  page
    .getByTestId(id)
    .first()
    .isVisible()
    .catch(() => false);

/** Answer whatever exercise the panel shows, the way a child would tap it. */
async function answerOne(page: Page): Promise<string> {
  const settle = async () => {
    const overlay = page.getByTestId("feedback-overlay");
    await overlay.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    await overlay.click({ timeout: 2000 }).catch(() => {});
    await overlay.waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
  };
  if (await visible(page, "choice-station")) {
    await page.getByTestId("choice-station").getByRole("button").first().click({ force: true });
    await page.waitForTimeout(600);
  }
  if (await visible(page, "model-first")) {
    await page
      .getByRole("button", { name: /Con hiểu rồi/ })
      .click()
      .catch(() => {});
    await page.waitForTimeout(300);
  }
  if (await visible(page, "homework-rounds")) {
    for (let r = 0; r < 12 && (await visible(page, "homework-round")); r++) {
      await page
        .getByTestId("homework-round")
        .first()
        .click()
        .catch(() => {});
      await page.waitForTimeout(400);
    }
    if (await visible(page, "homework-next")) await page.getByTestId("homework-next").click();
    else
      await page
        .getByRole("button", { name: /Để sau nhé/ })
        .click()
        .catch(() => {});
    return "homework";
  }
  if (await visible(page, "homework-record")) {
    await page
      .getByRole("button", { name: /Để sau nhé/ })
      .click()
      .catch(() => {});
    return "homework";
  }
  if (await visible(page, "choice")) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const options = page.getByTestId("choice");
      const n = await options.count();
      if (n === 0) break;
      const prompt = await page
        .getByTestId("exercise-prompt")
        .innerText()
        .catch(() => "");
      await options
        .nth(attempt % n)
        .click({ timeout: 4000 })
        .catch(() => {});
      await settle();
      const still = await page
        .getByTestId("exercise-prompt")
        .innerText()
        .catch(() => "");
      if (still !== prompt || !(await visible(page, "choice"))) break;
    }
    return "choice";
  }
  if (await visible(page, "drag-item")) {
    for (let g = 0; g < 8; g++) {
      const cards = page.getByTestId("drag-tray").getByTestId("drag-item");
      if ((await cards.count()) === 0) break;
      await cards
        .first()
        .click({ timeout: 4000 })
        .catch(() => {});
      await page
        .getByTestId("drop-zone")
        .first()
        .click({ timeout: 4000 })
        .catch(() => {});
    }
    await page
      .getByTestId("drag-submit")
      .click({ timeout: 4000 })
      .catch(() => {});
    await settle();
    return "drag";
  }
  if (await visible(page, "count-object")) {
    const objects = page.getByTestId("count-object");
    const n = Math.min(await objects.count(), 3);
    for (let i = 0; i < n; i++)
      await objects
        .nth(i)
        .click({ timeout: 4000 })
        .catch(() => {});
    await page
      .getByTestId("count-submit")
      .click({ timeout: 4000 })
      .catch(() => {});
    await settle();
    return "count";
  }
  for (const out of [
    page.getByTestId("parent-confirm"),
    page.getByTestId("photo-skip"),
    page.getByRole("button", { name: /Bài tiếp theo/ }),
  ]) {
    if (await out.isVisible().catch(() => false)) {
      await out.click({ timeout: 4000 }).catch(() => {});
      break;
    }
  }
  await settle();
  return "other";
}

test("the kid lands on the six-island map; tonight's islands sparkle with a count", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await kidLogin(page);
  await page.waitForURL(/\/kid\/city$/);
  await expect(page.getByTestId("world-map")).toBeVisible();
  for (const city of CITIES) await expect(page.getByTestId(`city-${city}`)).toBeVisible();
  await kidSafe(page);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: join(SHOTS, "c1-world-map.png") });

  // the parents' door in the corner is really on top: nothing (no island, no badge) covers it
  const door = page.getByTestId("parent-door");
  await expect(door).toBeVisible();
  const box = await door.boundingBox();
  const onTop = await page.evaluate(
    ({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-testid="parent-door"]') !== null,
    { x: (box?.x ?? 0) + (box?.width ?? 0) / 2, y: (box?.y ?? 0) + (box?.height ?? 0) / 2 },
  );
  expect(onTop).toBe(true);
});

test("Thành Số: 3–4 stars, panel over the city, the building grows, land opens to build", async ({
  page,
}) => {
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await kidLogin(page);
  await page.getByTestId("city-vmath").click({ force: true });
  await page.waitForURL(/\/kid\/city\/vmath$/);
  const cityUrl = page.url();

  const t0 = Date.now();
  await expect(page.getByTestId("city-canvas")).toHaveAttribute("data-ready", "1", {
    timeout: 15_000,
  });
  console.log(`[city] ready in ${Date.now() - t0} ms`);
  const screen = page.getByTestId("city-screen");
  await expect(screen).toHaveAttribute("data-mode", /idle|done/, { timeout: 30_000 });
  await kidSafe(page);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(SHOTS, "c2-city-stars.png") });

  if ((await screen.getAttribute("data-mode")) === "done") {
    // tonight's Thành Số is finished: "Chơi thêm" plans a fresh session in the same city
    console.log("[city] đã xong hôm nay → Chơi thêm");
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(SHOTS, "c0-city-done-before-again.png") });
    await page.getByTestId("play-again").click();
    await expect(page.getByTestId("city-canvas")).toHaveAttribute("data-ready", "1", {
      timeout: 20_000,
    });
    await expect(screen).toHaveAttribute("data-mode", "idle", { timeout: 30_000 });
  }

  const progress = page.getByTestId("station-progress");
  const total = Number(await progress.getAttribute("data-total"));
  console.log(`[city] stations: ${total}`);
  expect(total).toBeGreaterThanOrEqual(3);
  expect(total).toBeLessThanOrEqual(4);
  // only the station buildings carry a star (one bubble per building)
  const stars = await page.getByTestId("station-star").count();
  expect(stars).toBeGreaterThanOrEqual(1);
  expect(stars).toBeLessThanOrEqual(total);

  const types = new Set<string>();
  for (let station = 0; station < 6; station++) {
    const mode = await screen.getAttribute("data-mode");
    if (mode !== "idle") break;
    const next = page.locator('[data-testid="station-star"][data-next="1"]');
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click({ force: true });
    await expect(page.getByTestId("exercise-panel")).toBeVisible({ timeout: 5000 });
    let n = 0;
    while (await visible(page, "exercise-panel")) {
      if (station === 0 && n === 0) {
        await page.waitForTimeout(1200);
        await page.screenshot({ path: join(SHOTS, "c3-panel-over-city.png") });
      }
      await kidSafe(page);
      const head = await page
        .getByTestId("exercise-panel")
        .locator("span")
        .first()
        .innerText()
        .catch(() => "");
      const kind = await answerOne(page);
      types.add(kind);
      console.log(`  [panel] ${head} → ${kind} · mode=${await screen.getAttribute("data-mode")}`);
      expect(page.url()).toBe(cityUrl); // never leaves the city
      n++;
      await page.waitForTimeout(500);
      if (n > 8) break;
    }
    console.log(`[city] station ${station + 1}: ${n} exercises`);
    await page.waitForTimeout(1200);
    if (station === 0) await page.screenshot({ path: join(SHOTS, "c4-building-grows.png") });
    await expect(screen).toHaveAttribute("data-mode", /idle|finale|done/, { timeout: 30_000 });
    if (station === 0) {
      await expect(progress).toHaveAttribute("data-done", /[1-4]/);
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(SHOTS, "c5-next-star.png") });
    }
  }
  console.log(`[city] exercise kinds: ${[...types].join(",")}`);

  // the finale: a loop over the city, then new land to build on (or straight to done)
  const chooser = page.getByTestId("build-chooser");
  await Promise.race([
    chooser.waitFor({ state: "visible", timeout: 60_000 }).catch(() => {}),
    page
      .getByTestId("city-done")
      .waitFor({ state: "visible", timeout: 60_000 })
      .catch(() => {}),
  ]);
  if (await chooser.isVisible().catch(() => false)) {
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(SHOTS, "c6-choose-build.png") });
    const options = chooser.locator(
      'button[data-testid^="build-"]:not([data-testid="build-later"])',
    );
    expect(await options.count()).toBeGreaterThanOrEqual(1);
    expect(await options.count()).toBeLessThanOrEqual(3);
    // real engine pictures, taking at least 60% of each card (Pha 10b việc 3)
    for (let i = 0; i < (await options.count()); i++) {
      const card = await options.nth(i).boundingBox();
      const pic = options.nth(i).getByTestId("build-picture");
      await expect(pic).toHaveJSProperty("complete", true);
      expect(await pic.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      const box = await pic.boundingBox();
      expect((box?.height ?? 0) * (box?.width ?? 0)).toBeGreaterThanOrEqual(
        0.6 * (card?.height ?? 1) * (card?.width ?? 1),
      );
    }
    // the mascot's bubble never sits cut under the sheet
    await expect(page.getByTestId("city-line")).toBeHidden();
    await options.first().click();
  }
  await expect(page.getByTestId("city-done")).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, "c7-done.png") });
  expect(page.url()).toBe(cityUrl);
});

test("an unknown city goes back to the map", async ({ page }) => {
  await kidLogin(page);
  await page.goto("/kid/city/atlantis");
  await page.waitForURL(/\/kid\/city$/);
});
