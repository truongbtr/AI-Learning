import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@mtct/db";
import { expect, type Page, test } from "@playwright/test";
import { build } from "esbuild";
import {
  type ExerciseDef,
  parseExercisePack,
  toExerciseSpec,
} from "../../../packages/content/src/exercise";

/**
 * Pha 13 acceptance: MATH NOTES Grade 1 (EDI-MN1) — the book's models inside the question.
 *
 * Needs the dev server on the old world (`web-world`, port 5002) and content imported; the city
 * test turns the cities on for this browser with the `mtct_ui` cookie (pha 10b).
 *
 *   $env:E2E_BASE_URL="http://localhost:5002"; $env:E2E_CHANNEL="msedge"
 *   pnpm --filter @mtct/web exec playwright test e2e/phase13-math-notes.spec.ts
 *
 * The child is Mai Thy by default (her picture PIN is the one the other suites use). For Chí Thanh
 * set E2E_KID="Chí Thanh", E2E_KID_SLUG=thanh and E2E_KID_PIN to his four pictures, comma-separated.
 *
 * 1. The bench: the child's own `ExerciseRenderer`, bundled from source, draws five exact book
 *    questions (ten-frame 17, the rods of 13, 9 + 3 on the number line, the 7 + 5 bond, the sign of
 *    15 ○ 12) at 1280 × 720 and on an iPad: every button at least 64 px, nothing below the fold,
 *    no "sai", no red, no timer. Screenshots go to docs/screens/pha-13-math-notes/.
 * 2. A real session in Xưởng Máy (city) and one on the old world both hand out an EDI-MN1 question
 *    with a ten-frame. A focus hint — the same door Claude Code's plan-hint.json uses — points the
 *    planner at the book's skills for the length of the test, and is removed afterwards.
 */
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-13-math-notes");
const PACKS = join(__dirname, "..", "..", "..", "content", "exercises", "emath");
const KID = {
  name: process.env.E2E_KID ?? "Mai Thy",
  slug: process.env.E2E_KID_SLUG ?? "thy",
  pin: (process.env.E2E_KID_PIN ?? "Mèo,Thỏ,Bướm,Cá").split(",").map((s) => s.trim()),
};
const FOCUS = [
  "EMATH.NBT.TEEN_NUMBERS",
  "EMATH.NBT.PLACE_VALUE_MODELS",
  "EMATH.OA.MAKE_TEN",
  "EMATH.NBT.TENS_ONES",
];
const HINT_NOTE = "e2e pha 13 — tạm, test tự gỡ";

test.describe.configure({ mode: "serial" });

let bundle = "";
let hintId: string | null = null;

