import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Phase 0 acceptance (docs/08 pha 0 "Tiêu chí xong") against a running stack.
 * Works on a fresh install (seed password → forced change to E2E_ADMIN_NEW_PASSWORD) or on a stack
 * whose admin password was already changed:
 *   E2E_ADMIN_USER=admin E2E_ADMIN_PASSWORD=... [E2E_ADMIN_NEW_PASSWORD=...] [E2E_BASE_URL=http://localhost:3001] pnpm e2e
 * Creates one parent + two children with a unique suffix each run and saves screenshots
 * to docs/screens/pha-0/.
 */
const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
/** Seed password from .env; if the first login forces a change, the suite switches to NEW_ADMIN_PASSWORD. */
const SEED_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const NEW_ADMIN_PASSWORD = process.env.E2E_ADMIN_NEW_PASSWORD ?? `${SEED_ADMIN_PASSWORD}-moi`;
let ADMIN_PASSWORD = SEED_ADMIN_PASSWORD;
const SHOTS = join(__dirname, "..", "..", "..", "docs", "screens", "pha-0");
const suffix = Date.now().toString(36).slice(-5);

const PARENT = { username: `me-${suffix}`, displayName: "Mẹ", password: "Me-TamThoi-2026!" };
const THY = {
  username: `thy-${suffix}`,
  nickname: "Thy",
  pin: ["cat", "rabbit", "butterfly", "fish"],
};
const THANH = {
  username: `thanh-${suffix}`,
  nickname: "Thanh",
  pin: ["dog", "lion", "elephant", "turtle"],
};
const PIC_LABEL: Record<string, string> = {
  cat: "Mèo",
  rabbit: "Thỏ",
  butterfly: "Bướm",
  fish: "Cá",
  dog: "Chó",
  lion: "Sư tử",
  elephant: "Voi",
  turtle: "Rùa",
};

test.describe.configure({ mode: "serial" });
test.skip(!SEED_ADMIN_PASSWORD, "set E2E_ADMIN_PASSWORD to run the phase 0 acceptance flow");

const ids: {
  parent?: string;
  thy?: string;
  thanh?: string;
  thyStudent?: string;
  thanhStudent?: string;
} = {};

async function adultLogin(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

async function logout(page: Page) {
  await page.context().clearCookies();
}

async function kidPickPin(page: Page, pin: string[]) {
  for (const key of pin) {
    await page.getByRole("button", { name: PIC_LABEL[key], exact: true }).click();
  }
}

/** Picks a pin and waits for the server action round-trip, then returns the alert text. */
async function attemptPin(page: Page, pin: string[]): Promise<string> {
  const responded = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/login",
  );
  await kidPickPin(page, pin);
  await responded;
  await page.waitForTimeout(300);
  return (await page.locator("p[role=alert]").textContent()) ?? "";
}

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true });
});

// Leave no active test accounts behind (there is no hard delete by design).
test.afterAll(async ({ browser }) => {
  if (!ADMIN_PASSWORD) return;
  const page = await browser.newPage();
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/admin\/users/);
  for (const id of [ids.parent, ids.thy, ids.thanh]) {
    if (id) await page.request.patch(`/api/admin/users/${id}`, { data: { isActive: false } });
  }
  await page.close();
});

