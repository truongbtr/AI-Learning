# TIẾN ĐỘ DỰ ÁN

> Developer ghi sau mỗi pha: ngày, việc đã làm, cách chạy thử, tồn đọng, câu hỏi cho chủ dự án. Mới nhất ở trên.

## Pha 0 — 10/09/2026 — Khung dự án + đăng nhập & quản lý người dùng

Trạng thái: **xong** (8/8 tiêu chí đạt trên máy dev; mục 1 kiểm bằng compose với volume DB mới, xem bảng). Code chạy ở 9 commit Conventional Commits, chưa push.

### Đã làm theo 5 việc

1. **Monorepo** — pnpm 9 + Turborepo 2, TypeScript strict (`packages/config`), Biome 2.5 (lint + format), Vitest 5, Playwright 1.63; cấu trúc đúng `02` §3 (`apps/{web,worker}`, `packages/{core,inbox,content,db,config}`, `content/`, `docker/`, `scripts/`). `packages/core` thuần (không Next/Prisma): chính sách khoá tài khoản, giới hạn IP, mật khẩu, bộ mã hình 4 ảnh, quyền truy cập theo vai trò/studentId, 35 tuần học, adapter `FileStorage` (`@mtct/core/storage`). *Kiểm tra:* `pnpm lint` xanh; `pnpm test` = 31 test đơn vị xanh (core 22, content 3, web 3, còn lại rỗng).
2. **`packages/db`** — Prisma 6.19, schema **58 bảng** đủ theo `03` (User/LoginAudit/TrustedDevice/Student/StudentGuardian, Skill…, InboxItem, PlanHint, ClassDiary/Homework, Pet/KidMail/Certificate, AiConfig/PromptTemplate/Setting/AuditLog…), migration `20260910145237_init`, seed idempotent. *Kiểm tra:* `pnpm db:migrate` rồi `pnpm db:seed` in `{"users":1,"skills":0,"timetableSlots":30,"schoolWeeks":35,"badges":8}`; truy vấn `information_schema.tables` = 58 bảng; `pnpm db:studio` xem được.
3. **`apps/web`** — Next 16.3 + Auth.js v5 (JWT, cookie httpOnly): provider `adult` (username + Argon2id) và `kid-login` (thẻ ảnh + 4 hình theo thứ tự, Argon2id); sai 5 lần khoá 10 phút; 10 lần sai/phút/IP tạm chặn; `LoginAudit` mọi lần; sai tên và sai mật khẩu cùng một thông báo; ép đổi mật khẩu lần đầu (proxy chặn mọi trang + API); phiên người lớn 30 ngày khi "ghi nhớ" / 12 giờ không thao tác, con 2 giờ; tiêu đề bảo mật (HSTS, nosniff, X-Frame-Options DENY, CSP cơ bản); `proxy.ts` phân quyền theo route group **và** lặp lại trong từng layout/handler (`guardPage`, `requireRole`, `requireStudentAccess` — kiểm `StudentGuardian` trong DB, không tin `studentId` client). Trang `/login` gộp, `/change-password`, `/kid/home` (hiện tên gọi ở nhà, mascot, nút đọc to), `/parent` + `/parent/[studentId]` (khung), `/api/health`, `/api/students/:id`, `/api/students/:id/mastery` (trả rỗng, chỉ để chứng minh 403). *Kiểm tra:* Playwright 10/10 xanh (xem mục e2e); `curl /api/students/x/mastery` không cookie → 401.
4. **`apps/worker` + Docker** — pg-boss 12, job `ping` mỗi phút ghi `Setting[worker.lastPing]`, log `"ping ok"`; `docker/compose.yml` chỉ 3 service (postgres:16, web, worker); `docker/Dockerfile` multi-stage với hai target `web`/`worker` (thay cho hai file Dockerfile.web/.worker — cùng nội dung base); web khởi động = `prisma migrate deploy` → seed → `next start`; `.env.example` đủ biến `02` §7 (không có khoá LLM); README chạy từ PowerShell. *Kiểm tra:* worker log `ping ok`; `GET /api/health` → `{"status":"ok","db":"ok","worker":{"lastPing":"…","ageSeconds":22,"ok":true}}`.
5. **`/admin/users`** — bảng + 5 thao tác FR-ADM-06: tạo (CHILD tạo luôn `Student` + mã hình; PARENT/ADMIN email + mật khẩu tạm, bắt đổi lần đầu), gắn phụ huynh ↔ con, đặt lại mật khẩu/mã hình (xoá bộ đếm sai), bật/tắt (không tự tắt chính mình), 50 lần đăng nhập gần nhất. API JSON `/api/admin/users*` kiểm vai trò ADMIN + Zod. *Kiểm tra:* e2e mục 2 tạo 1 phụ huynh + 2 bé (1 bé qua hộp thoại thật, còn lại qua API) và gắn quan hệ trong < 10 giây.

