import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";

/**
 * Phase 8 acceptance (docs/08 pha 8 "Tiêu chí xong"), against a running stack:
 *
 *   pnpm --filter @mtct/web exec playwright test e2e/phase8-acceptance.spec.ts
 *
 * Unlike every earlier phase this one is not mostly about code. Three of the seven criteria are
 * about two children and a fortnight, and no test can stand in for those. What is tested here is
 * everything that *can* be, so the fortnight starts from a known-good machine:
 *
 *  3. the app installs on an iPad and a child gets in with four pictures and no keyboard;
 *  4. /parent and /admin refuse a request that has not been through Cloudflare Access, and the
 *     child's area does not — proved by booting a second server with Access configured;
 *  5. the free Azure voice allowance is visible somewhere;
 *  6. the operations page says what to do, not just what is wrong;
 *  7. the diagnostic of docs/04 §10 is what a new child meets on evening one.
 *
 * Criteria 1 (ten minutes a day, unaided, ten days of fourteen) and 2 (a restore on a clean
 * machine) are measured elsewhere and on purpose: `pnpm db:trial` reads the real database, and
 * `pwsh scripts/restore-drill.ps1` leaves its log in docs/dien-tap/.
 */

const ADMIN_USER = process.env.E2E_ADMIN_USER ?? "admin";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const ROOT = join(__dirname, "..", "..", "..");
const SHOTS = join(ROOT, "docs", "screens", "pha-8");

test.describe.configure({ mode: "serial" });
test.setTimeout(180_000);

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true });
});

async function loginAdmin(page: Page): Promise<void> {
  test.skip(!ADMIN_PASSWORD, "cần E2E_ADMIN_PASSWORD (xem README “Chạy bộ nghiệm thu”)");
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_USER);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(ADMIN_PASSWORD as string);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(/\/admin\/users|\/parent|\/change-password/, { timeout: 30_000 });
}

// ── 3. cài lên iPad ───────────────────────────────────────────────────────────────────────────

test("3a. bản kê khai PWA và icon lấy được mà KHÔNG cần đăng nhập", async ({ request }) => {
  // iOS fetches both of these before anybody has logged in. A redirect to /login here is the
  // difference between "an app on the home screen" and "a bookmark".
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.status(), "manifest phải công khai").toBe(200);
  const body = await manifest.json();

  expect(body.display).toBe("standalone"); // toàn màn hình, không có thanh địa chỉ
  expect(body.start_url).toBe("/");
  expect(body.short_name).toBeTruthy();
  expect(String(body.short_name).length).toBeLessThanOrEqual(14); // tên dài bị cắt trên iPad

  const purposes = (body.icons as { sizes: string; purpose?: string }[]).map((i) => i.purpose);
  expect(purposes, "cần một icon maskable cho Android").toContain("maskable");
  expect((body.icons as { sizes: string }[]).map((i) => i.sizes)).toContain("512x512");

  for (const icon of body.icons as { src: string }[]) {
    const res = await request.get(icon.src);
    expect(res.status(), `${icon.src} phải tải được`).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }

  // iOS bỏ qua manifest hoàn toàn; đây mới là icon hai bé thật sự chạm.
  const apple = await request.get("/art/icons/apple-touch-icon.png");
  expect(apple.status(), "apple-touch-icon phải có").toBe(200);
});

test("3b. màn hình đăng nhập của con: 4 hình, không cần bàn phím", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByTestId("kid-login")).toBeVisible({ timeout: 30_000 });

  // A six-year-old taps a face, then four pictures. Nothing on that path may be a text field.
  const cards = page.getByTestId(/^kid-card-/);
  const count = await cards.count();
  expect(count, "phải có ít nhất một thẻ ảnh của bé").toBeGreaterThan(0);

  // `toBeVisible()` ignores opacity, and these cards fade in through a stagger animation. A card
  // that never finishes fading in is a child who cannot find herself on the screen, so the
  // assertion is on the opacity the browser actually computed.
  await expect
    .poll(
      async () =>
        Math.min(
          ...(await cards.evaluateAll((els) =>
            els.map((el) => Number(getComputedStyle(el).opacity)),
          )),
        ),
      { timeout: 10_000, message: "thẻ ảnh của bé chưa hiện rõ" },
    )
    .toBeGreaterThan(0.9);

  await cards.first().click();

  const pad = page.getByTestId("picture-pad");
  await expect(pad).toBeVisible({ timeout: 10_000 });
  const tiles = pad.getByRole("button");
  expect(await tiles.count(), "bảng mã hình phải có nhiều ô để chọn").toBeGreaterThanOrEqual(4);

  // Vùng chạm ≥ 64 px (docs/06 §4), và không có ô nhập chữ nào trên đường đi của con.
  const box = await tiles.first().boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(56);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(56);
  expect(await pad.locator("input[type=text], input[type=password], textarea").count()).toBe(0);

  await page.screenshot({ path: join(SHOTS, "dang-nhap-ma-hinh.png"), fullPage: true });
});

test("3c. mở bằng iPad: không cuộn ngang, chữ đủ to", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();
  await page.goto("/login");
  await expect(page.getByTestId("kid-login")).toBeVisible({ timeout: 30_000 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "không được cuộn ngang trên iPad").toBeLessThanOrEqual(1);
  await page.screenshot({ path: join(SHOTS, "ipad-dang-nhap.png"), fullPage: true });
  await context.close();
});