test.beforeAll(async () => {
  mkdirSync(SHOTS, { recursive: true });
  const out = await build({
    entryPoints: [join(__dirname, "fixtures", "exercise-bench.tsx")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    alias: { "@": join(__dirname, "..") },
    define: { "process.env.NODE_ENV": '"development"' },
    logLevel: "error",
  });
  bundle = out.outputFiles[0]?.text ?? "";
});

test.afterAll(async () => {
  if (hintId) await prisma.planHint.delete({ where: { id: hintId } }).catch(() => {});
  await prisma.$disconnect();
});

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────

function allExercises(): { ex: ExerciseDef; file: string }[] {
  const files = [
    "NBT.TEEN_NUMBERS",
    "NBT.TENS_ONES",
    "NBT.PLACE_VALUE_MODELS",
    "NBT.COMPARE_TO_20",
    "NBT.NUMBER_CHART_20",
    "OA.COUNT_ON",
    "OA.MAKE_TEN",
  ];
  return files.flatMap((file) =>
    parseExercisePack(
      JSON.parse(readFileSync(join(PACKS, `${file}.pack.json`), "utf8")),
    ).exercises.map((ex) => ({ ex, file })),
  );
}

function findExercise(what: string, test: (ex: ExerciseDef) => boolean): ExerciseDef {
  const hit = allExercises().find(({ ex }) => test(ex));
  if (!hit) throw new Error(`no exercise for ${what}`);
  return hit.ex;
}

const model = (ex: ExerciseDef) => ex.prompt.image?.model;

/** The five questions the owner asked to see. */
const BOOK_SHOTS: { file: string; what: string; pick: (ex: ExerciseDef) => boolean }[] = [
  {
    file: "b1-ten-frame-17.png",
    what: "ten-frame 17",
    pick: (ex) => {
      const m = model(ex);
      return ex.type === "MCQ" && m?.kind === "tenFrame" && m.dots[0]?.count === 17;
    },
  },
  {
    file: "b2-thanh-chuc-13.png",
    what: "rods for 13",
    pick: (ex) => ex.prompt.text === "How can you show number 13?",
  },
  {
    file: "b3-tia-so-9-cong-3.png",
    what: "number line 9 + 3",
    pick: (ex) => {
      const m = model(ex);
      return m?.kind === "numberLine" && m.hops?.start === 9 && m.hops.count === 3;
    },
  },
  {
    file: "b4-number-bond-7-cong-5.png",
    what: "number bond 7 + 5",
    pick: (ex) => model(ex)?.kind === "numberBond" && ex.prompt.text.includes("7 + 5"),
  },
  {
    file: "b5-keo-dau-15-12.png",
    what: "sign 15 ○ 12",
    pick: (ex) => ex.type === "DRAG_DROP" && ex.dropZones?.[0]?.label === "15 ○ 12",
  },
];

const visible = (page: Page, id: string) =>
  page
    .getByTestId(id)
    .first()
    .isVisible()
    .catch(() => false);

async function kidSafe(page: Page) {
  const body = (await page.locator("body").innerText()).toLowerCase();
  expect(body).not.toMatch(/\bsai\b/);
  expect(body).not.toMatch(/điểm số|đồng hồ đếm|còn \d+ giây|⏱|⏲/);
  // no red anywhere on the child's screen (docs/06 §1): no text, border or fill that is clearly red
  const reds = await page.evaluate(() => {
    const red = (c: string) => {
      const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(c);
      if (!m) return false;
      const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4] ?? 1)];
      return a > 0.3 && r > 190 && g < 90 && b < 90;
    };
    const out: string[] = [];
    for (const el of document.querySelectorAll("body *")) {
      const s = getComputedStyle(el);
      const fill = el instanceof SVGElement ? (el.getAttribute("fill") ?? "") : "";
      if (
        [s.color, s.backgroundColor, s.borderTopColor].some(red) ||
        /^#(e5|f00|ff0000)/i.test(fill)
      )
        out.push(`${el.tagName}.${(el.getAttribute("class") ?? "").slice(0, 40)}`);
    }
    return out.slice(0, 5);
  });
  expect(reds, "red on the child's screen").toEqual([]);
}

/** Every visible control is at least 64 px and nothing the child needs is below the fold. */
async function tapBudget(page: Page, label: string, root = "body") {
  const report = await page.evaluate((root) => {
    const selectors = [
      "button",
      '[data-testid="drag-item"]',
      '[data-testid="drop-zone"]',
      '[data-testid="choice"]',
    ];
    const small: string[] = [];
    let lowest = 0;
    const scope = document.querySelector(root) ?? document.body;
    for (const el of scope.querySelectorAll(selectors.join(","))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || Number(style.opacity) === 0) continue;
      // cards dropped into a ten-frame cell count by their cell (72 px), not by their own box
      if (Math.min(r.width, r.height) < 63.5)
        small.push(
          `${el.getAttribute("data-testid") ?? el.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`,
        );
      lowest = Math.max(lowest, r.bottom);
    }
    return { small, lowest, height: window.innerHeight };
  }, root);
  expect(report.small, `${label}: controls under 64 px`).toEqual([]);
  expect(report.lowest, `${label}: something is below the fold`).toBeLessThanOrEqual(
    report.height + 1,
  );
}

