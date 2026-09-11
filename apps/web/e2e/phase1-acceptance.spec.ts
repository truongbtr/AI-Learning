import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Phase 1 acceptance (docs/08 pha 1 "Tiêu chí xong") against a running, seeded stack:
 *   $env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="chrome"; pnpm e2e
 *
 * 2. POST /api/evidence three times → SkillMastery.status follows docs/04 §3.3; ErrorStat counts
 *    the error code; an unknown error code is 400.
 * 3. /admin/skills lists ≥ 35 skills per subject and ≥ 250 in total.
 * 4. GET /api/skills/search?q=đọc từ có sh → ESL.PH.DIGRAPHS_SH_CH_TH in the top 3.
 * Also: a CHILD may not write evidence, and mastery of another child stays 403.
 */
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const SEED_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? SEED_ADMIN_PASSWORD;
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-1");
const suffix = Date.now().toString(36).slice(-5);
const KID = {
  username: `p1kid-${suffix}`,
  nickname: "Bé Thử",
  pin: ["cat", "dog", "fish", "lion"],
};
const SKILL = "VMATH.SO.CONG_PV_10";
const PIC_LABEL: Record<string, string> = { cat: "Mèo", dog: "Chó", fish: "Cá", lion: "Sư tử" };

test.describe.configure({ mode: "serial" });
test.skip(!ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to run the phase 1 acceptance flow");

const ids: { userId?: string; studentId?: string } = {};

async function adultLogin(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/(admin|parent|change-password)/);
}

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true });
});

/** Leave no active test account behind (the login page shows every active child). */
test.afterAll(async ({ browser }) => {
  if (!ids.userId) return;
  const page = await browser.newPage();
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  await page.request.patch(`/api/admin/users/${ids.userId}`, { data: { isActive: false } });
  await page.close();
});

test("1. a throw-away child is created for the evidence run", async ({ page }) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  // Earlier runs (or a run that crashed) may have left an active test child behind.
  const before = (await (await page.request.get("/api/admin/users")).json()) as {
    items: { id: string; username: string; isActive: boolean }[];
  };
  for (const u of before.items) {
    if (u.isActive && /^p1kid-/.test(u.username)) {
      await page.request.patch(`/api/admin/users/${u.id}`, { data: { isActive: false } });
    }
  }
  const res = await page.request.post("/api/admin/users", {
    data: {
      role: "CHILD",
      username: KID.username,
      displayName: KID.nickname,
      avatarKey: "girl-1",
      pictureSetKey: "animals",
      pin: KID.pin,
      student: {
        fullName: "Bé Thử Pha Một",
        nickname: KID.nickname,
        className: "1B3",
        schoolYear: "2026-2027",
        interests: ["robot"],
        mascot: "OWL",
      },
      guardianUserIds: [],
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  ids.userId = ((await res.json()) as { id: string }).id;

  const users = (await (await page.request.get("/api/admin/users")).json()) as {
    items: { id: string; student: { id: string } | null }[];
  };
  ids.studentId = users.items.find((u) => u.id === ids.userId)?.student?.id;
  expect(ids.studentId).toBeTruthy();
});

test("2. three evidences move the status LEARNING → SOLID → NEEDS_PRACTICE (docs/04 §3.3)", async ({
  page,
}) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  const post = async (data: Record<string, unknown>) =>
    page.request.post("/api/evidence", {
      data: { studentId: ids.studentId, skillCode: SKILL, ...data },
    });

  const first = await post({ source: "EXERCISE", outcome: "CORRECT", score: 1, difficulty: 3 });
  expect(first.status(), await first.text()).toBe(201);
  const b1 = (await first.json()) as {
    mastery: { after: number; status: string; confidence: number };
  };
  expect(b1.mastery.after).toBeCloseTo(25.2, 1);
  expect(b1.mastery.status).toBe("LEARNING");

  const second = await post({ source: "PARENT_OVERRIDE", outcome: "OBSERVED", score: 0.7 });
  expect(second.status()).toBe(201);
  const b2 = (await second.json()) as {
    mastery: { after: number; status: string; nextReviewAt: string };
  };
  expect(b2.mastery.after).toBe(70);
  expect(b2.mastery.status).toBe("SOLID");
  expect(b2.mastery.nextReviewAt).not.toBeNull();

  const third = await post({
    source: "EXERCISE",
    outcome: "INCORRECT",
    score: 0,
    difficulty: 3,
    errorCode: "nham_cong_tru",
  });
  expect(third.status()).toBe(201);
  const b3 = (await third.json()) as {
    mastery: { after: number; status: string };
    errorStat: { count7d: number; count30d: number };
  };
  expect(b3.mastery.after).toBeCloseTo(59.2, 0);
  expect(b3.mastery.status).toBe("NEEDS_PRACTICE");
  expect(b3.errorStat).toEqual({ count7d: 1, count30d: 1 });

  // The same status is visible through the read API.
  const read = await page.request.get(`/api/students/${ids.studentId}/mastery?subject=VMATH`);
  expect(read.ok()).toBeTruthy();
  const mastery = (await read.json()) as {
    count: number;
    items: { code: string; status: string; mastery: number; nextReviewAt: string | null }[];
  };
  const row = mastery.items.find((i) => i.code === SKILL);
  expect(row?.status).toBe("NEEDS_PRACTICE");
  expect(mastery.count).toBeGreaterThanOrEqual(35);

  // History records every step, the override labelled as such.
  const hist = await page.request.get(
    `/api/students/${ids.studentId}/mastery/history?skill=${SKILL}`,
  );
  expect(hist.ok()).toBeTruthy();
  const history = (await hist.json()) as {
    history: { cause: string }[];
    evidences: { errorCode: string | null }[];
  };
  expect(history.history).toHaveLength(3);
  expect(history.history.map((h) => h.cause)).toContain("PARENT_OVERRIDE");
  expect(history.evidences.some((e) => e.errorCode === "nham_cong_tru")).toBe(true);
});

test("2b. an error code outside content/error-taxonomy.json is 400 and writes nothing", async ({
  page,
}) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  const before = await page.request.get(
    `/api/students/${ids.studentId}/mastery/history?skill=${SKILL}`,
  );
  const countBefore = ((await before.json()) as { evidences: unknown[] }).evidences.length;

  const res = await page.request.post("/api/evidence", {
    data: {
      studentId: ids.studentId,
      skillCode: SKILL,
      source: "EXERCISE",
      outcome: "INCORRECT",
      score: 0,
      errorCode: "khong_co_ma_nay",
    },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/Mã lỗi lạ/);

  const after = await page.request.get(
    `/api/students/${ids.studentId}/mastery/history?skill=${SKILL}`,
  );
  expect(((await after.json()) as { evidences: unknown[] }).evidences).toHaveLength(countBefore);
});

test("2c. a child cannot write evidence and cannot read another child's mastery", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: new RegExp(KID.nickname) })
    .last()
    .click();
  for (const pic of KID.pin) {
    await page.getByRole("button", { name: PIC_LABEL[pic]!, exact: true }).click();
  }
  await page.waitForURL(/\/kid\/home/, { timeout: 15_000 });

  const res = await page.request.post("/api/evidence", {
    data: {
      studentId: ids.studentId,
      skillCode: SKILL,
      source: "EXERCISE",
      outcome: "CORRECT",
      score: 1,
    },
  });
  expect(res.status()).toBe(403);

  const search = await page.request.get("/api/skills/search?q=sh");
  expect(search.status()).toBe(403); // skill lookup is for adults only
});

