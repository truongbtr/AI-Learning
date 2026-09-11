# Học cùng Mai Thy & Chí Thanh

Nền tảng học tại nhà của gia đình cho hai bé lớp 1 (hệ Song ngữ, Edison Schools Ecopark). Chạy tại nhà bằng Docker, **không gọi API AI nào lúc chạy** (ADR-10) — mọi việc cần AI do Claude Code làm theo lô trong repo.

**Trạng thái:** Pha 2 xong (xưởng nội dung, hàng chờ AI, /admin/content, ngân hàng bài đợt 1). Pha 1 (bản đồ kỹ năng 6 môn, mô hình năng lực, API mastery, `/admin/skills`, tra cứu kỹ năng). Pha 0: khung dự án, đăng nhập, quản lý người dùng. Lộ trình: `docs/08-LO-TRINH-PHA.md`; tiến độ: `docs/TIEN-DO.md`.

## Yêu cầu máy chạy (Windows + Docker Desktop)

- Windows 10/11, **Docker Desktop** (WSL 2) đang chạy.
- Để phát triển: **Node 22+**, **pnpm 9+** (`npm i -g pnpm@9`), Git.
- Mọi lệnh dưới đây chạy từ **PowerShell** tại thư mục gốc repo.

## Chạy bản thật bằng Docker (3 service: postgres, web, worker)

```powershell
Copy-Item .env.example .env
# Mở .env, điền: POSTGRES_PASSWORD, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (>= 10 ký tự)
# Tạo AUTH_SECRET:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

docker compose -f docker/compose.yml up -d --build
```

- Lần đầu build cần Internet (tải image, npm, font). Web tự chạy `prisma migrate deploy` + seed rồi mới khởi động.
- Mở <http://localhost:5000/login>, đăng nhập bằng `ADMIN_USERNAME`/`ADMIN_PASSWORD` → **bị bắt đổi mật khẩu** → vào `/admin/users` tạo tài khoản cho Mẹ và hai bé.
- Kiểm tra: `Invoke-RestMethod http://localhost:5000/api/health` → `db: ok`, `worker.ok: true`.
- Log: `docker compose -f docker/compose.yml logs -f web worker` (worker in `ping ok` mỗi phút).
- Nếu cổng 5432 trên máy đã bị dùng: đặt `POSTGRES_PORT=5433` trong `.env` và chạy với `--env-file .env`:
  `docker compose --env-file .env -f docker/compose.yml up -d --build`.
- Cập nhật: `git pull; docker compose -f docker/compose.yml up -d --build`.

## Phát triển

```powershell
pnpm install
Copy-Item .env.example .env            # sửa DATABASE_URL trỏ localhost:<POSTGRES_PORT>
docker compose --env-file .env -f docker/compose.yml up -d postgres
pnpm db:migrate                        # prisma migrate dev
pnpm db:seed                           # 1 admin + TKB + tuần học + badge (không có tài khoản mẫu)
pnpm db:seed:dev                       # (tuỳ chọn) thêm 2 hồ sơ mẫu thy/thanh — CHỈ máy dev
pnpm dev                               # web http://localhost:5000 + worker
```

Kiểm tra chất lượng (phải xanh trước khi báo cáo):

```powershell
pnpm lint; pnpm test; pnpm build
pnpm e2e                                                   # smoke Playwright, cần web đang chạy
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin đã đổi>"; $env:E2E_CHANNEL="chrome"; pnpm e2e   # nghiệm thu pha 0 + 1 + 2 (23 test)
```

Lệnh khác: `node scripts/sample-exercises.mjs pha-2-dot-1 20` (rút lại đúng 20 bài mẫu QC chấm), `pnpm db:studio` (xem bảng), `pnpm content:validate` (kiểm mọi file `content/`), `pnpm skills:validate` (chỉ bản đồ kỹ năng + khung bài học + bộ mã lỗi), `pnpm decay:run [--force]` (chạy tay job quên kiến thức hằng đêm), `pnpm content:import [--dry-run]` / `pnpm content:stats` / `pnpm content:export --skill <mã>` (ngân hàng bài), `pnpm inbox:pull|validate|push` (hàng chờ AI), `pnpm tts:voices` (liệt kê giọng Azure), `pnpm tts:smoke "câu"` (nghe thử một câu).

> **Windows:** dừng `pnpm dev` trước khi chạy `pnpm build`. Prisma phải ghi lại `query_engine-windows.dll.node`, mà tiến trình dev đang giữ file này (lỗi `EPERM: operation not permitted, rename …`).

## Cấu trúc