test("1. admin login: forced password change on a fresh install, then /admin/users — screenshot /login", async ({
  page,
}) => {
  await page.goto("/login");
  await page.screenshot({ path: join(SHOTS, "login.png"), fullPage: true });
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  // Fresh install: the seeded admin must change the password before anything else (criterion 1).
  await page.waitForURL(/\/(admin\/users|change-password)/);
  if (page.url().includes("/change-password")) {
    await page.goto("/admin/users");
    await expect(page).toHaveURL(/\/change-password/); // every other page bounces back here
    expect((await page.request.get("/api/admin/users")).status()).toBe(403);
    await page.getByLabel("Mật khẩu hiện tại").fill(ADMIN_PASSWORD!);
    await page.getByLabel("Mật khẩu mới", { exact: true }).fill(NEW_ADMIN_PASSWORD);
    await page.getByLabel("Nhập lại mật khẩu mới").fill(NEW_ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
    ADMIN_PASSWORD = NEW_ADMIN_PASSWORD;
  }
  await expect(page).toHaveURL(/\/admin\/users/);
});

test("2. admin creates 1 parent + 2 children (UI dialog for a child, API for the rest) and links them", async ({
  page,
}) => {
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  await expect(page).toHaveURL(/\/admin\/users/);
  // Deactivate accounts left by earlier runs so the login page shows only this run's children.
  const before = (await (await page.request.get("/api/admin/users")).json()) as {
    items: { id: string; username: string; isActive: boolean }[];
  };
  for (const u of before.items) {
    if (
      /^(thy|thanh|me)-[a-z0-9]{5}$/.test(u.username) &&
      u.isActive &&
      !u.username.endsWith(suffix)
    ) {
      await page.request.patch(`/api/admin/users/${u.id}`, { data: { isActive: false } });
    }
  }
  const started = Date.now();

  // Child #1 through the real dialog (avatar, pin grid, student profile).
  await page.getByRole("button", { name: "+ Tạo tài khoản" }).click();
  const dialog = page.locator("dialog[open]");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Vai trò").selectOption("CHILD");
  await dialog.getByLabel("Tên đăng nhập").fill(THY.username);
  await dialog.getByLabel("Tên hiển thị").fill("Thy");
  await dialog.getByLabel("Họ tên đầy đủ").fill("Mai Thy");
  await dialog.getByLabel("Tên gọi ở nhà").fill(THY.nickname);
  await dialog.getByLabel("Sở thích (phẩy)").fill("múa, vẽ");
  await dialog.getByLabel("Mascot").selectOption("OWL");
  await kidPickPin(dialog.locator("form"), THY.pin);
  await dialog.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("cell", { name: THY.username, exact: true })).toBeVisible();

  // Child #2 and the parent through the same API the dialog uses.
  const thanh = await page.request.post("/api/admin/users", {
    data: {
      role: "CHILD",
      username: THANH.username,
      displayName: "Thanh",
      avatarKey: "boy-1",
      pictureSetKey: "animals",
      pin: THANH.pin,
      student: {
        fullName: "Chí Thanh",
        nickname: THANH.nickname,
        interests: ["robot", "cờ vua"],
        mascot: "ROBOT",
      },
      guardianUserIds: [],
    },
  });
  expect(thanh.status()).toBe(201);
  const users = (await (await page.request.get("/api/admin/users")).json()) as {
    items: { id: string; username: string; student: { id: string } | null }[];
  };
  const thyRow = users.items.find((u) => u.username === THY.username)!;
  const thanhRow = users.items.find((u) => u.username === THANH.username)!;
  ids.thy = thyRow.id;
  ids.thanh = thanhRow.id;
  ids.thyStudent = thyRow.student!.id;
  ids.thanhStudent = thanhRow.student!.id;

  // Parent linked to Thy only (Thanh stays unlinked to prove the 403 later).
  const parent = await page.request.post("/api/admin/users", {
    data: {
      role: "PARENT",
      username: PARENT.username,
      displayName: PARENT.displayName,
      email: `${PARENT.username}@example.com`,
      avatarKey: "mom",
      password: PARENT.password,
      guardianStudentIds: [ids.thyStudent],
    },
  });
  expect(parent.status()).toBe(201);
  ids.parent = ((await parent.json()) as { id: string }).id;

  await page.reload();
  await expect(page.getByRole("cell", { name: PARENT.username, exact: true })).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "admin-users.png"), fullPage: true });
  expect(Date.now() - started).toBeLessThan(3 * 60 * 1000);
});

test("3. child taps the avatar card, picks 4 pictures and sees the home name — screenshot /kid/home", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: /^👧?\s*Thy$/ })
    .first()
    .click();
  await expect(page.getByText("Chọn 4 hình của con nhé")).toBeVisible();
  await kidPickPin(page, THY.pin);
  await expect(page).toHaveURL(/\/kid\/home/);
  await expect(page.getByText("Chào Thy!")).toBeVisible();
  await page.screenshot({ path: join(SHOTS, "kid-home.png"), fullPage: true });
  // Child cannot open the parent area.
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/kid\/home/);
});