### Bảng 8 tiêu chí xong

| # | Tiêu chí | Kết quả | Tự kiểm tra |
|---|---|---|---|
| 1 | `docker compose -f docker/compose.yml up -d --build` → `/login` → admin bị ép đổi mật khẩu, trang khác về `/change-password` | **Đạt** — build image, chạy stack thứ hai với volume DB mới (`-p mtct-clean`, cổng 3001/5434): log web `migrate deploy → seed: admin created (mustChangePassword=true) → next start`, rồi chạy cả 10 test e2e lên stack đó (10/10 xanh, ảnh chụp lấy từ stack sạch này) | `docker compose -f docker/compose.yml up -d --build` (máy này phải thêm `--env-file .env` vì cổng 5432 bận) → mở <http://localhost:5000/login>, đăng nhập `ADMIN_USERNAME`/`ADMIN_PASSWORD` → tự chuyển `/change-password`; gõ `/admin/users` hay `Invoke-RestMethod /api/admin/users` (403) đều không vào được |
| 2 | Admin tạo 1 phụ huynh + 2 bé (hồ sơ Student + mã 4 hình), gắn quan hệ < 3 phút | **Đạt** | `/admin/users` → "+ Tạo tài khoản" (chọn Con: điền tên gọi, chọn 4 hình) ×2, tạo Phụ huynh (tick con); e2e mục 2 đo thời gian |
| 3 | Đăng xuất, con chạm thẻ ảnh + mã 4 hình → `/kid/home` hiện tên gọi ở nhà | **Đạt** | `/login` → chạm thẻ → chọn 4 hình → "Chào Thy!" (ảnh `docs/screens/pha-0/kid-home.png`); e2e mục 3 |
| 4 | Sai 5 lần → khoá 10 phút, `LoginAudit` đủ 5 dòng; sai tên và sai mật khẩu cùng thông báo | **Đạt** | e2e mục 4 (5 × WRONG_PASSWORD + LOCKED, thông báo "Mình nghỉ 10 phút…"); `login.spec` so hai thông báo bằng nhau; admin xem "Nhật ký" của tài khoản |
| 5 | CHILD gọi mastery của bé kia → 403; phụ huynh chưa gắn → 403; chưa đăng nhập vào `/parent` → `/login` | **Đạt** | e2e mục 5; hoặc đăng nhập con rồi `fetch('/api/students/<id bé kia>/mastery')` trong console → 403 |
| 6 | `GET /api/health` → `db:"ok"`, `worker.lastPing ≤ 6 phút`; worker log `ping ok` | **Đạt** | `Invoke-RestMethod http://localhost:5000/api/health`; `docker compose -f docker/compose.yml logs worker` |
| 7 | Prisma studio đủ bảng; TimetableSlot 30; SchoolWeek 35; Skill rỗng; User chỉ 1 admin | **Đạt** — 58 bảng, 30/35/0/1 (trên DB mới; DB dev có thêm tài khoản e2e) | `pnpm db:studio` hoặc `node scripts/db-query.cjs 'select count(*) from "TimetableSlot"'` |
| 8 | `pnpm lint && pnpm test && pnpm build` xanh; Playwright smoke xanh | **Đạt** (lint 0 lỗi; 31 test đơn vị; build 3 gói; e2e 10/10 trên cả dev server lẫn compose) | `pnpm lint; pnpm test; pnpm build` rồi `pnpm dev` + `pnpm e2e` (smoke 4 test); nghiệm thu đầy đủ: `$env:E2E_ADMIN_PASSWORD="<mật khẩu admin>"; $env:E2E_CHANNEL="chrome"; pnpm e2e` (10 test) |

Ảnh chụp: `docs/screens/pha-0/login.png`, `admin-users.png`, `kid-home.png` (Playwright chụp trong e2e).

### Lệch tài liệu đã xử lý (không cần ADR mới, theo tài liệu mới hơn)

