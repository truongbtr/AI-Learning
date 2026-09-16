import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { expect, type Page, test } from "@playwright/test";
import { buildOne, playRound, visible } from "./syllable-helpers";

/**
 * Pha 12 acceptance — Xưởng Tiếng: the spelling games of Phố Chữ.
 *
 *   $env:E2E_BASE_URL="http://localhost:5001"; $env:E2E_CHANNEL="msedge"
 *   pnpm --filter @mtct/web exec playwright test e2e/phase12-syllable.spec.ts
 *
 * Needs a city-mode server (`web-city` launch config, port 5001), content/lexicon/viet.json imported
 * and E2E_ADMIN_PASSWORD for the /dev/syllable bench. It reads the database (never writes to it)
 * to check what a station left behind.
 *
 *   1. the rhythm: the machine says, in order, exactly the steps of `cadence()` for five syllables —
 *      including one with no onset ("anh") and one with a glide ("quyển");
 *   2. Mai Thy → Phố Chữ → the Xưởng Tiếng station → both rounds → LexemeProgress rows of
 *      kind=syllable, one per syllable met, with the right number of meetings;
 *   3. Tàu chở vần: a carriage takes onsets, a meaningful one becomes a wagon;
 *   4. the Sổ tiếng tells the truth about what is kept;
 *   and everywhere: no "sai", no red, no clock.
 * Screenshots land in docs/screens/pha-12-xuong-tieng/.
 */
const KID = { name: "Mai Thy", slug: "thy", pin: ["Mèo", "Thỏ", "Bướm", "Cá"] };
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-12-xuong-tieng");
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD;

/** The owner's rhythm, written out by hand — the same lines as packages/core cadence.test.ts. */
const RHYTHM: Record<string, string[]> = {
  bà: ["bờ", "a", "ba", "huyền", "bà"],
  anh: ["anh"],
  quyển: ["quờ", "yên", "quyên", "hỏi", "quyển"],
  nghé: ["ngờ", "e", "nghe", "sắc", "nghé"],
  mẹ: ["mờ", "e", "me", "nặng", "mẹ"],
};

test.describe.configure({ mode: "serial" });
test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));
test.afterAll(async () => {
  await prisma.$disconnect();
});

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

/** No "sai", no score, no countdown, no price — and nothing painted red. */
async function kidSafe(page: Page) {
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toMatch(/\bsai\b/);
  expect(body).not.toMatch(/điểm số|đồng hồ đếm|đếm ngược|hết lượt|mua ngay|giá tiền|💰|🪙|⏱|⏰/);
  const red = await page.evaluate(() => {
    const isRed = (c: string) => {
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c);
      if (!m) return false;
      const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ? Number(m[4]) : 1];
      return a > 0.3 && r > 190 && g < 90 && b < 90;
    };
    const root = document.querySelector('[data-testid="syllable-station"]') ?? document.body;
    const out: string[] = [];
    for (const el of root.querySelectorAll<HTMLElement>("*")) {
      if (el.closest("canvas")) continue;
      const s = getComputedStyle(el);
      if (isRed(s.color) || isRed(s.backgroundColor) || isRed(s.borderTopColor))
        out.push(`${el.tagName}.${el.className}`.slice(0, 80));
    }
    return out;
  });
  expect(red).toEqual([]);
}

/**
 * A Xưởng Tiếng station shares its building with the skill's review questions, which stay
 * ordinary exercises (docs/08 pha 12). Answer those — any choice will do — until the workshop opens.
 */
async function reachWorkshop(page: Page) {
  for (let i = 0; i < 16; i++) {
    if (await visible(page, "syllable-station")) return;
    if (!(await visible(page, "exercise-panel"))) break;
    const options = page.getByRole("button", { name: /đáp án$/ });
    if ((await options.count()) > 0) {
      await options
        .first()
        .click({ timeout: 4000 })
        .catch(() => {});
      const overlay = page.getByTestId("feedback-overlay");
      await overlay.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
      await overlay.click({ timeout: 2000 }).catch(() => {});
      await overlay.waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
    }
    await page.waitForTimeout(1200);
  }
}

async function syllableProgress() {
  const student = await prisma.student.findUniqueOrThrow({ where: { slug: KID.slug } });
  const rows = await prisma.lexemeProgress.findMany({ where: { studentId: student.id } });
  return { student, rows };
}