```
apps/web        Next.js 16 (App Router): (auth) /login /change-password · (kid) /kid/* · (parent) /parent/* · (admin) /admin/* · api/*
apps/worker     pg-boss (job ping mỗi phút, mastery.decay 02:30; planner/intake ở pha sau)
packages/core   domain thuần: khoá tài khoản, mật khẩu, mã hình, tuần học, mastery, thang rèn, FileStorage
packages/db     Prisma schema (đủ mọi bảng docs/03), migrations, seed, dịch vụ mastery + tìm kỹ năng
packages/content  schema/validator cho content/ (TKB, bản đồ kỹ năng, bài học, ngân hàng bài luyện, mã lỗi)
packages/inbox  hàng chờ AI: schema IntakeExtraction/GradeResult/DiaryParse/WeeklyReport + CLI pull/validate/push
content/        nội dung do Claude Code soạn (skill-map/, lessons/, exercises/, error-taxonomy.json, timetable/)
docker/         Dockerfile (target web|worker), compose.yml, entrypoint
docs/           bộ tài liệu — nguồn sự thật
```

## Tài khoản & bảo mật (tóm tắt docs/12)

- Một bảng `User`, ba vai trò `ADMIN | PARENT | CHILD`; không có đăng ký công khai.
- Người lớn: tên đăng nhập + mật khẩu (Argon2id); con: chạm thẻ ảnh + chọn **4 hình theo thứ tự**.
- Sai 5 lần → khoá 10 phút; 10 lần sai/phút từ một IP → tạm chặn; mọi lần đăng nhập ghi `LoginAudit`.
- Phiên là cookie httpOnly (Secure khi chạy sau HTTPS/Cloudflare Tunnel); người lớn 30 ngày nếu "ghi nhớ máy này", con hết hạn sau 2 giờ không thao tác.

## Giọng đọc (TTS)

Thứ tự phát: clip thu sẵn (`content/art/audio/`) → mp3 đã cache (`FILE_ROOT/tts/`) → TTS cloud → Web Speech trên thiết bị. App **không bao giờ** đọc tiếng Việt bằng giọng Anh: không có giọng phù hợp thì nút Nghe im lặng và chuyển xám.

- **Giọng dựng sẵn của nhà cung cấp** (ADR-11 chốt không nhân bản giọng trẻ; bổ sung 11/09/2026 chốt Azure):
  - `TTS_PROVIDER=azure` — **mặc định**, bậc F0 miễn phí ~500k ký tự/tháng, vùng `TTS_REGION=eastasia`. Chỉ cần `TTS_API_KEY`.
  - **Giọng đã nghe thử và chốt:** tiếng Việt `vi-VN-HoaiMyNeural` **giữ nguyên tốc độ và cao độ gốc** (không bọc `<prosody>`); tiếng Anh `en-US-AnaNeural` bọc `<prosody rate="-10%">`. `TTS_RATE` (mặc định `-10%`) **chỉ áp cho tiếng Anh** — các bản chậm/cao hơn của giọng Việt đã bị loại, đừng thêm lại.
  - `pnpm tts:voices` liệt kê giọng thật của tài nguyên; `pnpm tts:smoke "Nghe rồi chọn ô đúng nhé!"` sinh một file mp3 trong `_tts-thu/` để nghe ngay (thêm `--en` cho tiếng Anh).
  - Tuỳ chọn: `TTS_PROVIDER=vbee` (`TTS_API_KEY` + `TTS_APP_ID`) hoặc `google` → `vi-VN-Neural2-A` / `en-US-Neural2-F`. Chi tiết: `content/art/audio/README.md`.
- **mp3 sinh sẵn lúc nạp nội dung**: `pnpm content:import` sinh mp3 cho mọi đề bài có `tts: true` và cache vào `FILE_ROOT/tts/` theo hash văn bản + giọng — lúc con học chỉ phát file, không gọi mạng, mỗi câu chỉ tốn phí một lần. **Sinh dần**: hết hạn mức ngày thì lệnh dừng êm và báo còn bao nhiêu câu, chạy lại hôm sau là tiếp tục; `pnpm content:stats` hiện số câu đã có mp3. Không có khoá thì bỏ qua bước này, mọi lệnh vẫn chạy.
- **Không cloud** (`webspeech`): máy phải có giọng tiếng Việt — Windows: *Settings → Time & Language → Speech → Add voices → Tiếng Việt*; trình duyệt **Edge** có sẵn giọng neural HoaiMy/NamMinh.

## Bản quyền & riêng tư

Sách của trường trong `sach giao khoa/` chỉ dùng nội bộ gia đình, không vào git. Dữ liệu của trẻ nằm ở máy nhà; app không gửi gì tới dịch vụ AI lúc chạy.