- `08` việc 2 ghi "pgvector bật", `03` có `SkillEmbedding`/`LessonUnit.embedding vector(1024)` → theo ADR-10 và `13` §1 "bỏ pgvector": **không** tạo extension, bỏ bảng `SkillEmbedding` và cột `embedding`. Tra cứu kỹ năng ở pha 1 dùng full-text như `08` pha 1 việc 5.
- `12` §2 đặt tên kết quả `LoginAudit` tiếng Việt, `03` tiếng Anh → dùng `OK|WRONG_PASSWORD|LOCKED|NO_SUCH_USER|DISABLED`.
- `Student` nối 1–1 với `User` CHILD nên hồ sơ mẫu dev (`thy`, `thanh`) phải kèm 2 user CHILD mẫu → chỉ tạo khi `pnpm db:seed:dev` (chặn khi `NODE_ENV=production`); seed thường chỉ 1 admin.
- `02` §7 phác thảo `Dockerfile.web` + `Dockerfile.worker` → dùng một `docker/Dockerfile` với hai target; `cloudflared`/`backup` để pha 8 đúng lưu ý pha 0.
- Cookie `Secure`: Auth.js tự bật khi `AUTH_URL` là https (sau Cloudflare Tunnel); trên `http://localhost` không thể bật vì trình duyệt sẽ từ chối cookie.
- Giới hạn IP chỉ đếm lần **thất bại** (10/phút) để một máy của gia đình đăng nhập/đăng xuất nhiều lần không bị chặn oan.

### Chưa làm + lý do

- Ảnh đại diện/mascot là emoji tạm (`lib/avatars.ts`); tài sản thật thuộc pha 3 (`06` §1.9). `/kid/home` mới là màn chào tên + nút đọc to, chưa phải thế giới có Lottie (pha 3).
- "Báo ba mẹ" khi con bị khoá: mới ghi `AuditLog(KID_LOGIN_LOCKED)`; thẻ thông báo trên dashboard thuộc pha 5.
- Thiết bị tin cậy, 2FA, cảnh báo IP lạ: P1 pha 8 (đã có bảng `TrustedDevice`).
- `content:import/stats`, `inbox:pull/validate/push`: stub báo "pha 2".
- Image Docker chưa tối ưu dung lượng (**~2,6 GB/image**: copy cả monorepo + `pnpm install --prod`; `pnpm prune --prod` không dùng được trong workspace vì xoá sạch node_modules từng gói) — đủ cho máy nhà; có thể chuyển `output: standalone` ở pha 8.

### Sự cố môi trường trên máy dev (đã xử lý, cần chủ dự án biết)

- Ổ **C: chỉ còn ~1,4 GB** (thư mục `%TEMP%\odis_download_dest` ~50 GB, ngày 10/09) → Turbopack từng lỗi "no space" khi ghi log; Docker data đã ở E: nên build/chạy compose không ảnh hưởng. Nên dọn C: trước pha sau.
- Cổng **5432** đã bị container khác dùng → `.env` máy này đặt `POSTGRES_PORT=5433` và phải chạy compose với `--env-file .env` (compose chỉ đọc `docker/.env` mặc định). Đã ghi vào README.
- Docker Desktop treo một lần, phải khởi động lại.

### Cần điền trong `.env` trước khi chạy (từ `.env.example`)