test("the machine spells out loud in exactly the steps of cadence()", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to open the /dev/syllable bench");
  await adminLogin(page);
  const said: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.pathname === "/api/tts") said.push(url.searchParams.get("text") ?? "");
  });
  const order = Object.keys(RHYTHM);
  await page.goto(`/dev/syllable?game=build&tieng=${encodeURIComponent(order.join(","))}`);
  await expect(page.getByTestId("syl-build")).toBeVisible({ timeout: 20_000 });

  for (let i = 0; i < order.length; i++) {
    const before = said.length;
    const { target, spoken } = await buildOne(page);
    const expected = RHYTHM[target];
    expect(expected, `no rhythm written for ${target}`).toBeTruthy();
    // what the page says it said…
    expect(spoken.split("|")).toEqual(expected);
    // …and the audio it actually fetched, in that order, after the pieces the child touched
    const fetched = said.slice(before);
    const tail = fetched.slice(-expected!.length);
    expect(tail).toEqual(expected);
    if (i === 0) await page.screenshot({ path: join(SHOTS, "x1-lap-tieng-ba.png") });
    if (target === "quyển") await page.screenshot({ path: join(SHOTS, "x2-lap-tieng-quyen.png") });
    if (i + 1 < order.length)
      await expect(page.getByTestId("syl-build")).toHaveAttribute("data-index", String(i + 1), {
        timeout: 15_000,
      });
  }
  await kidSafe(page);
});

test("Mai Thy: Phố Chữ → Xưởng Tiếng → two rounds → the Leitner rows are kind=syllable", async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  const before = await syllableProgress();
  const seenBefore = new Map(before.rows.map((r) => [r.lexemeId, r.seen]));

  await kidLogin(page);
  await page.goto("/kid/city/viet");
  await expect(page.getByTestId("city-canvas")).toHaveAttribute("data-ready", "1", {
    timeout: 30_000,
  });
  const screen = page.getByTestId("city-screen");
  await expect(screen).toHaveAttribute("data-mode", /idle|done/, { timeout: 30_000 });
  if ((await screen.getAttribute("data-mode")) === "done") {
    await page.getByTestId("play-again").click();
    await expect(screen).toHaveAttribute("data-mode", "idle", { timeout: 30_000 });
  }
  await expect(page.getByTestId("syllable-book-open")).toBeVisible();

  const workshop = page.locator('[data-testid="station-star"][aria-label^="Xưởng Tiếng"]');
  if (
    !(await workshop
      .first()
      .isVisible()
      .catch(() => false))
  )
    test.skip(
      true,
      "tonight's Phố Chữ session was planned without a spelling slot — finish it and run again",
    );
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(SHOTS, "x3-pho-chu-xuong-tieng.png") });
  await workshop.first().click({ force: true });
  await expect(page.getByTestId("exercise-panel")).toBeVisible({ timeout: 8000 });

  await reachWorkshop(page);
  const station = page.getByTestId("syllable-station");
  await expect(station).toBeVisible({ timeout: 20_000 });
  const games = ((await station.getAttribute("data-games")) ?? "").split(",");
  expect(games).toHaveLength(2);
  expect(games[0]).not.toBe(games[1]);

  const played: { game: string; met: number }[] = [];
  for (let r = 0; r < 2; r++) {
    await expect(station).toHaveAttribute("data-round", String(r), { timeout: 20_000 });
    await page.waitForTimeout(1500); // the intro card
    if (r === 0) {
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(SHOTS, "x4-tram-vong-1.png") });
    }
    await kidSafe(page);
    played.push(await playRound(page));
  }
  await expect(page.getByTestId("syllable-station-done")).toBeVisible({ timeout: 20_000 });
  await kidSafe(page);
  console.log(`[xuong-tieng] played ${JSON.stringify(played)}`);
  expect(played[0]?.game).toMatch(/build|split|pair|tone|train|read/);

  // what the station left behind: rows of kind=syllable, and as many meetings as were played
  await expect
    .poll(
      async () => {
        const after = await syllableProgress();
        const syl = after.rows.filter((r) => r.kind === "syllable");
        const added = syl.reduce((n, r) => n + r.seen - (seenBefore.get(r.lexemeId) ?? 0), 0);
        return added;
      },
      { timeout: 15_000 },
    )
    .toBe(played.reduce((n, p) => n + p.met, 0));
  const after = await syllableProgress();
  const syllableIds = after.rows.filter((r) => r.kind === "syllable").map((r) => r.lexemeId);
  const known = await prisma.syllable.count({ where: { id: { in: syllableIds } } });
  expect(known).toBe(syllableIds.length); // every syllable row points at a real syllable
  // the English words kept their own kind
  for (const r of after.rows.filter((x) => x.kind === "word"))
    expect(seenBefore.get(r.lexemeId)).toBe(r.seen);
});

