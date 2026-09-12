# CLAUDE.md — Học cùng Mai Thy & Chí Thanh (EDISON_LEARNING)

Nền tảng web gia đình, dùng AI cá nhân hoá việc học ở nhà cho hai bé lớp 1 (hệ Song ngữ, Edison Ecopark). Người dùng chính là **trẻ 6 tuổi** và **phụ huynh**.

## Cách làm việc trong repo này

1. Lộ trình ở **`docs/08-LO-TRINH-PHA.md`**: làm theo từng pha, mỗi pha 3–5 việc, xong pha thì tự kiểm tra theo "Tiêu chí xong" của pha đó rồi báo cáo ngắn cho chủ dự án (đã làm gì, cách chạy thử, chưa làm gì, câu hỏi). Tiến độ ghi vào `docs/TIEN-DO.md` (mỗi pha một mục: ngày, kết quả, tồn đọng).
2. Tài liệu `docs/00`–`13` là **nguồn sự thật**. Làm khác tài liệu → viết ADR ở `docs/adr/` và nêu trong báo cáo; không tự đổi quyết định đã chốt (ADR-1…10 trong `docs/02-KIEN-TRUC.md` §8).
3. Bị chặn thật (thiếu tài liệu, quyết định trái tài liệu) → hỏi chủ dự án; còn lại làm trọn pha, không dừng giữa chừng.
4. Không push; commit Conventional Commits, tiếng Anh. `pnpm lint && pnpm test && pnpm build` phải xanh trước khi báo cáo.

## Bản đồ tài liệu

| Cần gì | Đọc |
|---|---|
| Mục tiêu, người dùng, nguyên tắc, thuật ngữ | `docs/00-TONG-QUAN.md` |
| Yêu cầu chức năng (FR-*), phi chức năng (NFR-*), tiêu chí chấp nhận | `docs/01-YEU-CAU-CHUC-NANG.md` |
| Stack, cấu trúc thư mục, luồng, API, bảo mật, Docker, ADR | `docs/02-KIEN-TRUC.md` |
| Thực thể & schema Prisma, seed | `docs/03-MO-HINH-DU-LIEU.md` |
| Thuật toán mastery, planner, `ExerciseSpec`, prompt, chấm, ngân sách, eval | `docs/04-AI-DANH-GIA.md` |
| Bản đồ kỹ năng 6 môn, TKB 1B3, ánh xạ NAVIO/Kids A-Z | `docs/05-CHUONG-TRINH-HOC.md` |
| Design system trẻ em, màn hình, component | `docs/06-THIET-KE-UI.md` |
| Pipeline nạp ảnh/PDF, thói quen dữ liệu | `docs/07-DU-LIEU-DAU-VAO.md` |
| Pha, việc, tiêu chí xong, lưu ý riêng từng pha | `docs/08-LO-TRINH-PHA.md` |
| Sách trường đã có (`sach giao khoa/`, bộ Kết nối tri thức), bài học ↔ kỹ năng ↔ tuần | `docs/09-GIAO-TRINH-TRUONG.md` |
| **Soạn nội dung ngoại tuyến rồi nạp DB** — định dạng file, rubric chất lượng, lệnh CLI | `docs/10-NAP-NOI-DUNG.md` |
| Nhật ký lớp hằng ngày (Edi Parent), bài cô giao, lái Daily Quest theo bài học hôm nay | `docs/11-NHAT-KY-LOP.md` |
| Vai trò người dùng, đăng nhập, quản lý tài khoản, bảo mật khi mở ra internet | `docs/12-NGUOI-DUNG-DANG-NHAP.md` |
| **Hàng chờ AI** — cách xử lý ảnh vở, chấm bài mở, báo cáo tuần bằng Claude Code | `docs/13-HANG-CHO-AI.md` |
| **Dữ liệu vận hành** — `ops/state` để đọc, `ops/requests` để tác động; cửa chung của Claude Code và Claude chat | `docs/14-DU-LIEU-VAN-HANH.md` |

## Stack (đã chốt)

pnpm + Turborepo · Next.js 15+ App Router · TypeScript strict · Tailwind 4 + shadcn/ui (phụ huynh) + `components/kid/*` (trẻ em) · Prisma + PostgreSQL 16 · pg-boss (worker) · Auth.js v5 · **không có SDK LLM** (hàng chờ cho Claude Code) · TTS/STT Web Speech mặc định, cloud TTS tuỳ chọn · Docker Compose · Cloudflare Tunnel.

```
apps/web  apps/worker  packages/{core,inbox,content,db,config}
content/{skill-map,lessons,exercises,art,timetable,prompts}  "sach giao khoa"/  docs/  docker/  scripts/
```

## Quy tắc code quan trọng

