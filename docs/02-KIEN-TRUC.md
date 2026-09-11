# 02 — KIẾN TRÚC HỆ THỐNG

> Quyết định đã chốt với chủ dự án (09/09/2026): **stack gọn nhẹ Next.js full-stack + PostgreSQL**, **chạy tại máy/NAS ở nhà bằng Docker**. Không dùng microservice, không message broker riêng.

---

## 1. Stack

| Tầng | Lựa chọn | Lý do |
|---|---|---|
| Ngôn ngữ | **TypeScript** (strict) toàn bộ | Một ngôn ngữ cho UI, API, worker, prompt schema |
| Framework | **Next.js 15+ (App Router)**, React 19, Server Actions + Route Handlers | Full-stack một codebase, SSR cho trang phụ huynh, client component cho bài tương tác |
| UI | **Tailwind CSS 4** + **shadcn/ui** (trang phụ huynh/admin) + bộ component riêng `@/components/kid/*` (trang con) + **dnd-kit** (kéo thả) | shadcn cho dashboard nhanh; giao diện trẻ em cần bộ riêng, không dùng thư viện UI người lớn |
| Đồ hoạ & hoạt hình (trang con) | **Framer Motion** (UI, chuyển cảnh, spring) · **Lottie / dotLottie** (`@lottiefiles/dotlottie-react`: mascot, nhân vật, ăn mừng) · **CSS keyframes** (nền lặp, parallax) · **canvas-confetti** · tài sản trong `content/art/` (WebP/SVG/.lottie + manifest) · Rive để dành P1 | Yêu cầu bắt buộc: giao diện con hấp dẫn như trò chơi, xem `06` §1.5–1.9 |
| ORM / DB | **Prisma** + **PostgreSQL 16** | Schema rõ ràng, migration; không cần pgvector vì không gắn kỹ năng bằng embedding lúc chạy (ADR-10) |
| Hàng đợi / job nền | **pg-boss** (queue trên PostgreSQL) chạy trong process `worker` riêng | Không cần Redis/RabbitMQ; job intake, sinh phiên, báo cáo tuần, decay |
| File | Volume Docker `/data/files` (ảnh, PDF, audio cache); **MinIO tuỳ chọn** khi muốn S3 API | Đơn giản trước; adapter `FileStorage` để đổi sau |
| Xác thực | **Auth.js (NextAuth v5)** — Credentials cho người lớn (username + mật khẩu Argon2id), provider tuỳ chỉnh `kid-login` (avatar + mã 4 hình); khoá tài khoản, rate-limit theo IP, `LoginAudit` | Đủ dùng gia đình, sẵn đường mở Google/2FA sau |
| AI | **Không gọi API LLM nào lúc chạy** (ADR-10). Mọi việc cần AI đi qua **hàng chờ** (`packages/inbox`) và được **Claude Code** xử lý theo lô trong repo — xem `13-HANG-CHO-AI.md` | Chi phí ≈ 0, dữ liệu con không ra ngoài lúc chạy, Ba duyệt mọi kết quả AI |
| TTS | **Cloud TTS neural** cho cả tiếng Việt và tiếng Anh (Google `vi-VN-Neural2`/Azure `vi-VN-HoaiMy` + giọng en bản ngữ — chọn qua adapter), **sinh sẵn lúc `content:import`** và cache mp3 nên chi phí một lần; câu thoại mascot **thu âm sẵn**; Web Speech API chỉ là dự phòng khi thiếu cache | Giọng vi-VN trên thiết bị nghe máy móc, trẻ 6 tuổi không chịu; NFR-04 |
| STT | **Tiếng Việt và tiếng Anh đều P0** (đọc thành tiếng là kỹ năng số một của lớp 1): Web Speech `vi-VN`/`en-US` trên Chrome/Android; iPad Safari kém → ghi âm gửi **Whisper API / Deepgram** qua adapter; luôn có chế độ "cùng ba mẹ" chấm tay từng tiếng khi máy không chắc | Adapter `SpeechProvider`; NFR-04 |
| Validation | **Zod** — mọi input API & mọi output AI đều qua schema Zod | Output AI không tin tưởng mù |
| Test | Vitest (unit), Playwright (e2e), MSW (mock AI) | |
| Lint/format | Biome hoặc ESLint + Prettier | |
| Container | Docker + docker compose; image multi-stage | |
| Truy cập ngoài | **Cloudflare Tunnel** (cloudflared) + Cloudflare Access (email OTP) cho trang phụ huynh khi ra ngoài nhà | Không mở port |
| Giám sát | Log JSON (pino) → file; trang `/admin/logs`; `/api/health`; (P2) Grafana Loki | |