test("4. five wrong pins lock the child for 10 minutes and write 5 LoginAudit rows", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Thanh/ }).first().click();
  test.setTimeout(240_000);
  const wrong = ["cat", "cat", "cat", "cat"];
  let wrongCount = 0;
  while (wrongCount < 5) {
    const text = await attemptPin(page, wrong);
    if (text.includes("nghỉ một chút")) {
      // IP throttle (10 failed attempts/minute) tripped by an earlier run — wait for the window to pass.
      await page.waitForTimeout(61_000);
      continue;
    }
    wrongCount++;
    expect(text).toContain(wrongCount < 5 ? "Chưa đúng rồi" : "10 phút");
  }
  // Even the correct pin is refused while locked.
  expect(await attemptPin(page, THANH.pin)).toContain("10 phút");

  // Audit trail (admin API): 5 WRONG_PASSWORD + LOCKED rows for this child.
  await logout(page);
  await adultLogin(page, ADMIN_USER, ADMIN_PASSWORD!);
  await expect(page).toHaveURL(/\/admin\/users/);
  const logins = (await (
    await page.request.get(`/api/admin/users/${ids.thanh}/logins`)
  ).json()) as {
    items: { result: string }[];
  };
  expect(logins.items.filter((l) => l.result === "WRONG_PASSWORD")).toHaveLength(5);
  expect(logins.items.some((l) => l.result === "LOCKED")).toBe(true);
  // Unlock for later tests by resetting the pin (admin op #3).
  const reset = await page.request.post(`/api/admin/users/${ids.thanh}/reset-credential`, {
    data: { pin: THANH.pin, pictureSetKey: "animals" },
  });
  expect(reset.ok()).toBe(true);
});

test("5. authorization: child → other child 403, unlinked parent 403, guest → /login", async ({
  page,
}) => {
  // Child Thy asks for Thanh's mastery → 403; own → 200.
  await page.goto("/login");
  await page.getByRole("button", { name: /Thy/ }).first().click();
  await kidPickPin(page, THY.pin);
  await expect(page).toHaveURL(/\/kid\/home/);
  expect((await page.request.get(`/api/students/${ids.thanhStudent}/mastery`)).status()).toBe(403);
  expect((await page.request.get(`/api/students/${ids.thyStudent}/mastery`)).status()).toBe(200);
  expect((await page.request.get("/api/admin/users")).status()).toBe(403);

  // Parent (linked to Thy only) — first login forces a password change, then Thanh → 403, Thy → 200.
  await logout(page);
  await adultLogin(page, PARENT.username, PARENT.password);
  await expect(page).toHaveURL(/\/change-password/);
  await page.getByLabel("Mật khẩu hiện tại").fill(PARENT.password);
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("Me-MoiMoi-2026!");
  await page.getByLabel("Nhập lại mật khẩu mới").fill("Me-MoiMoi-2026!");
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  await expect(page).toHaveURL(/\/parent/);
  expect((await page.request.get(`/api/students/${ids.thanhStudent}/mastery`)).status()).toBe(403);
  expect((await page.request.get(`/api/students/${ids.thyStudent}/mastery`)).status()).toBe(200);
  expect((await page.request.get("/api/admin/users")).status()).toBe(403);

  // Guest → /login.
  await logout(page);
  await page.goto("/parent");
  await expect(page).toHaveURL(/\/login/);
  expect((await page.request.get(`/api/students/${ids.thyStudent}/mastery`)).status()).toBe(401);
});

test("6. /api/health reports db ok and a recent worker ping", async ({ request }) => {
  const body = (await (await request.get("/api/health")).json()) as {
    db: string;
    worker: { ok: boolean; ageSeconds: number | null };
  };
  expect(body.db).toBe("ok");
  expect(body.worker.ok).toBe(true);
  expect(body.worker.ageSeconds).toBeLessThanOrEqual(360);
});
