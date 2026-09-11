import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { expect, type Page, test } from "@playwright/test";

/**
 * Phase 4 acceptance (docs/08 pha 4 "Tiêu chí xong"), against a running stack with a seeded
 * database and `pnpm content:import` already run:
 *
 *   $env:E2E_ADMIN_PASSWORD="…"; pnpm --filter @mtct/web exec playwright test e2e/phase4-acceptance.spec.ts
 *
 * This walks the **real** pipeline, command line included: the photos go in through the API, the
 * worker's own preprocessing runs, `inbox:pull` writes `context.json`, this test writes the
 * `result.json` a reader would write, and `inbox:push` loads it. Nothing here is a special test
 * path — if this passes, the flow a family uses works.
 *
 * What it proves, in the order docs/08 lists it:
 *  1. the real Edi Parent post of 10/09/2026 gives exactly 3 lessons, 3 tasks (one only an
 *     invitation) and 1 uniform note — and the quest planned after it opens with the teacher's own
 *     homework and practises today's lesson;
 *  2. a half-finished ESL worksheet reads as BLANK, never as wrong, and the reason flips with one
 *     tap;
 *  3. five photos of Vietnamese schoolwork are uploaded, prepared and ready to read in ≤ 90 s;
 *  4. approving moves the mastery and leaves evidence a parent can point at;
 *  5. a Raz-Kids screenshot records `raz_level` and moves `ENL.RF.FLUENCY_LEVEL_*`.
 */

const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const ROOT = join(__dirname, "..", "..", "..");
const SHOTS = join(ROOT, "docs", "screens", "pha-4");
const INBOX = join(ROOT, "inbox");

/** The post of 10/09/2026, exactly as docs/11 §1 records it. */
const DIARY_POST = `Phần Thông tin
Hôm nay, con đã tham gia các hoạt động học tập của các môn học:
- Tiếng Việt: Bài 13: U u – Ư ư
- ESL: Unit 1 - Lesson 16 - Unit Review: Con ôn tập từ vựng và ngữ pháp Unit 1:
       family members, adjectives, have, to be
- Toán: Các số 6,7,8,9,10 (Tiếp)

Phần dặn dò
1. Tiếng Việt:
   + Con luyện đọc 5 lần Bài 13 - trang 38, 39.
   Cô khuyến khích con quay video luyện đọc các tiếng, từ và câu trong mục 2 và mục 4
   – Bài 13: U u - Ư ư (SGK Tiếng Việt tập 1, trang 38,39) tại bài tập được giao trong
   Teams – Chương trình Việt
2. ESL: Con hoàn thành phiếu bài tập
3. Đồng phục: Ngày mai, con mặc quần áo tự do, đi giày/ dép có quai.

Trân trọng,
GVCN lớp 1B3`;

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

let studentId = "";

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true });
});

async function adminLogin(page: Page): Promise<void> {
  test.skip(!ADMIN_PASSWORD, "cần E2E_ADMIN_PASSWORD");
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USER);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ADMIN_PASSWORD as string);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/admin\/users|\/change-password/);
  if (!studentId) studentId = await findStudent(page, "thy");
}

/** The dev child the phase-3 suite uses; by slug, since a dev database holds several "Thy". */
async function findStudent(page: Page, slug: string): Promise<string> {
  const users = await page.request.get("/api/admin/users").then((r) => r.json());
  const child = (users.items as { student?: { id: string; slug: string } }[] | undefined)?.find(
    (u) => u.student?.slug === slug,
  );
  expect(child?.student?.id, `không tìm thấy bé ${slug}`).toBeTruthy();
  return child?.student?.id as string;
}

function pnpm(...args: string[]): string {
  return execFileSync("pnpm", args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    env: { ...process.env },
  });
}

/** A page of ruled lines with pencil-ish marks — enough for sharp to rotate, shrink and hash. */
function pagePng(seed: number, width = 240, height = 180): Buffer {
  const rgb = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      const ruled = y % 24 === 0 ? 120 : 240;
      const ink = (x * seed + y * 3) % 29 === 0 ? 60 : ruled;
      rgb[i] = ink;
      rgb[i + 1] = ink;
      rgb[i + 2] = ink;
    }
  }
  return encodePng(rgb, width, height);
}