## 2. Kiến trúc logic

```
┌─────────────────────────── Docker Compose (máy nhà / NAS) ───────────────────────────┐
│                                                                                       │
│  ┌────────────┐   ┌──────────────────────────┐   ┌───────────────┐   ┌─────────────┐  │
│  │ cloudflared│──▶│  web (Next.js)           │──▶│ postgres 16   │◀──│ worker      │  │
│  │ (tunnel)   │   │  - App Router pages      │   │ + pgvector    │   │ (pg-boss)   │  │
│  └────────────┘   │  - Route Handlers /api/* │   │ + pg-boss     │   │ - intake    │  │
│                   │  - Server Actions        │   └───────────────┘   │ - planner   │  │
│   LAN / tablet ──▶│  - Auth.js               │                       │ - grader    │  │
│                   │  - Realtime (SSE)        │   ┌───────────────┐   │ - reports   │  │
│                   └──────────┬───────────────┘   │ /data/files   │◀──│ - decay     │  │
│                              │                   │ (volume/MinIO)│   │ - audio     │  │
│                              ▼                   └───────────────┘   └──────┬──────┘  │
│                   ┌──────────────────────────┐                               │         │
│                   │ packages/core (domain)   │◀──────────────────────────────┘         │
│                   │ - skill map, mastery     │                                         │
│                   │ - planner, scheduler     │          ┌────────────────────────┐     │
│                   │ - exercise spec & grader │─────────▶│ packages/ai            │────▶ Claude API
│                   │ - intake pipeline        │          │ - provider adapters    │────▶ TTS/STT API
│                   └──────────────────────────┘          │ - prompts (versioned)  │
│                                                         │ - zod output schemas   │
│                                                         │ - cache + budget       │
│                                                         └────────────────────────┘
└───────────────────────────────────────────────────────────────────────────────────────┘
```

**Nguyên tắc tách lớp:**
- `packages/core` là **domain thuần** (không import Next, không import Prisma trực tiếp — nhận repository interface). Thuật toán mastery, lập phiên, chấm là hàm thuần, test đơn vị được.
- `packages/inbox` (thay cho `packages/ai` cũ): **hàng chờ AI** — schema Zod cho từng loại kết quả (`IntakeExtraction`, `GradeResult`, `WeeklyReport`…), `inbox:pull` (xuất việc ra thư mục cho Claude Code), `inbox:validate`, `inbox:push` (nạp kết quả về trạng thái chờ duyệt). **App không có SDK LLM nào** (ADR-10, `13-HANG-CHO-AI.md`).
- `packages/content` là **xưởng nội dung**: schema và validator cho file trong `content/lessons`, `content/exercises`, trình nạp vào DB, `content:stats`. Chạy bằng CLI, không phải một phần của app lúc chạy. Nội dung do **Claude Code soạn ngoại tuyến** (`10-NAP-NOI-DUNG.md`), app chỉ đọc.
- `apps/web` là Next.js: UI + API mỏng, gọi vào core/ai.
- `apps/worker` chạy pg-boss, cùng import core/ai.

## 3. Cấu trúc thư mục (monorepo pnpm + Turborepo)