async function openBench(page: Page, ex: ExerciseDef) {
  await page.goto("/login");
  const head = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="stylesheet"], style')]
      .map((e) => e.outerHTML)
      .join(""),
  );
  await page.setContent(
    `<!doctype html><html lang="vi"><head><meta charset="utf-8">${head}</head><body><div id="bench-root"></div></body></html>`,
  );
  await page.evaluate(
    (spec) => {
      window.__BENCH__ = { spec } as never;
    },
    toExerciseSpec(ex, "EMATH") as unknown as Record<string, unknown>,
  );
  await page.addScriptTag({ content: bundle });
  await expect(page.getByTestId("bench")).toBeVisible();
  if (await visible(page, "model-first")) {
    await page.getByRole("button", { name: /Con hiểu rồi/ }).click();
  }
  await expect(page.getByTestId("exercise-prompt")).toBeVisible();
  // let the entrance animation finish before measuring
  await page.waitForTimeout(1200);
}

declare global {
  interface Window {
    __BENCH__?: unknown;
    __BENCH_SENT__?: unknown[];
  }
}

// ── 1. the bench ────────────────────────────────────────────────────────────────────────────────

const VIEWPORTS = [
  { name: "1280x720", width: 1280, height: 720 },
  { name: "ipad-ngang", width: 1024, height: 768 },
  { name: "ipad-doc", width: 768, height: 1024 },
];

test("the five book questions are drawn as the book draws them, inside the screen", async ({
  page,
}) => {
  test.setTimeout(240_000);
  for (const shot of BOOK_SHOTS) {
    const ex = findExercise(shot.what, shot.pick);
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openBench(page, ex);
      const models = page.getByTestId("math-model");
      if (!shot.file.startsWith("b5")) await expect(models.first()).toBeVisible();
      await kidSafe(page);
      await tapBudget(page, `${shot.what} @ ${vp.name}`);
      if (vp.name === "1280x720") await page.screenshot({ path: join(SHOTS, shot.file) });
      if (vp.name === "ipad-doc")
        await page.screenshot({ path: join(SHOTS, shot.file.replace(".png", "-ipad.png")) });
    }
  }
});

test("the ten-frame 17 has 17 dots, the rods of 13 a nine-cube trap, the bond a ?", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openBench(page, findExercise("ten-frame 17", BOOK_SHOTS[0]!.pick));
  await expect(page.locator('[data-testid="exercise-prompt"] ~ * [data-dot="dark"]')).toHaveCount(
    17,
  );

  await openBench(page, findExercise("rods for 13", BOOK_SHOTS[1]!.pick));
  // four answer cards, each a model; one of them has a rod of only nine cubes
  await expect(page.getByTestId("choice")).toHaveCount(4);
  const rods = await page
    .getByTestId("choice")
    .evaluateAll((cards) => cards.map((c) => c.querySelectorAll('[data-cube="rod"]').length));
  expect(rods.sort((a, b) => a - b)).toEqual([9, 10, 10, 20]);
  // three answers in one row at 1280 wide (the upright ten-frame / rod layout)
  const tops = await page
    .getByTestId("choice")
    .evaluateAll((cards) => cards.map((c) => Math.round(c.getBoundingClientRect().top)));
  // one row: a card lifted by the pointer (hover) moves a few px, a second row would be far lower
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(24);

  await openBench(page, findExercise("number bond 7 + 5", BOOK_SHOTS[3]!.pick));
  await expect(page.locator("[data-bond]")).toHaveCount(3);
});