test("3. /admin/skills shows ≥ 250 skills with ≥ 35 in every subject — screenshot", async ({
  page,
}) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  await page.goto("/admin/skills");
  await expect(page.getByRole("heading", { name: "Bản đồ kỹ năng" })).toBeVisible();
  await expect(page.getByTestId("skill-total")).toContainText(/\d{3}/);
  const total = Number((await page.getByTestId("skill-total").textContent())?.replace(/\D/g, ""));
  expect(total).toBeGreaterThanOrEqual(250);

  for (const subject of ["VIET", "VMATH", "ESL", "ENL", "EMATH", "ESCI"]) {
    const count = Number(
      (await page.getByTestId(`subject-count-${subject}`).textContent())?.replace(/\D/g, ""),
    );
    expect(count, `${subject} skills`).toBeGreaterThanOrEqual(35);
  }
  // Viewport only: the full table is 350+ rows tall and unreadable as one image.
  await page.screenshot({ path: join(SHOTS, "admin-skills.png") });
});

test("4. full-text search finds the sh/ch/th skill in the top 3", async ({ page }) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  const res = await page.request.get(
    `/api/skills/search?q=${encodeURIComponent("đọc từ có sh")}&limit=3`,
  );
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { items: { code: string }[] };
  expect(body.items.map((i) => i.code)).toContain("ESL.PH.DIGRAPHS_SH_CH_TH");

  // Works without diacritics too.
  const plain = await page.request.get("/api/skills/search?q=doc%20tu%20co%20sh&limit=3");
  expect(
    ((await plain.json()) as { items: { code: string }[] }).items.map((i) => i.code),
  ).toContain("ESL.PH.DIGRAPHS_SH_CH_TH");

  // Vietnamese maths query from the acceptance list.
  const maths = await page.request.get(
    `/api/skills/search?q=${encodeURIComponent("cộng trong phạm vi 10")}&limit=3`,
  );
  expect(
    ((await maths.json()) as { items: { code: string }[] }).items.map((i) => i.code),
  ).toContain("VMATH.SO.CONG_PV_10");
});

test("5. admin can search, edit and retire a skill in /admin/skills", async ({ page }) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  await page.goto("/admin/skills");
  await page.getByLabel("Tìm kỹ năng").fill("dấu hỏi ngã");
  await expect(page.getByRole("button", { name: /VIET\.HV\.NHAM_LAN_DAU_HOI_NGA/ })).toBeVisible();
  await page.getByRole("button", { name: /VIET\.HV\.NHAM_LAN_DAU_HOI_NGA/ }).click();

  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Tên (tiếng Việt)")).toHaveValue(/hỏi/);
  await expect(dialog.getByText(/KNTT-TV1-T1-B06/)).toBeVisible(); // lessonRef is shown
  const original = await dialog.getByLabel("Tên (tiếng Việt)").inputValue();
  await dialog.getByLabel("Tên (tiếng Việt)").fill(`${original} (sửa thử)`);
  await dialog.getByRole("button", { name: "Lưu" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(`${original} (sửa thử)`)).toBeVisible();

  // Put it back exactly as the seed has it.
  await page.getByRole("button", { name: /VIET\.HV\.NHAM_LAN_DAU_HOI_NGA/ }).click();
  await dialog.getByLabel("Tên (tiếng Việt)").fill(original);
  await dialog.getByRole("button", { name: "Lưu" }).click();
  await expect(dialog).toBeHidden();
});