function encodePng(rgb: Buffer, width: number, height: number): Buffer {
  const stride = width * 3;
  const withFilter = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    withFilter[y * (stride + 1)] = 0;
    rgb.copy(withFilter, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const chunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(withFilter)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let CRC_TABLE: number[] | null = null;
function crc32(buf: Buffer): number {
  if (!CRC_TABLE) {
    CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c;
    });
  }
  let c = 0xffffffff;
  for (const byte of buf) c = (CRC_TABLE[(c ^ byte) & 0xff] as number) ^ (c >>> 8);
  return c ^ 0xffffffff;
}

/** What the phone posts: the fields, then one `files` part per picture. */
function intakeForm(
  fields: Record<string, string>,
  pictures: { name: string; bytes: Buffer }[],
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  for (const picture of pictures) {
    form.append(
      "files",
      new Blob([new Uint8Array(picture.bytes)], { type: "image/png" }),
      picture.name,
    );
  }
  return form;
}

/** Every item folder `inbox:pull` has written, newest day first. */
function pulledItems(): { id: string; dir: string; context: Record<string, unknown> }[] {
  if (!existsSync(INBOX)) return [];
  const out: { id: string; dir: string; context: Record<string, unknown> }[] = [];
  for (const day of readdirSync(INBOX).sort().reverse()) {
    const dayDir = join(INBOX, day);
    for (const id of readdirSync(dayDir)) {
      const dir = join(dayDir, id);
      const file = join(dir, "context.json");
      if (!existsSync(file)) continue;
      out.push({ id, dir, context: JSON.parse(readFileSync(file, "utf8")) });
    }
  }
  return out;
}

test("1. dán nhật ký lớp → 3 mục đã học, 3 bài cô giao, 1 nhắc đồng phục", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/parent/diary");
  await page.getByTestId("diary-text").fill(DIARY_POST);
  await page.getByTestId("diary-save").click();

  const result = page.getByTestId("diary-result");
  await expect(result).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("diary-lessons").locator("li")).toHaveCount(3);
  await expect(page.getByTestId("diary-homework").locator("li")).toHaveCount(3);
  await expect(page.getByTestId("diary-reminders").locator("li")).toHaveCount(1);
  await expect(result).toContainText("Bài 13");
  await expect(result).toContainText("khuyến khích");
  await expect(result).toContainText(/đồng phục/i);
  await page.screenshot({ path: join(SHOTS, "diary-parsed.png"), fullPage: true });
});

test("1b. Daily Quest sau đó mở đầu bằng bài cô giao và bám bài hôm nay", async ({ page }) => {
  await adminLogin(page);
  const res = await page.request.post("/api/sessions", { data: { studentId, force: true } });
  expect(res.ok(), await res.text()).toBeTruthy();
  const session = await res.json();
  // The session as the child sees it: stations in order, homework first.
  const items = (session.items ?? []) as { skillCode: string; kind: string; homework?: unknown }[];
  expect(items.length).toBeGreaterThan(8);
  expect(items[0]?.kind, `trạm đầu: ${JSON.stringify(items[0])}`).toBe("homework");
  expect(items[0]?.homework).toBeTruthy();
  const vietFocus = items.filter((s) => s.kind === "focus" && s.skillCode.startsWith("VIET."));
  expect(
    vietFocus.length,
    `phiên: ${items.map((s) => `${s.kind}:${s.skillCode}`).join(", ")}`,
  ).toBeGreaterThan(0);
});