test("drag 14 dots: 'Xong!' waits for the fourteenth, and the dots sit in the cells", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  const ex = findExercise(
    "draw 14",
    (e) => e.type === "DRAG_DROP" && e.prompt.text.startsWith("Draw number 14"),
  );
  await openBench(page, ex);
  const zone = page.getByTestId("drop-zone").first();
  await expect(page.getByTestId("ten-frame-zone")).toBeVisible();
  const submit = page.getByTestId("drag-submit");
  for (let i = 0; i < 14; i++) {
    await page.getByTestId("drag-tray").getByTestId("drag-item").first().click();
    await zone.click({ position: { x: 20, y: 20 } });
    if (i === 5) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SHOTS, "b6-keo-cham-dang-lam.png") });
    }
    if (i < 13) await expect(submit).toBeDisabled();
  }
  await expect(submit).toBeEnabled();
  await expect(zone.getByTestId("drag-item")).toHaveCount(14);
  await tapBudget(page, "drag 14 @ 1280x720");
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, "b7-keo-du-14-cham.png") });
  await submit.click();
  const sent = (await page.evaluate(() => window.__BENCH_SENT__)) as {
    placement: Record<string, string[]>;
  }[];
  expect(sent.at(-1)?.placement.frame).toHaveLength(14);
});

