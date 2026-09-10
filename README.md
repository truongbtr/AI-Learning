# Học cùng Mai Thy & Chí Thanh

Nền tảng học tại nhà của gia đình cho hai bé lớp 1 (hệ Song ngữ, Edison Schools Ecopark). Chạy tại nhà bằng Docker, **không gọi API AI nào lúc chạy** (ADR-10) — mọi việc cần AI do Claude Code làm theo lô trong repo.

**Trạng thái:** Pha 0 xong (khung dự án, đăng nhập, quản lý người dùng). Lộ trình: `docs/08-LO-TRINH-PHA.md`; tiến độ: `docs/TIEN-DO.md`.

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
$env:E2E_ADMIN_PASSWORD="<mật khẩu admin đã đổi>"; $env:E2E_CHANNEL="chrome"; pnpm e2e   # nghiệm thu pha 0 đầy đủ
```

Lệnh khác: `pnpm db:studio` (xem bảng), `pnpm content:validate` (kiểm file `content/`), `pnpm inbox:pull|validate|push` (pha 2).

## Cấu trúc

```
apps/web        Next.js 16 (App Router): (auth) /login /change-password · (kid) /kid/* · (parent) /parent/* · (admin) /admin/* · api/*
apps/worker     pg-boss (job ping; planner/decay/intake ở pha sau)
packages/core   domain thuần: chính sách khoá tài khoản, mật khẩu, mã hình, tuần học, FileStorage
packages/db     Prisma schema (đủ mọi bảng docs/03), migrations, seed
packages/content  schema/validator cho content/ (pha 0: thời khoá biểu)
packages/inbox  hàng chờ AI (kiểu dữ liệu; CLI ở pha 2)
content/        nội dung do Claude Code soạn (timetable/1B3-2026.json ...)
docker/         Dockerfile (target web|worker), compose.yml, entrypoint
docs/           bộ tài liệu — nguồn sự thật
```

## Tài khoản & bảo mật (tóm tắt docs/12)

- Một bảng `User`, ba vai trò `ADMIN | PARENT | CHILD`; không có đăng ký công khai.
- Người lớn: tên đăng nhập + mật khẩu (Argon2id); con: chạm thẻ ảnh + chọn **4 hình theo thứ tự**.
- Sai 5 lần → khoá 10 phút; 10 lần sai/phút từ một IP → tạm chặn; mọi lần đăng nhập ghi `LoginAudit`.
- Phiên là cookie httpOnly (Secure khi chạy sau HTTPS/Cloudflare Tunnel); người lớn 30 ngày nếu "ghi nhớ máy này", con hết hạn sau 2 giờ không thao tác.

## Giọng đọc (TTS)

- Mặc định `TTS_PROVIDER=webspeech`: đọc bằng giọng cài trên máy. **Máy phải có giọng tiếng Việt**, nếu không nút Nghe sẽ im lặng (app không đọc tiếng Việt bằng giọng Anh). Cài trên Windows: *Settings → Time & Language → Speech → Manage voices → Add voices → Tiếng Việt* (giọng "Microsoft An"); trình duyệt **Edge** có sẵn giọng neural "HoaiMy"/"NamMinh" (miền Bắc) — dùng Edge cho bé là tốt nhất khi chưa có cloud.
- Giọng neural miền Bắc chất lượng cao: `TTS_PROVIDER=azure` (khoá Azure Speech + `TTS_REGION`, giọng `vi-VN-HoaiMyNeural`) hoặc `TTS_PROVIDER=google` (API key Cloud Text-to-Speech, giọng `vi-VN-Neural2-A`). Câu đã đọc được cache mp3 trong `FILE_ROOT/tts/` nên mỗi câu chỉ tốn tiền một lần; `TTS_PITCH_PERCENT` / `TTS_RATE` chỉnh cho nghe trẻ hơn.
- Giọng trẻ em thật: thu âm các câu thoại cố định vào `content/art/audio/vi/<key>.mp3` (xem README trong đó); app ưu tiên clip thu sẵn → cloud → Web Speech.

## Bản quyền & riêng tư

Sách của trường trong `sach giao khoa/` chỉ dùng nội bộ gia đình, không vào git. Dữ liệu của trẻ nằm ở máy nhà; app không gửi gì tới dịch vụ AI lúc chạy.