```
EDISON_LEARNING/
├─ apps/
│  ├─ web/                    # Next.js
│  │  ├─ app/
│  │  │  ├─ (kid)/            # route group giao diện con: /kid/home, /kid/quest, /kid/play/[subject], /kid/ask
│  │  │  ├─ (parent)/         # /parent/..., /parent/[studentId]/...
│  │  │  ├─ (admin)/          # /admin/...
│  │  │  ├─ (auth)/           # /login (gộp: thẻ ảnh của con + form người lớn), /change-password
│  │  │  └─ api/              # route handlers: /api/intake, /api/session, /api/ai/*, /api/health
│  │  ├─ components/
│  │  │  ├─ kid/              # design system trẻ em: BigButton, Mascot, StarBurst, exercise/*
│  │  │  ├─ parent/
│  │  │  └─ ui/               # shadcn
│  │  ├─ lib/                 # auth, db client, i18n, audio
│  │  └─ messages/            # vi.json, en.json
│  └─ worker/                 # pg-boss jobs
├─ packages/
│  ├─ core/                   # domain: skills, mastery, planner, exercise, intake, reports
│  ├─ inbox/                  # hàng chờ AI: schemas, pull/validate/push (Claude Code xử lý theo lô)
│  ├─ content/                # schema + validator + importer + stats cho content/ (CLI)
│  ├─ db/                     # prisma schema, migrations, seed (skill map, TKB)
│  └─ config/                 # tsconfig, eslint, tailwind preset
├─ content/                   # NỘI DUNG do Claude Code soạn — vào git, xem 10-NAP-NOI-DUNG.md
│  ├─ skill-map/              # *.json bản đồ kỹ năng theo môn (nguồn seed)
│  ├─ lessons/                # bài học rút từ sách, theo môn
│  ├─ exercises/              # ngân hàng bài luyện, một file / một kỹ năng
│  ├─ art/                    # STYLE.md, objects/, manifest.json
│  ├─ timetable/1B3-2026.json
│  ├─ _reports/               # báo cáo kiểm định mỗi lô nội dung
│  └─ prompts/                # *.md prompt template (đọc vào packages/ai lúc build)
├─ "sach giao khoa"/          # PDF sách của trường — KHÔNG vào git
├─ docs/                      # bộ tài liệu này
├─ docker/                    # Dockerfile.web, Dockerfile.worker, compose.yml, cloudflared/
├─ scripts/                   # backup.sh, restore.sh, export-student.ts
├─ CLAUDE.md
└─ README.md
```

## 4. Luồng chính

### 4.1 Nạp ảnh bài vở
1. Phụ huynh tải ảnh → `POST /api/intake` (multipart) → lưu file, tạo `IntakeJob(status=queued)` → enqueue `intake.process`.
2. Worker: tiền xử lý ảnh (xoay, nén ≤ 1.5 MB, tăng tương phản) → gọi `ai.intake.extract` (Vision, output JSON theo schema `IntakeExtraction`) → gọi `ai.intake.mapSkills` (gắn kỹ năng, dùng embedding pgvector + few-shot từ các lần phụ huynh sửa) → lưu `IntakeResult(status=pending_review)` → SSE thông báo.
3. Phụ huynh duyệt → `core.evidence.commit()` → tạo `Evidence[]` → `core.mastery.update()` → ghi `MasteryHistory`.

