import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { currentLessons, lessonChoices, prisma } from "@mtct/db";
import { expect, test } from "@playwright/test";
import { build } from "esbuild";

/**
 * "Hôm nay lớp học bài nào?" on /parent/diary (docs/11 §4).
 *
 * The parent pages are behind an adult login this suite has no password for, so the card is mounted
 * on its own with the real lesson list out of the database — the same props the page passes it.
 *
 *   pnpm --filter @mtct/db build     # the bench bundles the built db package types at runtime
 *   $env:E2E_BASE_URL="http://localhost:5002"; $env:E2E_CHANNEL="msedge"
 *   pnpm --filter @mtct/web exec playwright test e2e/lesson-picker.spec.ts
 */
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-13-math-notes");

test("the parent can say which lesson the class is on, in one tap", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(SHOTS, { recursive: true });

  const out = await build({
    entryPoints: [join(__dirname, "fixtures", "parent-bench.tsx")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    alias: {
      "@": join(__dirname, ".."),
      "next/navigation": join(__dirname, "fixtures", "next-navigation-stub.ts"),
    },
    define: { "process.env.NODE_ENV": '"development"' },
    logLevel: "error",
  });

  // the real lessons of the book, and where the class was last recorded
  const lessons = (await lessonChoices(prisma, "EMATH")).map((l) => ({
    code: l.code,
    title: l.title,
    pageFrom: l.pageFrom,
    pageTo: l.pageTo,
    weekFrom: l.weekFrom,
  }));
  const seen = (await currentLessons(prisma, "1B3")).find((c) => c.subject === "EMATH");
  const subjects = [
    {
      subject: "EMATH",
      label: "English Maths",
      lessons,
      current: seen?.code
        ? {
            code: seen.code,
            title: seen.title ?? seen.code,
            date: seen.date.toISOString(),
            source: seen.source,
          }
        : {
            code: "EDI-MN1-U3-L8",
            title: "Lesson 3-7 · Compare Numbers on a Number Line",
            date: new Date().toISOString(),
            source: "PARENT" as const,
          },
    },
    { subject: "VMATH", label: "Toán", lessons: [], current: null },
  ];
  await prisma.$disconnect();

  await page.setViewportSize({ width: 1280, height: 800 });
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
    (props) => {
      window.__PARENT_BENCH__ = props as never;
      window.__SENT__ = [];
      // the card talks to /api/diary; record the call instead of needing a logged-in session
      window.fetch = (async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(String(init.body)) : null;
        window.__SENT__?.push({ url: String(url), body });
        return {
          ok: true,
          json: async () => ({ title: body?.unitCode, code: body?.unitCode }),
        } as unknown as Response;
      }) as typeof fetch;
    },
    { subjects, className: "1B3" },
  );
  await page.addScriptTag({ content: out.outputFiles[0]?.text ?? "" });

  // the card knows where the class is, and offers the next lesson as one tap
  await expect(page.getByTestId("lesson-current")).toContainText("Đang ghi nhận");
  const next = page.getByTestId("lesson-next");
  await expect(next).toContainText("Sang bài kế tiếp");
  await page.screenshot({ path: join(SHOTS, "p1-chon-bai-lop-dang-hoc.png") });

  // picking a lesson from the list sends it to /api/diary
  await page.getByTestId("lesson-select").selectOption("EDI-MN1-U5-L1");
  await page.getByTestId("lesson-save").click();
  await expect(page.getByTestId("lesson-saved")).toBeVisible();
  const all = (await page.evaluate(() => window.__SENT__)) as { url: string; body: unknown }[];
  const sent = all.filter((c) => c.url.includes("/api/"));
  expect(sent).toHaveLength(1);
  expect(sent[0]?.url).toContain("/api/diary");
  expect(sent[0]?.body).toMatchObject({
    className: "1B3",
    subject: "EMATH",
    unitCode: "EDI-MN1-U5-L1",
  });
  await page.screenshot({ path: join(SHOTS, "p2-da-ghi-bai-hom-nay.png") });
});