test("tàu chở vần: a meaningful syllable becomes a wagon, nonsense is only read", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to open the /dev/syllable bench");
  await adminLogin(page);
  await page.goto("/dev/syllable?game=train");
  await expect(page.getByTestId("syl-train")).toBeVisible({ timeout: 20_000 });
  const onsets = page.getByTestId("syl-train-onset");
  expect(await onsets.count()).toBe(6);
  for (const h of await onsets.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().height),
  ))
    expect(h).toBeGreaterThanOrEqual(88);
  const found = await (async () => {
    const root = page.getByTestId("syl-train");
    for (let i = 0; i < 6 && Number(await root.getAttribute("data-found")) < 1; i++) {
      await onsets.nth(i).click();
      await expect(onsets.first()).toBeEnabled({ timeout: 20_000 });
    }
    return Number(await root.getAttribute("data-found"));
  })();
  expect(found).toBeGreaterThanOrEqual(1);
  await expect(page.getByTestId("syl-train-wagon").first()).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "x5-tau-cho-van.png") });
  await kidSafe(page);
});

test("the other games render with big pieces and no red", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to open the /dev/syllable bench");
  await adminLogin(page);
  for (const [game, id, shot] of [
    ["split", "syl-build", "x6-tach-tieng.png"],
    ["tone", "syl-tone", "x7-banh-xe-thanh.png"],
    ["pair", "syl-pair", "x8-cap-de-lan.png"],
    ["read", "syl-read", "x9-doc-to.png"],
  ] as const) {
    const tieng = game === "tone" ? "mẹ,bả,cá" : game === "pair" ? "bà,chó,sữa,nghé" : "bà,mẹ,cá";
    await page.goto(`/dev/syllable?game=${game}&tieng=${encodeURIComponent(tieng)}`);
    await expect(page.getByTestId(id)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(900);
    const sizes = await page
      .locator(
        '[data-testid^="piece-"], [data-testid="syl-slot"], [data-testid="syl-pair-card"], [data-testid="syl-tone-notch"], [data-testid="syl-read-mic"]',
      )
      .evaluateAll((els) =>
        els.map((e) => Math.min(e.getBoundingClientRect().height, e.getBoundingClientRect().width)),
      );
    for (const s of sizes) expect(s).toBeGreaterThanOrEqual(88);
    if (game === "pair") expect(await page.getByTestId("syl-pair-card").count()).toBe(2);
    if (game === "tone") expect(await page.getByTestId("syl-tone-notch").count()).toBe(6);
    await kidSafe(page);
    await page.screenshot({ path: join(SHOTS, shot) });
  }
});

test("sổ tiếng: only what is kept, no percentage, and the brick pile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { rows } = await syllableProgress();
  const kept = rows.filter((r) => r.kind === "syllable" && r.box >= 3).length;
  const practising = rows.filter((r) => r.kind === "syllable" && r.box > 0 && r.box < 3).length;

  await kidLogin(page);
  await page.goto("/kid/so-tieng?from=city");
  await expect(page.getByText(/Sổ tiếng của/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("syllable-workshop")).toBeVisible();
  expect(await page.getByTestId("syllable-card").count()).toBe(kept);
  if (kept === 0 && practising > 0)
    await expect(page.getByText(/Con đang tập vài tiếng/)).toBeVisible();
  if (kept > 0) {
    await page.getByTestId("syllable-card").first().click();
    await expect(page.getByText(/Con đã gặp tiếng này/)).toBeVisible();
  }
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\d+\s*%/);
  expect(body).not.toMatch(/\d+\s*\/\s*\d+/); // no "3/10" either — the bricks are drawn
  await kidSafe(page);
  await page.screenshot({ path: join(SHOTS, "x10-so-tieng.png"), fullPage: true });
  await expect(page.getByRole("link", { name: /Về Phố Chữ/ })).toBeVisible();
});