test("2-5. 5 ảnh → hàng chờ → đọc → duyệt: BLANK, mastery, Raz-Kids", async ({ page }) => {
  await adminLogin(page);
  const started = Date.now();

  // ── 5 photos of Vietnamese schoolwork, the way a phone sends them ────────────────────────────
  const upload = await page.request.post("/api/intake", {
    multipart: intakeForm(
      { studentId, subject: "VIET", docType: "WORKBOOK", note: "vở Tiếng Việt bài 13" },
      [1, 2, 3, 4, 5].map((n) => ({ name: `vo-tv-${n}.png`, bytes: pagePng(n) })),
    ),
  });
  expect(upload.ok(), await upload.text()).toBeTruthy();
  const { jobId, files } = await upload.json();
  expect(files).toBe(5);

  // ── a half-finished ESL worksheet, and a Raz-Kids screenshot ─────────────────────────────────
  const worksheet = await page.request.post("/api/intake", {
    multipart: intakeForm({ studentId, subject: "ESL", docType: "WORKSHEET" }, [
      { name: "phieu-esl.png", bytes: pagePng(7) },
    ]),
  });
  expect(worksheet.ok(), await worksheet.text()).toBeTruthy();
  const worksheetJob = (await worksheet.json()).jobId as string;

  const raz = await page.request.post("/api/intake", {
    multipart: intakeForm({ studentId, subject: "ENL", docType: "KIDSAZ_REPORT" }, [
      { name: "raz.png", bytes: pagePng(9) },
    ]),
  });
  expect(raz.ok(), await raz.text()).toBeTruthy();
  const razJob = (await raz.json()).jobId as string;

  // ── the worker's own preprocessing, run now instead of waiting for the minute cron ───────────
  const log = pnpm("intake:run");
  console.log(`[pha 4] intake:run\n${log}`);
  pnpm("inbox:pull");
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(`[pha 4] 5 ảnh vở → sẵn sàng để đọc trong ${seconds} giây`);
  expect(seconds, "ảnh vở chưa sẵn sàng trong 90 giây").toBeLessThanOrEqual(90);

  const items = pulledItems();
  const jobOf = (id: string) =>
    items.find((i) => (i.context.payload as { jobId?: string })?.jobId === id);
  const vietItem = jobOf(jobId);
  if (!vietItem) throw new Error("không thấy context.json của lô ảnh vở");
  const vietContext = vietItem.context as {
    files: string[];
    student: { nickname: string };
    errorCodes: unknown[];
  };
  // The pictures travel with the context: whoever reads the queue has them to hand (docs/13 §2).
  expect(vietContext.files.length).toBe(5);
  expect(existsSync(join(vietItem.dir, vietContext.files[0] as string))).toBe(true);
  // Nothing but the nickname ever reaches the reader (NFR-06).
  expect(JSON.stringify(vietContext)).not.toContain("Mai Thy");
  expect(vietContext.student.nickname).toBe("Thy");
  expect(vietContext.errorCodes.length).toBeGreaterThan(30);

  // ── what a reader writes back ────────────────────────────────────────────────────────────────
  writeFileSync(
    join(vietItem.dir, "result.json"),
    JSON.stringify(
      {
        kind: "PHOTO_INTAKE",
        docType: "WORKBOOK",
        subject: "VIET",
        summary: "Vở Tiếng Việt bài 13: u, ư",
        confidence: 0.9,
        items: [
          {
            index: 0,
            questionText: "Viết chữ u",
            studentAnswer: "u",
            outcome: "CORRECT",
            skillCodes: ["VIET.HV.AM_U_UW"],
            bbox: [0.1, 0.1, 0.3, 0.12],
            fileIndex: 0,
          },
          {
            index: 1,
            questionText: "Viết chữ ư",
            studentAnswer: "ư",
            outcome: "CORRECT",
            skillCodes: ["VIET.HV.AM_U_UW"],
            bbox: [0.1, 0.3, 0.3, 0.12],
            fileIndex: 0,
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  const eslItem = jobOf(worksheetJob);
  if (!eslItem) throw new Error("không thấy context.json của phiếu ESL");
  // docs/11 §9: Exercise 2 answered twice, then four blanks running to the end of the page.
  writeFileSync(
    join(eslItem.dir, "result.json"),
    JSON.stringify(
      {
        kind: "PHOTO_INTAKE",
        docType: "WORKSHEET",
        subject: "ESL",
        summary: "GS1 – UNIT 1 – REVIEW UNIT 1, Exercise 2 (con làm 2/6 câu)",
        confidence: 0.82,
        items: ["old", "young", null, null, null, null].map((answer, index) => ({
          index,
          questionText: `Ex2.${index + 1} unscramble`,
          studentAnswer: answer,
          outcome: answer ? "CORRECT" : "BLANK",
          skillCodes: ["ESL.VOC.ADJECTIVES"],
          fileIndex: 0,
        })),
      },
      null,
      2,
    ),
    "utf8",
  );

  const razItem = jobOf(razJob);
  if (!razItem) throw new Error("không thấy context.json của ảnh Raz-Kids");
  writeFileSync(
    join(razItem.dir, "result.json"),
    JSON.stringify(
      {
        kind: "PHOTO_INTAKE",
        docType: "KIDSAZ_REPORT",
        subject: "ENL",
        summary: "Kids A-Z: con đang đọc ở mức D",
        confidence: 0.95,
        items: [],
        externals: [{ platform: "KIDSAZ", metric: "raz_level", value: "D" }],
      },
      null,
      2,
    ),
    "utf8",
  );

  const validated = pnpm("inbox:validate");
  console.log(`[pha 4] inbox:validate\n${validated}`);
  const pushed = pnpm("inbox:push");
  console.log(`[pha 4] inbox:push\n${pushed}`);

  // ── 2. the worksheet: BLANK, never "sai", and one tap changes the reason ─────────────────────
  await page.goto("/parent/inbox");
  await page
    .getByRole("link", { name: /REVIEW UNIT 1/ })
    .first()
    .click();
  await page.waitForURL(/\/parent\/intake\//);
  // No row is labelled a mistake, and all four blanks are read as "ran out of time" — the four
  // unanswered questions run to the end of the page (docs/07 §2.2).
  await expect(page.getByRole("button", { name: "Sai", exact: true })).toHaveCount(0);
  await expect(page.getByText("Để trống không phải là làm sai")).toBeVisible();
  await expect(page.getByTestId("blank-NOT_FINISHED")).toHaveCount(4);
  await page.screenshot({ path: join(SHOTS, "review-blank.png"), fullPage: true });
  await page.getByTestId("blank-DOES_NOT_KNOW").first().click();
  await page.getByTestId("approve-all").click();
  await page.waitForURL("**/parent/inbox");

  // ── 4. the Vietnamese workbook: approving moves the mastery ──────────────────────────────────
  const skill = "VIET.HV.AM_U_UW";
  const before = await page.request
    .get(`/api/students/${studentId}/mastery?subject=VIET`)
    .then((r) => r.json());
  const masteryBefore =
    (before.items as { code: string; mastery: number }[]).find((s) => s.code === skill)?.mastery ??
    0;

  await page
    .getByRole("link", { name: /Vở Tiếng Việt bài 13/ })
    .first()
    .click();
  await page.waitForURL(/\/parent\/intake\//);
  await expect(page.locator("img[alt='Ảnh bài vở của con']")).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "review-workbook.png"), fullPage: true });
  await page.getByTestId("approve-all").click();
  await page.waitForURL("**/parent/inbox");

  const after = await page.request
    .get(`/api/students/${studentId}/mastery?subject=VIET`)
    .then((r) => r.json());
  const row = (after.items as { code: string; mastery: number; evidenceCount: number }[]).find(
    (s) => s.code === skill,
  );
  expect(row?.mastery ?? 0).toBeGreaterThan(masteryBefore);
  const history = await page.request
    .get(`/api/students/${studentId}/mastery/history?skill=${skill}`)
    .then((r) => r.json());
  expect(
    (history.evidences as { source: string }[]).some((e) => e.source === "INTAKE_PHOTO"),
    "bằng chứng từ ảnh vở chưa hiện trong lịch sử kỹ năng",
  ).toBeTruthy();

  // ── 5. Raz-Kids: the level is recorded and the reading skills move ───────────────────────────
  await page
    .getByRole("link", { name: /Kids A-Z/ })
    .first()
    .click();
  await page.waitForURL(/\/parent\/intake\//);
  await page.getByTestId("approve-all").click();
  await page.waitForURL("**/parent/inbox");

  const enl = await page.request
    .get(`/api/students/${studentId}/mastery?subject=ENL`)
    .then((r) => r.json());
  const rows = enl.items as { code: string; mastery: number }[];
  expect(rows.find((s) => s.code === "ENL.RF.FLUENCY_LEVEL_D")?.mastery).toBeCloseTo(70, 0);
  expect(rows.find((s) => s.code === "ENL.RF.FLUENCY_LEVEL_C")?.mastery).toBeCloseTo(85, 0);
});

test("6. hộp thư duyệt: ba hàng chờ, badge, và SSE báo khi có kết quả", async ({ page }) => {
  await adminLogin(page);
  await page.goto("/parent/inbox");
  await expect(page.getByText("Chờ ba mẹ duyệt")).toBeVisible();
  await expect(page.getByText("Đang chờ đọc (hàng chờ AI)")).toBeVisible();
  await expect(page.getByText("Bài mở chờ chấm")).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "inbox.png"), fullPage: true });

  // The stream the page listens to: it must carry how many readings are waiting for a parent, so
  // the list refreshes itself when `inbox:push` runs on the computer in the other room.
  const first = await page.evaluate(
    (id) =>
      new Promise<{ toReview?: number } | null>((resolve) => {
        const source = new EventSource(`/api/events?studentId=${encodeURIComponent(id)}`);
        source.addEventListener("state", (event) => {
          source.close();
          resolve(JSON.parse((event as MessageEvent).data));
        });
        setTimeout(() => {
          source.close();
          resolve(null);
        }, 10_000);
      }),
    studentId,
  );
  expect(first, "SSE không gửi state nào").not.toBeNull();
  expect(typeof first?.toReview).toBe("number");
});