### 4.2 Daily Quest
1. Job `planner.daily` 04:00 mỗi ngày (và on-demand khi con mở mà chưa có): `core.planner.buildSession(student, date)` chọn kỹ năng theo quy tắc §`04-AI-DANH-GIA.md` §4 → danh sách "slot" (kỹ năng, dạng bài, độ khó).
2. Với mỗi slot: truy vấn `Exercise` đã phát hành, hợp kỹ năng/độ khó/chủ đề, chưa dùng gần đây (`04` §4 bước 5). **Không gọi AI** — bài đã có sẵn trong DB do `content:import` nạp từ `content/exercises/`. Audio TTS lấy từ cache đã sinh lúc nạp, thiếu thì Web Speech đọc trực tiếp trên máy.
3. Con làm bài → mỗi `Attempt` `POST /api/session/{id}/attempt` → chấm: dạng đóng chấm cục bộ; đọc to/nói/viết → enqueue `grader.ai` → cập nhật bằng chứng khi có kết quả.
4. Kết thúc → `core.session.finish()` → thưởng, huy hiệu, cập nhật mastery, gợi ý ngày mai.

### 4.3 Báo cáo tuần
Job `report.weekly` CN 18:00 → gom số liệu (mastery delta, bằng chứng, phiên, streak, intake) → `ai.report.weekly` → lưu `Report` → thông báo.

## 5. API (tóm tắt — chi tiết dev tự chuẩn hoá theo OpenAPI trong pha 2)

| Nhóm | Endpoint chính |
|---|---|
| Auth | `POST /api/auth/*` (Auth.js), `POST /api/kid-login`, `POST /api/auth/change-password` |
| Users | `GET/POST /api/admin/users`, `PATCH /api/admin/users/:id` (vai trò, bật/tắt, gắn con), `POST /api/admin/users/:id/reset-credential`, `GET /api/admin/users/:id/logins` |
| Student | `GET/PUT /api/students/:id`, `GET /api/students/:id/mastery`, `GET .../mastery/:skillId/history` |
| Intake | `POST /api/intake`, `GET /api/intake/:id`, `POST /api/intake/:id/review`, `POST /api/materials` (PDF), `GET /api/materials/:id/units` |
| Session | `POST /api/session/daily`, `GET /api/session/:id`, `POST /api/session/:id/attempt`, `POST /api/session/:id/finish` |
| Plan | `GET/POST /api/plans`, `POST /api/plans/:id/approve` |
| Reports | `GET /api/reports?studentId=`, `POST /api/reports/generate` |
| Assistant | `POST /api/assistant/parent` (stream), `POST /api/assistant/kid` (stream, filtered) |
| Admin | `GET/PUT /api/admin/ai-config`, `GET /api/admin/usage`, `GET /api/admin/prompts`, `POST /api/admin/backup` |
| Realtime | `GET /api/events` (SSE: intake xong, chấm xong, huy hiệu mới) |

## 6. Bảo mật & riêng tư

- Ba vai trò trên một bảng `User`: `ADMIN | PARENT | CHILD` (`12-NGUOI-DUNG-DANG-NHAP.md`). Route `(kid)` chỉ chấp nhận `CHILD` và chỉ trả dữ liệu của chính bé đó; `(parent)` yêu cầu `PARENT`/`ADMIN` **và** bé đó phải được gắn qua `StudentGuardian`; `(admin)` yêu cầu `ADMIN`. Kiểm ở middleware **và** lặp lại trong từng route handler — không tin `studentId` client gửi lên.
- Khoá API AI chỉ ở server (env); client không bao giờ gọi provider trực tiếp. Riêng Web Speech API chạy trên thiết bị.
- File: URL ký (HMAC, hết hạn 15 phút); ảnh gốc không public.
- Gửi tới AI: ảnh sau khi nén, không kèm tên đầy đủ/ngày sinh (dùng "bé A"); prompt ghi rõ nội dung là bài học của trẻ 6 tuổi.
- Gia sư cho con: system prompt khoá chủ đề + bộ lọc đầu ra (từ khoá + phân loại nhanh bằng Haiku) + phụ huynh xem lại.
- Cloudflare Access bảo vệ `/parent`, `/admin` khi truy cập ngoài LAN; `/kid` chỉ dùng trong LAN (hoặc cũng qua Access với cookie thiết bị).
- Xoá dữ liệu 1 bé: script xoá toàn bộ bản ghi + file, có xác nhận 2 bước.