test("every new EMATH question fits the 1280 × 720 screen with 64 px controls", async ({
  page,
}) => {
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  // one of each shape: the first exercise of every (pack, type, model kind) combination
  const seen = new Set<string>();
  const sample = allExercises().filter(({ ex, file }) => {
    const kinds = [
      ex.prompt.image?.model?.kind,
      ...(ex.choices ?? []).map((c) => c.image?.model?.kind),
      ...(ex.dropZones ?? []).map(
        (z) => z.image?.model?.kind ?? (z.label?.includes("○") ? "slot" : ""),
      ),
    ]
      .filter(Boolean)
      .join("+");
    const key = `${file}|${ex.type}|${kinds}|${(ex.dragItems?.length ?? 0) > 12 ? "many" : ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return ex.meta.sourceRef.startsWith("EDI-MN1");
  });
  console.log(`[bench] ${sample.length} shapes`);
  for (const { ex } of sample) {
    await openBench(page, ex);
    await kidSafe(page);
    await tapBudget(page, ex.id);
  }
});

// ── 2. real sessions ────────────────────────────────────────────────────────────────────────────

async function focusOnTheBook() {
  const student = await prisma.student.findUniqueOrThrow({ where: { slug: KID.slug } });
  const now = Date.now();
  const hint = await prisma.planHint.create({
    data: {
      studentId: student.id,
      validFrom: new Date(now - 60_000),
      validTo: new Date(now + 3 * 3600_000),
      focusSkills: FOCUS.map((code) => ({ code, weight: 1 })),
      note: HINT_NOTE,
      createdBy: "CLAUDE_CODE",
    },
  });
  hintId = hint.id;
}

async function kidLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: KID.name }).first().click();
  for (const picture of KID.pin)
    await page.getByRole("button", { name: picture, exact: true }).click();
  await page.waitForURL(/\/kid\/(home|city)/, { timeout: 20_000 });
}

/** True when the exercise on screen draws a ten-frame (only EDI-MN1 questions have models). */
const showsTenFrame = async (page: Page) =>
  (await page.locator('[data-model="tenFrame"], [data-testid="ten-frame-zone"]').count()) > 0;

/** Waits for the question to be on screen, past the mascot's worked example if there is one. */
async function readyToLook(page: Page) {
  await page
    .locator(
      '[data-testid="exercise-prompt"], [data-testid="model-first"], [data-testid="choice-station"]',
    )
    .first()
    .waitFor({ state: "visible", timeout: 10_000 })
    .catch(() => {});
  if (await visible(page, "model-first")) {
    await page
      .getByRole("button", { name: /Con hiểu rồi/ })
      .click()
      .catch(() => {});
    await page
      .getByTestId("exercise-prompt")
      .waitFor({ timeout: 5000 })
      .catch(() => {});
  }
  await page.waitForTimeout(700);
}

async function settle(page: Page) {
  const overlay = page.getByTestId("feedback-overlay");
  await overlay.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  await overlay.click({ timeout: 2000 }).catch(() => {});
  await overlay.waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
}

/** Answers whatever is on screen, the way a child taps. Returns what it was. */
async function answerOne(page: Page): Promise<string> {
  for (const id of ["choice-station"]) {
    if (await visible(page, id)) {
      await page.getByTestId(id).getByRole("button").first().click({ force: true });
      await page.waitForTimeout(600);
    }
  }
  if (await visible(page, "model-first")) {
    await page
      .getByRole("button", { name: /Con hiểu rồi/ })
      .click()
      .catch(() => {});
    await page.waitForTimeout(300);
  }
  if (await visible(page, "choice")) {
    const before = await page
      .getByTestId("exercise-prompt")
      .innerText()
      .catch(() => "");
    for (let attempt = 0; attempt < 3; attempt++) {
      const options = page.getByTestId("choice");
      const n = await options.count();
      if (n === 0) break;
      await options
        .nth(attempt % n)
        .click({ timeout: 4000 })
        .catch(() => {});
      await settle(page);
      const now = await page
        .getByTestId("exercise-prompt")
        .innerText()
        .catch(() => "");
      if (now !== before || !(await visible(page, "choice"))) break;
    }
    return "choice";
  }
  if (await visible(page, "drag-item")) {
    const zones = page.getByTestId("drop-zone");
    const nZones = Math.max(1, await zones.count());
    const submit = page.getByTestId("drag-submit");
    for (let g = 0; g < 30 && !(await submit.isEnabled().catch(() => false)); g++) {
      const cards = page.getByTestId("drag-tray").getByTestId("drag-item");
      if ((await cards.count()) === 0) break;
      await cards
        .first()
        .click({ timeout: 4000 })
        .catch(() => {});
      await zones
        .nth(g % nZones)
        .click({ position: { x: 16, y: 16 }, timeout: 4000 })
        .catch(() => {});
    }
    await submit.click({ timeout: 4000 }).catch(() => {});
    await settle(page);
    return "drag";
  }
  if (await visible(page, "count-object")) {
    const objects = page.getByTestId("count-object");
    const n = await objects.count();
    for (let i = 0; i < n; i++)
      await objects
        .nth(i)
        .click({ timeout: 4000 })
        .catch(() => {});
    await page
      .getByTestId("count-submit")
      .click({ timeout: 4000 })
      .catch(() => {});
    await settle(page);
    return "count";
  }
  for (const out of [
    page.getByTestId("parent-confirm"),
    page.getByTestId("photo-skip"),
    page.getByRole("button", { name: /Để sau nhé/ }),
    page.getByRole("button", { name: /Bài tiếp theo/ }),
  ]) {
    if (await out.isVisible().catch(() => false)) {
      await out.click({ timeout: 4000 }).catch(() => {});
      break;
    }
  }
  await settle(page);
  return "other";
}

test("Xưởng Máy in the city hands out an EDI-MN1 question with a ten-frame", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(900_000);
  await focusOnTheBook();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.context().addCookies([{ name: "mtct_ui", value: "city", url: baseURL ?? "" }]);
  await kidLogin(page);
  await page.goto("/kid/city/emath");
  await expect(page.getByTestId("city-canvas")).toHaveAttribute("data-ready", "1", {
    timeout: 30_000,
  });
  const screen = page.getByTestId("city-screen");
  await expect(screen).toHaveAttribute("data-mode", /idle|done/, { timeout: 30_000 });
  if ((await screen.getAttribute("data-mode")) === "done") {
    await page.getByTestId("play-again").click();
    await expect(screen).toHaveAttribute("data-mode", "idle", { timeout: 30_000 });
  }

  let found = false;
  let shot = false;
  for (let round = 0; round < 2 && !found; round++) {
    for (let station = 0; station < 6 && !found; station++) {
      if ((await screen.getAttribute("data-mode")) !== "idle") break;
      const next = page.locator('[data-testid="station-star"][data-next="1"]');
      if (!(await next.isVisible().catch(() => false))) break;
      await next.click({ force: true });
      await expect(page.getByTestId("exercise-panel")).toBeVisible({ timeout: 8000 });
      for (let n = 0; n < 10 && (await visible(page, "exercise-panel")); n++) {
        await readyToLook(page);
        await kidSafe(page);
        if (await showsTenFrame(page)) {
          found = true;
          if (!shot) {
            await page.waitForTimeout(600);
            await page.screenshot({ path: join(SHOTS, "s1-xuong-may-ten-frame.png") });
            shot = true;
          }
          await tapBudget(page, "Xưởng Máy panel", '[data-testid="exercise-panel"]');
        }
        await answerOne(page);
      }
      await expect(screen).toHaveAttribute("data-mode", /idle|finale|done/, { timeout: 30_000 });
    }
    if (!found && (await visible(page, "play-again"))) {
      await page.getByTestId("play-again").click();
      await expect(screen).toHaveAttribute("data-mode", "idle", { timeout: 30_000 });
    }
  }
  expect(found, "no ten-frame question in Xưởng Máy").toBe(true);
});

test("the old world's quest hands out an EDI-MN1 question with a ten-frame", async ({ page }) => {
  test.setTimeout(900_000);
  if (!hintId) await focusOnTheBook();
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.context().clearCookies();
  await kidLogin(page);
  await expect(page).toHaveURL(/\/kid\/home$/);
  await page.getByTestId("today-quest").click();
  await page.waitForURL(/\/kid\/quest$/);
  await expect(page.getByTestId("quest-map")).toBeVisible();
  // Visit the stations one by one. A vocabulary or spelling game (pha 11–12) is not what this
  // phase checks, so the test steps past it instead of learning to play it.
  let found = false;
  let open = 0;
  for (let n = 1; n <= 16 && !found; n++) {
    await page.goto(`/kid/quest/${n}`);
    if (!/\/kid\/quest\/\d+$/.test(page.url())) continue; // answered already, or no such station
    open++;
    await readyToLook(page);
    if (await visible(page, "vocab-station")) continue;
    await kidSafe(page);
    if (await showsTenFrame(page)) {
      found = true;
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(SHOTS, "s2-the-gioi-cu-ten-frame.png") });
      await tapBudget(page, "quest", '[data-testid="exercise-body"]');
      break;
    }
    await answerOne(page);
  }
  // A quest is planned once a day: when every station has been answered already (by an earlier run
  // or by the child) there is nothing left to look at until tomorrow — not a content failure.
  test.skip(open === 0, "today's quest is already finished — run again tomorrow");
  expect(found, "no ten-frame question in today's quest").toBe(true);
});

/**
 * Owner, 18/09/2026: the pattern question showed only the words "Red, blue, red, blue, …" and three
 * colour cards — "khi kéo rồi thì không còn màu để kéo nữa thì làm sao xếp được 4 khoanh tròn".
 * The pattern itself was never drawn. It is now, so the question can be answered without reading.
 */
test("a pattern question draws its pattern", async ({ page }) => {
  const pattern = parseExercisePack(
    JSON.parse(readFileSync(join(PACKS, "G.PATTERNS.pack.json"), "utf8")),
  ).exercises.find((ex) => ex.id === "emath-pattern-0021") as ExerciseDef;

  await page.setViewportSize({ width: 1280, height: 720 });
  await openBench(page, pattern);
  // four pictures in the question: the pattern itself, not a sentence about it
  const strip = page.getByTestId("prompt-image").locator("img");
  await expect(strip).toHaveCount(4);
  expect(pattern.prompt.text).not.toMatch(/red|blue/i);
  // three cards to choose from, and one basket for the missing one
  await expect(page.getByTestId("drag-tray").getByTestId("drag-item")).toHaveCount(3);
  await expect(page.getByTestId("drop-zone")).toHaveCount(1);
  await kidSafe(page);
  await tapBudget(page, "pattern @ 1280x720");
  await page.screenshot({ path: join(SHOTS, "b8-quy-luat-ve-ra-day.png") });

  // one card is enough: drop it in and "Xong!" lights up
  await page.getByTestId("drag-tray").getByTestId("drag-item").first().click();
  await page.getByTestId("drop-zone").first().click();
  await expect(page.getByTestId("drag-submit")).toBeEnabled();
  await expect(page.getByTestId("drag-tray").getByTestId("drag-item")).toHaveCount(2);
});
