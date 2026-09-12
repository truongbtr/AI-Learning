import { expect, type Page, test } from "@playwright/test";

/**
 * Phase 8b acceptance (docs/13 §7, docs/14): the door Claude chat comes in through, and the undo
 * that makes it safe to apply without asking.
 *
 *   $env:INTERNAL_API_TOKEN="…"; $env:E2E_ADMIN_PASSWORD="…"
 *   pnpm --filter @mtct/web exec playwright test e2e/phase8b-acceptance.spec.ts
 *
 * The first four tests need nothing but the token — they are the whole of criteria 1, 2 and 4, and
 * they walk the real road: the phone reads the context, pushes a reading, and the reading becomes
 * evidence. The last two need a signed-in adult, because what they check is the card on the
 * dashboard and the tap on "Hoàn tác lô này" (criterion 3).
 */

const TOKEN = process.env.INTERNAL_API_TOKEN;
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const PARENT_USER = process.env.E2E_PARENT_USER;
const PARENT_PASSWORD = process.env.E2E_PARENT_PASSWORD;

const STUDENT = "thy";
/**
 * A class nobody is in.
 *
 * An earlier version of this test pasted into `1B3` on today's date, and `saveClassDiary` upserts by
 * (class, day): it overwrote the post the teacher had actually sent this morning and rebuilt the
 * evening's homework from the test text. A test that can damage the day it runs on is not a test.
 * With a class name no child belongs to, the pattern reader is still exercised end to end and not a
 * single row of either child's evening can move.
 */
const TEST_CLASS = "E2E-8B";

test.describe.configure({ mode: "serial" });
test.setTimeout(120_000);

let contextId = "";
let skillCode = "";
let batchId = "";