- `packages/core` là domain thuần (không import Next/Prisma trực tiếp) — thuật toán phải có test đơn vị.
- Bài luyện là **dữ liệu** `ExerciseSpec` render theo `type`; client không nhận `answerKey`.
- **App không gọi API LLM nào** (ADR-9 + ADR-10). Nội dung học do Claude Code soạn trong `content/` → `pnpm content:import`. Mọi việc cần AI lúc vận hành (đọc ảnh vở, chấm bài viết/nói, báo cáo tuần) đi qua **hàng chờ**: `pnpm inbox:pull` → Claude Code đọc `inbox/<ngày>/*/context.json` và viết `result.json` đúng schema → `pnpm inbox:validate` → `pnpm inbox:push`. Không thêm SDK Anthropic/OpenAI vào app.
- Trình nạp nội dung chỉ đụng `Skill`/`LessonUnit`/`Exercise`/`ContentBatch`; **không bao giờ** chạm dữ liệu học của con (`Evidence`, `SkillMastery`, `Session`, `Attempt`).
- Giao diện con: vùng chạm ≥ 64 px, chữ ≥ 22 px, mọi chữ có đọc to, **không** hiện "sai"/điểm số/đỏ, không link ngoài, không so sánh hai bé.
- Giao diện con **phải hấp dẫn như trò chơi**: nền thế giới minh hoạ, mascot Lottie 9 trạng thái, phản hồi hoạt hình cho mọi thao tác (Framer Motion spring), kịch bản ăn mừng; không màn hình nào "chữ + nút trên nền trơn"; tài sản trong `content/art/` theo `STYLE.md`. Checklist nghiệm thu: `docs/06-THIET-KE-UI.md` §4.
- Không gửi tên đầy đủ/ngày sinh của bé tới AI; dùng nickname.
- Web **mở ra internet**: không có đăng ký công khai, chỉ admin tạo tài khoản; mọi API kiểm vai trò (`ADMIN|PARENT|CHILD`) **và** quyền trên đúng `studentId` ở tầng server; không tin dữ liệu client gửi lên.
- Bí mật chỉ trong `.env`; `.env.example` luôn cập nhật.
- Tiếng Việt cho tài liệu & UI phụ huynh; tiếng Anh cho code/commit.
- Máy chủ dự án: Windows + Docker Desktop — README và script phải chạy từ PowerShell.

## Xử lý hàng chờ AI (khi chủ dự án nói "Xử lý hàng chờ AI")

App **không gọi API AI nào** — mọi việc cần đọc-hiểu-viết đi qua hàng chờ và do chính phiên Claude Code này làm (`docs/13`). Quy trình đúng **4 bước**, không bỏ bước nào:

1. **`pnpm inbox:pull`** — xuất mọi việc `PENDING` ra `inbox/<ngày>/<id>/`. Xem `inbox/<ngày>/README.md` để biết có bao nhiêu việc.
2. **Đọc từng `context.json` rồi viết `result.json` cùng thư mục.** Trong `context.json` có sẵn: `expects` (một câu mô tả phải trả ra schema nào), `student.nickname` (chỉ tên gọi ở nhà — **không bao giờ** dùng tên đầy đủ), `files` (ảnh nằm cùng thư mục), `text`, `skillCandidates` + `currentSkills` (ứng viên kỹ năng lấy từ full-text `searchSkills`), `errorCodes` (bộ mã lỗi đầy đủ), `parentCorrections` (10 lần ba mẹ đã sửa nhãn — dùng làm ví dụ).
   - `kind` nào thì schema nấy: `PHOTO_INTAKE` → `IntakeExtraction` · `DIARY_HARD` → `DiaryParse` · `WRITE_PHOTO_GRADE`/`SPEAK_GRADE` → `GradeResult` · `WEEKLY_REPORT` → `WeeklyReport` (`packages/inbox/src/schemas.ts`).
   - **Chỉ dùng mã kỹ năng và mã lỗi có trong `context.json`** — validator chặn mã lạ.
   - Câu viết cho bé đọc (`feedbackVi`) phải ngắn, ấm, **không bao giờ có chữ "sai"**; chưa làm thì ghi `BLANK`, đừng ghi `INCORRECT`.
   - Ô trống: để nguyên `outcome: "BLANK"`, máy chủ tự suy `blankReason` theo `07` §2.2 (trống dồn về cuối bài = `NOT_FINISHED`, trống giữa các câu đã làm = `DOES_NOT_KNOW`) và ba mẹ đổi được bằng một chạm. Chỉ ghi `blankReason` khi nhìn ảnh thấy rõ hơn quy tắc đó.
   - Ảnh màn hình NAVIO / Kids A-Z: ghi số vào `externals` (`raz_level`, `books_read`, `quiz_score`…), `items` để rỗng.
   - Muốn lái trọng tâm vài ngày tới thì ghi thêm `plan-hint.json` (`PlanHint`: `focusSkills`, `focusErrors`, `note` cho ba mẹ đọc).