`POSTGRES_PASSWORD`, `DATABASE_URL` (khớp cổng), `AUTH_SECRET` (32 byte base64), `AUTH_URL` (https://<domain> khi qua tunnel), `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (≥ 10 ký tự, sẽ bị bắt đổi ngay), `SCHOOL_YEAR_START` (mặc định 2026-09-08), `POSTGRES_PORT` (nếu 5432 bận). Không có `ANTHROPIC_API_KEY`.

### Câu hỏi cho chủ dự án

1. Khi con nhập sai 5 lần, ngoài ghi log, có muốn gửi thông báo tức thì (email/Telegram) ngay từ bây giờ không, hay để pha 5 hiện thẻ trên dashboard là đủ?
2. Ngày bắt đầu năm học thật (nhật ký lớp cho thấy sớm hơn 08/09) — cần giá trị để đặt `SCHOOL_YEAR_START` và chỉnh `SchoolWeek` trong admin ở pha 5.

## 10/09/2026 — Chốt mô hình vận hành hai chế độ

- Chủ dự án chốt: **không API**. Mỗi ngày có dữ liệu mới thì đưa cho Claude Code xử lý và quyết định bài học; không có dữ liệu mới thì backend tự quyết. Ghi thành `13` §3: chế độ A (Claude Code nạp dữ liệu + để lại `PlanHint`) và chế độ B (planner backend tự chạy); planner luôn chạy, tôn trọng `PlanHint` còn hiệu lực. Thêm `PlanHint` vào `03`, `04` §4 bước 3; `13` §6 cánh cửa mở worker tự động v2 với bảng rào chi phí.

## 10/09/2026 — ADR-10: app không gọi API LLM

- Chủ dự án nhắc: không dùng API Anthropic. Chốt ADR-10: mọi việc cần AI (đọc ảnh vở, chấm bài viết/nói, báo cáo tuần) đi qua **hàng chờ** (`packages/inbox`, `InboxItem`) và do Claude Code xử lý theo lô vài lần/tuần; nhật ký lớp đọc bằng **bộ đọc theo mẫu** không AI; gia sư giọng nói lùi P2; trợ lý = hỏi Claude Code trong repo; bỏ pgvector/embedding; bỏ `packages/ai`, bỏ `ANTHROPIC_API_KEY`.
- Viết `docs/13-HANG-CHO-AI.md`; sửa `00`, `01`, `02` (stack, ADR-10, env, compose), `04` §1, `07`, `08` (pha 0/1/2/4/7), `10`, `11`, `CLAUDE.md`.

## 10/09/2026 — Thêm 14 cơ chế thu hút (`06` §1.8c)

- Chủ dự án thích hướng "có gì mới + được tự quyết", yêu cầu thêm ý tưởng. Thêm 14 cơ chế theo 4 động lực (mong chờ, sở hữu, được là người lớn, được nhìn thấy); 7 mục P0 vào pha 3: trứng nở, mascot có ký ức, mảnh tranh cuối tuần, hộp thư ba mẹ, thế giới theo giờ thật, sao vàng lớn, giấy chứng nhận. Bảng mới ở `03`; FR-PAR-08 ở `01`; checklist `06` §4 mục 12; pha 3 ước lượng 6–7.

## 10/09/2026 — Rà soát "thông minh" & "sinh động", bổ sung 5 điểm

- **Bộ mã lỗi chuẩn** `content/error-taxonomy.json` (~40 mã theo môn, `04` §11.1) — trước đây `errorType`/`targetsError` là chữ tự do nên không khớp được bằng chứng ↔ bài rèn.
- **Đáp án nhiễu có chẩn đoán** (`choices[].errorTag`) và `scaffold: model` (mascot làm mẫu) trong `ExerciseSpec`; rubric soạn bài thêm mục 11.
- **Thang rèn 6 bậc** khi con yếu (`04` §11.4): đổi kênh → hạ độ khó → bài mẫu → tiên quyết → đối chiếu cặp dễ nhầm → kiểm tra lại / nhờ ba mẹ; giới hạn ≤ 4 bài rèn/phiên. Bảng `ErrorStat`, `RemediationTrack` (`03`).
- **STT tiếng Việt lên P0** + chế độ "cùng ba mẹ" chấm tay; TTS neural sinh sẵn lúc nạp nội dung (NFR-04).
- **Giữ mới & quyền chọn** (`06` §1.8b): sự kiện tuần, trạm chọn 1-trong-2, nghỉ vận động, dừng khi mệt, giọng mascot thu sẵn, cây chung của nhà (P1), mở khoá khu mới; checklist §4 thêm mục 10–11.
- Dọn: bỏ `kidPinHash` thừa ở `Student`; nhật ký lớp sinh `Homework` riêng cho từng bé (`11` §4).

## 10/09/2026 — Người dùng, vai trò & đăng nhập

- Chủ dự án yêu cầu: web mở ra internet nên cần đăng nhập + quản lý người dùng, cấu trúc đơn giản, có vai trò phân biệt con và bố mẹ, một tài khoản admin tạo sẵn.
- Viết `docs/12-NGUOI-DUNG-DANG-NHAP.md`: một bảng `User` với 3 vai trò `ADMIN|PARENT|CHILD`, `Student` nối 1–1 với user `CHILD`, `LoginAudit`, `TrustedDevice` (P1); trang `/login` gộp thẻ ảnh của con và form người lớn; `/admin/users` 5 thao tác; phần bảo vệ khi mở internet.
- Cập nhật `00`, `01` (FR-CORE-01 viết lại, thêm FR-ADM-06, NFR-05), `02` (phân quyền, API users, `.env`), `03` (User/Student/LoginAudit/TrustedDevice, seed chỉ 1 admin), `08` (pha 0 đổi tên và thêm việc 5), `CLAUDE.md`.

## 10/09/2026 — Nhận đủ SGK Toán & Tiếng Việt (cả 4 tập)

- Chủ dự án nạp SGK **học sinh**: Tiếng Việt 1 tập một & hai, Toán 1 tập một & hai (bộ Kết nối tri thức, PDF quét). Hai file SGV nạp hôm trước **không còn trong thư mục** — cần chép lại nếu còn giữ.
- Rút được **mục lục đầy đủ Tiếng Việt 1 tập một: 83 bài học vần** kèm số trang → thay hẳn danh sách kỹ năng `VIET.HV.*` đoán trước đây; ghi vào `09` §3 cùng quy tắc sinh kỹ năng và danh sách cặp âm dễ nhầm.
- Kiểm chứng: bài 13 "U u – Ư ư" trang 38–39 khớp nhật ký lớp; cấu trúc mỗi bài gồm 5 mục (Nhận biết / Đọc / Viết / Đọc / Nói) → "mục 2 và mục 4" cô giao ánh xạ thành hai nhiệm vụ `READ_ALOUD`.
- Quy đổi trang PDF = trang sách + 1. Bổ sung số trang SGK cho 20 bài Toán tập một (khác số trang SGV).
- Xác nhận sách tiếng Anh: bìa sau ghi **"Tiếng Anh 1 – Global Success – Sách học sinh"** → `GS1` trên phiếu chính là sách này.

## 10/09/2026 — Nhật ký lớp Edi Parent + phiếu bài tập

- Phát hiện nguồn dữ liệu quan trọng: GVCN đăng nhật ký hằng ngày trên **Edi Parent** (hôm nay học bài gì từng môn + bài cô giao). Viết `docs/11-NHAT-KY-LOP.md`; thêm `ClassDiary`/`DiaryLesson`/`Homework`/`ClassReminder` vào `03`, FR-INT-06 + FR-LRN-07 vào `01`, đổi planner ở `04` §4 (ưu tiên bài học 3 ngày gần nhất), thêm kênh D vào `07`, pha 4 thêm việc 5.
- Đọc thử phiếu ESL thật của Mai Thy → rút ra quy tắc **`BLANK` ≠ sai** (`07` §2.2) và 5 dạng bài của phiếu trường để ngân hàng bài bắt chước (`11` §9).
- Manh mối sách ESL: phiếu ghi `GS1` — có thể là Global Success 1; cần xác nhận với cô.
- Lưu ý: chuỗi bài (TV bài 13 vào 10/09) cho thấy **năm học bắt đầu sớm hơn giả định 08/09/2026** — cần chỉnh `SchoolWeek` khi có đủ nhật ký.

## 10/09/2026 — Chốt ADR-9: nội dung soạn ngoại tuyến

- Chủ dự án chốt: bài học và ngân hàng bài luyện do **Claude Code soạn trong repo rồi nạp DB**, app chỉ đọc; ảnh bài vở hằng tuần vẫn nạp qua app, Claude Code chỉ dùng cho lô lớn.
- Viết `docs/10-NAP-NOI-DUNG.md`; sửa `00`, `01`, `02` (ADR-9, `packages/content`), `03` (Exercise + ContentBatch), `04` (tách AI ngoại tuyến / lúc chạy, chi phí giảm còn ≤ 1 USD/tháng), `07`, `08` (pha 2 và 6 đổi thành pha nội dung), `CLAUDE.md`.

## 10/09/2026 — Nạp sách giáo khoa

- Chủ dự án nạp `sach giao khoa/01-sgv-toan-1.pdf` và `01-sgvtieng-viet-1-tap-hai.pdf` (SGV, bộ Kết nối tri thức, PDF quét). Viết `docs/09-GIAO-TRINH-TRUONG.md`; cập nhật `05`, `07`, `08`.
- Còn thiếu: Tiếng Việt 1 tập một, SGK học sinh, sách tiếng Anh (ESL/English Maths/English Science) — chủ dự án tìm sau.

## 09/09/2026 — Thiết kế xong

- Hoàn thành bộ tài liệu `docs/00`–`08`. Chưa có code.
- Việc kế tiếp: **Pha 0 — Khung dự án** (`docs/08-LO-TRINH-PHA.md`).
- Chủ dự án cần chuẩn bị trước pha 0: khoá API Anthropic, Docker Desktop, chọn máy/NAS chạy hệ thống.