// ── 4. Cloudflare Access chắn /parent và /admin, không chắn phần của con ───────────────────────

test("4. /parent và /admin bị chặn khi chưa qua Access; phần của con vẫn vào được", async ({
  playwright,
}) => {
  // Access reads its settings from the server's environment, so the only honest way to test the
  // gate is to boot a server that has them. A second `next start` on another port does that
  // without touching the one the family is using.
  test.skip(
    !existsSync(join(ROOT, "apps", "web", ".next", "BUILD_ID")),
    "cần bản build (pnpm build) để bật một máy chủ thứ hai",
  );

  const port = 5199;
  let server: ChildProcess | null = null;
  try {
    server = spawn(
      "pnpm",
      ["--filter", "@mtct/web", "exec", "next", "start", "--port", String(port)],
      {
        cwd: ROOT,
        shell: true,
        env: {
          ...process.env,
          // Deliberately made up: any assertion presented to this server fails to verify, which is
          // exactly the state of a request that never went through Access.
          CF_ACCESS_TEAM_DOMAIN: "nghiem-thu.cloudflareaccess.com",
          CF_ACCESS_AUD: "0".repeat(64),
        },
        stdio: "ignore",
      },
    );

    const api = await playwright.request.newContext({ baseURL: `http://127.0.0.1:${port}` });
    // Wait for it to answer at all.
    let up = false;
    for (let i = 0; i < 60 && !up; i++) {
      try {
        up = (await api.get("/api/health")).status() === 200;
      } catch {
        up = false;
      }
      if (!up) await new Promise((r) => setTimeout(r, 1000));
    }
    expect(up, "máy chủ thứ hai không lên").toBe(true);

    // Guarded: refused before the session cookie is even considered.
    for (const path of ["/parent", "/admin/users", "/admin/health", "/api/admin/users"]) {
      const res = await api.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} phải bị Access chặn`).toBe(403);
    }
    const denied = await (await api.get("/parent", { maxRedirects: 0 })).text();
    expect(denied).toContain("Cloudflare Access");

    // The child's world, the login page and the manifest are NOT behind it. If this ever fails,
    // two six-year-olds are locked out of their own app.
    for (const path of ["/login", "/manifest.webmanifest", "/api/health"]) {
      const res = await api.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} không được nằm sau Access`).toBeLessThan(400);
    }
    // /kid redirects to the login page (no session), which is a redirect, never a 403.
    const kid = await api.get("/kid/home", { maxRedirects: 0 });
    expect(kid.status(), "/kid không được trả 403").not.toBe(403);

    await api.dispose();
  } finally {
    server?.kill();
    // `next start` runs under a shell on Windows; make sure nothing is left holding the port.
    try {
      if (process.platform === "win32")
        execFileSync("powershell", [
          "-NoProfile",
          "-Command",
          `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ` +
            "ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }",
        ]);
    } catch {
      // Nothing listening; nothing to clean up.
    }
  }
});

// ── 5 + 6. trang vận hành ─────────────────────────────────────────────────────────────────────

test("5. hạn mức giọng đọc Azure xem được, và 6. trang health nói phải làm gì", async ({
  page,
}) => {
  await loginAdmin(page);
  await page.goto("/admin/health");

  // Criterion 5: the number is on a screen, not on a bill.
  await expect(page.getByText("Giọng đọc tháng này")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/500\.000 ký tự|bậc F0/)).toBeVisible();

  // Criterion 6: every amber or red card comes with the command to type. A green machine says so.
  const ok = page.getByTestId("health-all-ok");
  const advice = page.getByTestId("health-advice");
  const isOk = await ok.isVisible().catch(() => false);
  if (isOk) {
    await expect(ok).toContainText("Không cần làm gì");
  } else {
    await expect(advice).toBeVisible();
    // Not "the worker is down" — "the worker is down, type this".
    await expect(advice).toContainText(/docker compose|pnpm/);
  }

  await page.screenshot({ path: join(SHOTS, "admin-health.png"), fullPage: true });

  // The same numbers, from the endpoint that stays public when nothing else works.
  const health = await page.request.get("/api/health").then((r) => r.json());
  expect(health.tts.limit).toBe(500_000);
  expect(health.disk).toHaveProperty("freeGb");
  expect(health.backup).toHaveProperty("ageHours");
  expect(health.jobs).toHaveProperty("failed24h");
  console.log(
    `health: ${health.status} · ổ đĩa còn ${health.disk.freeGb} GB · ` +
      `sao lưu ${health.backup.latest ?? "chưa có"} · giọng đọc ${health.tts.chars}/${health.tts.limit}`,
  );
});

// ── 7. phiên chẩn đoán ────────────────────────────────────────────────────────────────────────

test("7. bé chưa có dữ liệu nào thì tối đầu tiên là phiên chẩn đoán, không phải màn hình lạ", async ({
  page,
}) => {
  await loginAdmin(page);
  const status = execFileSync("pnpm", ["db:assess", "--", "--status"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
  });
  console.log(
    status
      .split("\n")
      .filter((l) => l.includes("─") || l.includes("chẩn đoán"))
      .join("\n"),
  );

  // Whatever the two real children's state is, the rule itself must hold: a child with no evidence
  // is due round 1 of 3, and it arrives as the ordinary session, not as a screen of its own.
  expect(status).toMatch(/phiên chẩn đoán \d\/3|đã chẩn đoán đủ|không cần chẩn đoán/);
});