3. **`pnpm inbox:validate`** — sửa đến khi sạch; lỗi nào cũng in kèm `id` của việc.
4. **`pnpm inbox:push`** — nạp kết quả vào DB ở trạng thái **chờ ba mẹ duyệt** (không tự thành bằng chứng của con). Báo lại cho chủ dự án: bao nhiêu việc đã nạp, việc nào không chắc cần ba mẹ nhìn kỹ.

Xem hàng chờ trên web: `/admin/inbox`. Chạy lại `inbox:push` trên lô đã xong không tạo bản trùng.

## Hai cửa của pha 8b

**1. Claude chat trên điện thoại → API nội bộ (`docs/13` §7).** Chủ dự án chụp bài vở bằng app
Claude trên điện thoại, **không gõ lệnh nào**. Phiên đó gọi `https://edu.medifa.vn/api/internal/*`
bằng `Authorization: Bearer $INTERNAL_API_TOKEN` (không dùng phiên đăng nhập):

- `GET /api/internal/context?student=thy&date=` — **gọi trước khi đọc ảnh**. Trả `contextId`,
  `skillCandidates`, `currentSkills`, bộ mã lỗi, 10 ví dụ ba mẹ đã sửa. Không đọc ngữ cảnh thì lô bị
  giữ lại chờ người (eval `intake-v1`: tự đoán 33%, có ngữ cảnh 77,8%).
- `POST /api/internal/intake/photo` (một ảnh, `multipart/form-data`) → `photoId`.
- `POST /api/internal/intake` — thân là `IntakeExtraction` kèm `student`, `contextId`, `photoIds`.
- `POST /api/internal/diary` — `{ text, date?, className? }`, đi qua bộ đọc theo mẫu.

Áp ngay, hoàn tác được: mỗi lô có `batchId`, `source=CHAT_INTAKE` (trọng số 0,8 như `INTAKE_PHOTO`),
và dashboard ba mẹ có nút **"Hoàn tác lô này"** (gỡ `Evidence` của lô, tính lại mastery từ bằng chứng
còn lại). **Giữ lại chờ người** ở ba chỗ máy hay sai: `confidence < 0,6`, không phân biệt được
`BLANK` với sai, kỹ năng ngoài `skillCandidates`. Mã kỹ năng/mã lỗi **không tồn tại** → 400 kèm
đường dẫn trường sai. Mọi lời gọi ghi vào `/admin/inbox`.

**2. Dữ liệu vận hành `ops/` (`docs/14`).** Thư mục là API: đọc `ops/state/`, tác động qua
`ops/requests/`.

- `pnpm ops:export` (tự chạy 04:30 sau `planner.daily`) → 11 CSV + `meta.json` + `SUMMARY.md` vào
  `ops/state/<ngày>/`, cộng `ops/context/HIEN-TRANG.md` + `QUYET-DINH.md`. Giữ 90 ngày, < 5 MB/ngày,
  **chỉ nickname** — không tên đầy đủ, không ngày sinh.
- Muốn đổi gì thì **đặt một file JSON** vào `ops/requests/` (9 thao tác trong danh sách trắng) rồi
  `pnpm ops:apply`: in diff → chờ người gật → áp → `ops/applied/<ngày>/` kèm đường lùi +
  `ops/CHANGELOG.md`. Từ chối thì sang `ops/rejected/`.
- **Không bao giờ** sửa `Evidence`/`Attempt`/`Session`/`SkillMastery`/`User` qua đường này; file nào
  nhắc tới chúng bị từ chối cả file. Sàn ôn 30% không phá được bằng `setPlannerWeight`.

## Lệnh thường dùng

```
pnpm dev            # web + worker (Postgres qua docker)
pnpm db:migrate     # prisma migrate dev
pnpm db:seed
pnpm content:validate            # kiểm định file trong content/
pnpm content:import --dry-run    # xem thay đổi trước khi nạp DB
pnpm content:stats               # kỹ năng nào còn thiếu bài (đọc DB)
pnpm content:export --skill <mã> # xuất ngược từ DB ra file
pnpm content:import-intake       # nạp lô ảnh vở cũ từ intake-inbox/<bé>/<ngày>/ (10 §8)
pnpm intake:run                  # tiền xử lý ảnh vừa nạp ngay, không chờ job mỗi phút
pnpm eval:intake                 # chấm bộ nhãn đọc ảnh (docs/eval/intake-v1.md)
pnpm inbox:pull && pnpm inbox:validate && pnpm inbox:push   # "Xử lý hàng chờ AI"
pnpm report:data thy && pnpm report:push                    # "Viết báo cáo tuần"
pnpm ops:export                  # chụp số liệu vận hành ra ops/state/<ngày>/ (14 §3)
pnpm ops:apply [--dry-run]       # đọc ops/requests/, in diff, chờ người gật (14 §4)
pnpm lint && pnpm test && pnpm build
docker compose -f docker/compose.yml up -d --build
```