function auth() {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

test.describe("the chat door (docs/13 §7)", () => {
  test.beforeEach(() => {
    test.skip(!TOKEN, "cần INTERNAL_API_TOKEN (chính biến trong .env)");
  });

  test("1 — GET /api/internal/context trả skillCandidates; không token thì 401", async ({
    request,
  }) => {
    const anonymous = await request.get(`/api/internal/context?student=${STUDENT}`);
    expect(anonymous.status()).toBe(401);

    const today = new Date().toISOString().slice(0, 10);
    const res = await request.get(`/api/internal/context?student=${STUDENT}&date=${today}`, {
      headers: auth(),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.contextId).toBeTruthy();
    expect(body.skillCandidates.length).toBeGreaterThan(0);
    expect(body.errorCodes.length).toBeGreaterThan(10);
    // The rules travel with the context, so a fresh chat session cannot be unaware of them.
    expect(body.rules.join(" ")).toContain("BLANK");
    contextId = body.contextId;
    skillCode = body.skillCandidates[0].code;
  });

  test("4 — mã kỹ năng lạ, mã lỗi lạ và thiếu trường đều 400 kèm chỗ sai", async ({ request }) => {
    const badSkill = await request.post("/api/internal/intake", {
      headers: auth(),
      data: {
        kind: "PHOTO_INTAKE",
        student: STUDENT,
        confidence: 0.9,
        items: [
          {
            index: 0,
            outcome: "CORRECT",
            studentAnswer: "7",
            skillCodes: ["VMATH.SO.KHONG_CO_THAT"],
          },
        ],
      },
    });
    expect(badSkill.status()).toBe(400);
    const badSkillBody = await badSkill.json();
    expect(badSkillBody.details[0].path).toBe("items[0].skillCodes[0]");

    const badError = await request.post("/api/internal/intake", {
      headers: auth(),
      data: {
        kind: "PHOTO_INTAKE",
        student: STUDENT,
        confidence: 0.9,
        items: [
          {
            index: 0,
            outcome: "INCORRECT",
            studentAnswer: "12",
            errorCode: "loi_tu_bia_ra",
            skillCodes: [skillCode],
          },
        ],
      },
    });
    expect(badError.status()).toBe(400);
    expect((await badError.json()).details[0].path).toBe("items[0].errorCode");

    const missing = await request.post("/api/internal/intake", {
      headers: auth(),
      data: { student: STUDENT },
    });
    expect(missing.status()).toBe(400);
    expect((await missing.json()).details[0].path).toBe("kind");
  });

  test("giữ lại chờ người khi máy đọc chưa chắc (confidence < 0,6)", async ({ request }) => {
    const res = await request.post("/api/internal/intake", {
      headers: auth(),
      data: {
        kind: "PHOTO_INTAKE",
        student: STUDENT,
        contextId,
        confidence: 0.4,
        summary: "ảnh mờ, đọc không chắc",
        items: [{ index: 0, outcome: "CORRECT", studentAnswer: "7", skillCodes: [skillCode] }],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("HELD");
    expect(body.evidence).toBe(0);
    expect(body.heldReasons.join(" ")).toContain("chưa chắc");
    // Nothing is lost: the page is there for a parent on the screen phase 4 built.
    expect(body.reviewHref).toContain("/parent/intake/");
  });

  test("2 — một IntakeExtraction hợp lệ thành bằng chứng và mastery đổi", async ({ request }) => {
    const res = await request.post("/api/internal/intake", {
      headers: auth(),
      data: {
        kind: "PHOTO_INTAKE",
        student: STUDENT,
        contextId,
        docType: "WORKSHEET",
        confidence: 0.92,
        summary: "phiếu bài tập tối nay, 2 câu",
        items: [
          {
            index: 0,
            questionText: "3 + 4 =",
            studentAnswer: "7",
            outcome: "CORRECT",
            skillCodes: [skillCode],
          },
          {
            index: 1,
            questionText: "6 + 2 =",
            studentAnswer: "8",
            outcome: "CORRECT",
            skillCodes: [skillCode],
          },
        ],
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("APPLIED");
    expect(body.evidence).toBe(2);
    expect(body.mastery[0].after).toBeGreaterThan(body.mastery[0].before);
    batchId = body.batchId;
  });

  test("nhật ký lớp dán từ điện thoại đi qua bộ đọc theo mẫu", async ({ request }) => {
    const res = await request.post("/api/internal/diary", {
      headers: auth(),
      data: {
        className: TEST_CLASS,
        date: new Date().toISOString().slice(0, 10),
        text: [
          "Phần Thông tin",
          "- Tiếng Việt: Bài 13 - âm b",
          "- Toán: Bài 02 - các số 1 đến 5",
          "Phần dặn dò",
          "- Luyện đọc 3 lần Bài 13 trang 28",
        ].join("\n"),
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.lessons).toBeGreaterThan(0);
    expect(body.message).toContain("nhật ký lớp");
  });
});

test.describe("3 — thẻ tối nay và nút Hoàn tác lô này (docs/13 §7.3)", () => {
  async function login(page: Page): Promise<void> {
    const user = PARENT_PASSWORD ? PARENT_USER : ADMIN_USER;
    const password = PARENT_PASSWORD ?? ADMIN_PASSWORD;
    test.skip(!password, "cần E2E_ADMIN_PASSWORD (hoặc E2E_PARENT_USER + E2E_PARENT_PASSWORD)");
    await page.goto("/login");
    await page.getByLabel("Tên đăng nhập").fill(user as string);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password as string);
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await page.waitForURL(/\/admin\/users|\/parent|\/change-password/, { timeout: 30_000 });
  }

  test("thẻ hiện trên dashboard, bấm hoàn tác thì bằng chứng biến mất", async ({
    page,
    request,
  }) => {
    test.skip(!TOKEN, "cần INTERNAL_API_TOKEN");
    test.skip(!batchId, "chưa có lô nào từ bài kiểm tra 2");
    await login(page);

    await page.goto("/parent");
    const card = page.getByTestId(`chat-batch-${batchId}`);
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card).toContainText("bằng chứng");

    await card.getByTestId("undo-batch").click();
    await expect(card).toContainText("Đã gỡ", { timeout: 30_000 });

    // And the batch really is gone from the learning record, not just from the screen.
    await page.reload();
    const after = page.getByTestId(`chat-batch-${batchId}`);
    await expect(after).toContainText("đã hoàn tác");
    await expect(after.getByTestId("undo-batch")).toHaveCount(0);

    const undoAgain = await request.post("/api/parent/chat-batch", {
      data: { batchId },
      failOnStatusCode: false,
    });
    // A second tap from a stale tab changes nothing; without a session it is not even allowed.
    expect([200, 401, 404]).toContain(undoAgain.status());
  });
});