## 7. Triển khai

```yaml
# docker/compose.yml (phác thảo)
services:
  postgres:  image: postgres:16 ; volumes: pgdata:/var/lib/postgresql/data
  web:       build: Dockerfile.web ; ports: "3000:3000" ; env_file: .env ; volumes: files:/data/files
  worker:    build: Dockerfile.worker ; env_file: .env ; volumes: files:/data/files
  cloudflared: image: cloudflare/cloudflared ; command: tunnel run ; env: TUNNEL_TOKEN
  backup:    image: postgres:16 ; cron pg_dump hằng đêm + rsync /data/files → /backup (NAS)
```

- `.env.example` liệt kê: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `TTS_PROVIDER` (mặc định `webspeech`), `TTS_API_KEY?`, `FILE_ROOT`, `INBOX_ROOT`, `INTERNAL_API_TOKEN?` (worker gọi `POST /api/evidence`; để trống thì chỉ ADMIN ghi được — ADR-13), `TUNNEL_TOKEN`. **Không có khoá API LLM.**
- Môi trường dev: `pnpm dev` với Postgres trong Docker; seed bằng `pnpm db:seed`.
- Cập nhật: `git pull && docker compose build && docker compose up -d` ; migration chạy tự động lúc web khởi động (`prisma migrate deploy`).

## 8. Quyết định kiến trúc (ADR tóm tắt)

| # | Quyết định | Thay thế đã cân nhắc | Lý do |
|---|---|---|---|
| ADR-1 | Next.js full-stack, 1 repo | .NET + Next.js (stack MEDIFA ONE) | Dự án gia đình 2 người dùng; giảm 60% khối lượng hạ tầng; Claude Code làm Next.js hiệu quả |
| ADR-2 | pg-boss thay vì Redis/BullMQ | BullMQ + Redis | Bớt 1 service; tải job nhỏ |
| ADR-3 | pgvector thay vì vector DB riêng | Qdrant/Chroma | Chỉ vài nghìn vector |
| ADR-4 | Mọi output AI qua tool-use JSON + Zod | Parse text tự do | Ổn định, test được, không vỡ UI |
| ADR-5 | Bài luyện là **dữ liệu** (`ExerciseSpec` JSON) render bởi component theo `type` | AI sinh HTML/JSX | An toàn, cache được, chấm cục bộ được |
| ADR-6 | Web Speech mặc định, cloud TTS/STT qua adapter | Chỉ cloud | Chi phí + độ trễ; adapter đổi được |
| ADR-7 | Mastery = mô hình Bayesian/ELO-lite giải thích được (xem 04) | Deep knowledge tracing | Dữ liệu ít; cần giải thích cho phụ huynh |
| ADR-8 | Chạy tại nhà + Cloudflare Tunnel | VPS/Vercel | Dữ liệu trẻ ở nhà; chi phí 0; anh đã quen Docker/Cloudflare |
| ADR-9 | **Nội dung (bài học + ngân hàng bài luyện) soạn ngoại tuyến bằng Claude Code, nạp vào DB; app chỉ đọc** | Sinh bài bằng AI lúc chạy | Chất lượng cao hơn (đọc cả cuốn sách, tự kiểm, sửa được), chi phí trả một lần, độ trễ 0, ba mẹ duyệt trước. Xem `10-NAP-NOI-DUNG.md` |
| ADR-10 | **App không gọi API LLM nào; mọi việc cần AI (đọc ảnh vở, chấm bài mở, báo cáo tuần) đi qua hàng chờ và do Claude Code xử lý theo lô** | Giữ API Anthropic cho vài việc mỏng | Nhất quán với ADR-9; chi phí vận hành ≈ 0; không có khoá API trong hệ thống; đổi lại kết quả đọc ảnh trễ 1–3 ngày và bỏ gia sư giọng nói ở v1. Xem `13-HANG-CHO-AI.md` |
