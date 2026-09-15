# 08 — LỘ TRÌNH PHÁT TRIỂN THEO PHA

> Mỗi pha gộp 3–5 việc, developer (Claude Code) làm trọn một pha, tự kiểm tra theo "Tiêu chí xong", ghi `docs/TIEN-DO.md` rồi báo cáo chủ dự án.
>
> Từ ADR-9, **pha 2 và pha 6 phần lớn là soạn nội dung chứ không phải viết code** — Claude Code đọc sách và viết file JSON trong `content/`, xem `10-NAP-NOI-DUNG.md`. Không tách pha nhỏ hơn. Phần "Lưu ý riêng" của mỗi pha đọc trước khi bắt đầu pha đó.
>
> Ước lượng là số **phiên làm việc** của Claude Code (mỗi phiên ≈ 1–3 giờ), không phải ngày lịch.

---

## Tổng quan

| Pha | Tên | Kết quả nhìn thấy được | Ước lượng |
|---|---|---|---|
| 0 | Khung dự án + đăng nhập & quản lý người dùng | `docker compose up` chạy; admin tạo sẵn tự tạo tài khoản cho ba mẹ và hai con; phân quyền chặt | 2–3 |
| 1 | Bản đồ kỹ năng & năng lực | Admin xem cây kỹ năng; API mastery + thuật toán có test | 2–3 |
| 2 | Xưởng nội dung & ngân hàng bài luyện đợt 1 | ~1.100 bài thật đã nạp DB, duyệt được trong admin | 3–4 |
| 3 | Góc của con — thế giới, mascot, phiên học | Con làm được Daily Quest với 6 dạng bài trong thế giới có đồ hoạ, mascot hoạt hình, thưởng, các cơ chế giữ mới P0 | 6–7 |
| 4 | Nạp ảnh bài vở, nhật ký lớp & bài cô giao | Chụp ảnh → duyệt → mastery đổi; dán nhật ký → quest bám bài học hôm nay | 4 |
| 5 | Bảng điều khiển ba mẹ | Tổng quan, bản đồ năng lực, kế hoạch, TKB | 3 |
| 6 | Nội dung đợt 2 & bám tuần học | Phủ hết học kỳ 1 cả 6 môn; bài luyện bám bài đang học ở trường | 2–3 |
| 7 | Báo cáo tuần qua Claude Code, chấm bài mở qua hàng chờ, dạng bài P1 | Báo cáo tuần; bản tóm tắt theo mẫu; viết chụp/nói đáp chấm qua hàng chờ | 3 |
| 8 | Vận hành & nghiệm thu thực tế | Cloudflare Tunnel, sao lưu, ngân sách AI, 2 tuần dùng thật, chỉnh sửa | 2 + 2 tuần |

Sau pha 3 gia đình đã có thể **dùng thử hằng ngày**: bài luyện thật đã có từ pha 2, chưa cần ảnh vở hay dashboard.

---

## Pha 0 — Khung dự án + đăng nhập & quản lý người dùng

**Lưu ý riêng pha 0** (đọc theo thứ tự: `CLAUDE.md` → `00` → `02` → `03` → `05` §2):
- Dựng đúng cấu trúc thư mục ở `02` §3; không thêm hạ tầng ngoài compose (postgres, web, worker).
- Prisma schema viết **đầy đủ mọi bảng** của `03` ngay từ pha này (kể cả bảng chưa dùng) để pha sau không migration lớn; enum đặt tên đúng tài liệu.
- **Đọc `12-NGUOI-DUNG-DANG-NHAP.md` trước khi làm phần đăng nhập.** Một bảng `User` với `role = ADMIN|PARENT|CHILD`; chỉ seed **một** tài khoản admin từ `.env` (`mustChangePassword=true`); không seed tài khoản Ba/Mẹ/hai bé — admin tự tạo trong `/admin/users`. Trang `/login` gộp cả hai lối vào (thẻ ảnh của con + form người lớn). Kid-login: lưới 9–12 hình, mã **4 hình** theo thứ tự, băm Argon2id; sai 5 lần khoá 10 phút kèm thông báo thân thiện và báo ba mẹ.
- **Không có SDK LLM trong app** (ADR-10). Không có `ANTHROPIC_API_KEY`. Tạo sẵn thư mục `inbox/` (gitignore) và bảng `InboxItem`.
- Tạo adapter `FileStorage` (local, `FILE_ROOT=/data/files`) ngay từ pha này; MinIO để sau. Font Nunito + Be Vietnam Pro qua `next/font` (self-host).
- Seed: **chỉ một `User` role=ADMIN** từ `ADMIN_USERNAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD`; `TimetableSlot` 30 dòng từ `content/timetable/1B3-2026.json` (viết theo `05` §2), `SchoolWeek` 35 tuần từ 08/09/2026 (tham số hoá — ngày bắt đầu thật sẽ chỉnh sau, xem `11` §5), `AiConfig` mặc định, ≥ 5 `Badge`; `Skill` để trống (pha 1); hồ sơ `Student` mẫu chỉ ở môi trường dev.
- Node 22 LTS, pnpm 9+, Next.js 15+, Prisma 6+, Postgres 16 (`postgres:16`, không cần pgvector); cookie httpOnly, không `localStorage` cho phiên.
- `.gitignore` phải có `sach giao khoa/`, `_to_delete/`, `.env`, `/data`.

1. Monorepo pnpm + Turborepo theo cấu trúc `02-KIEN-TRUC.md` §3; TypeScript strict; Biome/ESLint; Vitest; Playwright cấu hình.
2. `packages/db`: Prisma schema đầy đủ theo `03-MO-HINH-DU-LIEU.md` (được phép để trống phần chưa dùng nhưng phải có bảng — gồm `User` 3 vai trò, `LoginAudit`, `TrustedDevice`), migration đầu, seed: **một `User` role=ADMIN từ `.env`**, TKB 1B3, `SchoolWeek`, `AiConfig`, ≥ 5 `Badge`.
3. `apps/web`: Next.js, **Auth.js đầy đủ theo `12`** — credentials (username + mật khẩu Argon2id) + provider `kid-login` (avatar + mã 4 hình), khoá tài khoản/rate-limit IP, `LoginAudit`, ép đổi mật khẩu lần đầu, cookie httpOnly/Secure/SameSite, tiêu đề bảo mật; route groups `(kid)/(parent)/(admin)/(auth)` có middleware phân quyền; trang `/login` gộp; `/api/health`.
4. `apps/worker`: pg-boss chạy job mẫu `ping`; `docker/compose.yml` (postgres, web, worker), Dockerfile multi-stage, `.env.example`, README chạy trên Windows Docker Desktop.
5. **`/admin/users`** theo FR-ADM-06: bảng người dùng + 5 thao tác (tạo tài khoản — `CHILD` thì tạo luôn hồ sơ `Student`; gắn phụ huynh ↔ con; đặt lại mật khẩu/mã hình; bật-tắt; xem nhật ký đăng nhập). CI cục bộ `pnpm lint && pnpm test && pnpm build` xanh.

**Tiêu chí xong:** `docker compose up -d` → `/login` đăng nhập `admin` → **bị ép đổi mật khẩu**, chưa đổi thì mọi trang khác chuyển hướng về đây; sau khi đổi, admin tạo 1 phụ huynh và 2 bé (kèm hồ sơ `Student` và mã 4 hình) rồi gắn quan hệ; đăng xuất, con chạm thẻ ảnh + nhập mã hình vào được `/kid/home` hiện tên gọi ở nhà; nhập sai 5 lần → khoá 10 phút, `LoginAudit` ghi đủ 5 dòng; tài khoản `CHILD` gọi API `/api/students/:id/mastery` của bé kia → 403; phụ huynh chưa gắn con → 403; `pnpm test` xanh; worker log `ping ok`.

## Pha 1 — Bản đồ kỹ năng & mô hình năng lực

1. File seed `content/skill-map/*.json` cho 6 môn theo `05-CHUONG-TRINH-HOC.md` (≥ 250 kỹ năng, mỗi môn ≥ 35), **gộp kỹ năng bổ sung + `lessonRef` + `expectedWeek` cho Toán và Tiếng Việt từ `09-GIAO-TRINH-TRUONG.md`**; seed `Material` + `LessonUnit` khung (41 bài Toán, 8 chủ đề TV tập hai) chưa có nội dung; script kiểm tra seed (không trùng, tiên quyết hợp lệ, không vòng).
2. `packages/core/mastery`: thuật toán §3 của `04-AI-DANH-GIA.md` (update, decay, status, spaced repetition) — hàm thuần + test đơn vị với các ví dụ số trong tài liệu. **Seed `content/error-taxonomy.json` (~40 mã, `04` §11.1)**, bảng `ErrorStat` + job cập nhật, `RemediationTrack`; validator chặn mã lỗi lạ.
3. API: `GET /api/students/:id/mastery`, `.../history`, `POST /api/evidence` (nội bộ), job `mastery.decay` hằng đêm.
4. Admin `/admin/skills`: cây kỹ năng theo môn/mạch, tìm, sửa, ẩn, import JSON/CSV.
5. Tra cứu kỹ năng bằng chuỗi: tìm theo mã/tên/mô tả (Postgres full-text + unaccent) để bộ đọc nhật ký và màn duyệt gợi ý kỹ năng — không dùng embedding.

**Tiêu chí xong:** test mastery đúng ví dụ 59.9 / 40.1; POST 3 bằng chứng → status đổi đúng bảng §3.3; admin lọc ra ≥ 35 kỹ năng mỗi môn; tìm "đọc từ có sh" trả về `ESL.PH.DIGRAPHS_SH_CH_TH` trong top-3 bằng full-text.

## Pha 2 — Xưởng nội dung & ngân hàng bài luyện (đợt 1)

**Lưu ý riêng pha 2:** đọc `10-NAP-NOI-DUNG.md` trước — pha này xây **công cụ** rồi **dùng công cụ đó soạn nội dung thật**. Việc 1–3 là code; việc 4 là ngồi soạn bằng chính Claude Code (đọc sách trong `sach giao khoa/`, viết file, tự kiểm, sửa). Không sinh bài lúc chạy (ADR-9). Chất lượng quan trọng hơn số lượng: thà 25 kỹ năng có bài tốt còn hơn 100 kỹ năng bài hời hợt.

1. **`packages/content`** — schema Zod cho file bài học (`10` §4.1) và gói bài luyện (`10` §4.2); `content:validate` (định dạng, trùng lặp, tham chiếu kỹ năng/bài học/vật thể, phủ dạng bài & độ khó); `content:import` (upsert theo `stableId`/`code`, ghi `ContentBatch`, `--dry-run`, chỉ đụng bảng nội dung); `content:stats`; `content:export`. Test đơn vị cho importer, gồm ca "nạp lại lô cũ không tạo bản trùng".
2. **`packages/inbox`** (`13-HANG-CHO-AI.md`) — bảng `InboxItem`; schema Zod `IntakeExtraction`, `GradeResult`, `WeeklyReport`, `ExerciseSpec`; lệnh `inbox:pull` / `inbox:validate` / `inbox:push`; `/admin/inbox`. **Không có SDK LLM trong app.** Viết mục "Xử lý hàng chờ AI" vào `CLAUDE.md`.
3. **Xem trước & duyệt** — `/admin/content` (FR-ADM-05: danh sách lô, xem thử bài đúng như con thấy, gắn cờ, phát hành) và `/dev/kit` render một `ExerciseSpec` bất kỳ. TTS adapter + sinh cache audio lúc nạp cho `prompt.text` tiếng Anh.
4. **Soạn nội dung đợt 1** (`10` §9): 25–30 kỹ năng đang học từ nay tới tuần 12 — Toán bài 1–12 theo SGV, Tiếng Việt học vần, ESL/ENL nền (phonics, sight words, từ vựng chủ đề đầu), English Maths tương ứng; **40 bài/kỹ năng**, đủ 6 dạng của pha 3, đủ 5 mức khó, có `hints`/`explanation`/`sourceRef`, biến thể `robot`/`garden` cho bài có ngữ cảnh. Tự chấm theo rubric `10` §6, ghi `content/_reports/dot-1.md`.
5. **Nạp & phát hành** — `content:validate` sạch → `content:import` → duyệt lô trong `/admin/content` → phát hành; `content:stats` cho thấy mọi kỹ năng đợt 1 ≥ 35 bài đã phát hành.

**Tiêu chí xong:** `content:stats` liệt kê ≥ 25 kỹ năng, mỗi kỹ năng ≥ 35 bài `PUBLISHED`, không kỹ năng nào thiếu dạng bài mà pha 3 cần; `content:import --dry-run` chạy lại lô cũ báo 0 thay đổi; sửa 1 bài trong file rồi nạp lại → bài cập nhật tại chỗ, `stableId` giữ nguyên, `Evidence` cũ không mất; chọn ngẫu nhiên 20 bài, QC đọc và chấm theo rubric `10` §6 — **≥ 18/20 đạt** thì pha này xong; DB không có khoá AI vẫn truy vấn được bài.

## Pha 3 — Góc của con: thế giới, mascot, phiên học

**Lưu ý riêng pha 3:** đây là pha quyết định con có thích hay không. Đọc kỹ `06` §1.5–1.9 và checklist §4 trước khi code. Làm tài sản đồ hoạ (việc 1) **trước** rồi mới dựng màn hình lên nền đó — không làm màn hình "tạm bằng nút xám rồi thay sau".

1. **Tài sản đồ hoạ & hoạt hình** (`06` §1.9): viết `content/art/STYLE.md` (phong cách, bảng màu, prompt mẫu); thế giới **Thành phố Robot** hoàn chỉnh (3 lớp nền × 4 khu môn), thế giới **Vườn Kỳ Diệu** tối thiểu 1 khu; 2 mascot (robot, cú) đủ 9 trạng thái dạng Lottie/sprite; ≥ 6 avatar; bộ hiệu ứng (sao, pháo giấy, rương, lấp lánh); ≥ 60 vật thể SVG có nhãn EN/VI cho bài; bộ âm thanh; `manifest.json` + script kiểm tra kích thước. Nguồn tài sản cần chủ dự án duyệt phong cách (gửi 1 bảng tham chiếu trước khi làm hàng loạt).
2. **Design system kid & motion system** (`06` §1.1, §1.3, §1.8): token, font, âm thanh; `WorldBackground` (parallax), `Mascot` (Lottie, 9 trạng thái, `talk` đồng bộ TTS, phản ứng chạm), `BigButton` (spring), `StarFlyToPocket`, `StarPocket`, `SceneTransition`, `LoadingMascot`, `EmptyState`, `SpeakerButton`, `HintBulb`, `FeedbackOverlay`, `KidPinPad`; `useSpeak`; trang `/dev/kit` trình diễn mọi component và trạng thái mascot.
3. **6 component bài** với hoạt hình theo `06` §1.8: `MCQ`, `LISTEN_CHOOSE`, `DRAG_DROP` (nghiêng, hít, nảy), `COUNT_TAP`, `READ_ALOUD` (STT Web Speech, chấm khớp từ cục bộ), `WRITE_PHOTO` (chụp → PENDING); chấm dạng đóng ở server.
4. **Planner & phiên học:** `packages/core/planner` (`04` §4) + **thang rèn 6 bậc (`04` §11.4)** + test (gồm ca: 2 lỗi `nham_b_d` trong 7 ngày → phiên kế có bài đối chiếu b/d và ≤ 4 bài rèn); job `planner.daily` 04:00 + on-demand; chọn bài từ ngân hàng đã nạp ở pha 2 (không gọi AI); `choices[].errorTag` → ghi `Evidence.errorCode`; `scaffold: model` → mascot làm mẫu trước; adaptive độ khó; thay chỗ trống `{ten}`/`{vat}` theo bé (`10` §7); `Session`/`Attempt` API + SSE; phiên dở lưu/tiếp tục; offline-tolerant.
5. **Màn hình K1–K5, K7 trong thế giới + giữ mới (`06` §1.8b mục 1–4, §1.8c các mục P0):** sự kiện tuần, trạm chọn 1-trong-2, nghỉ vận động 30 giây, hỏi "chơi tiếp hay nghỉ" sau 8 bài; trứng nở theo ngày học, mascot có ký ức, mảnh tranh cuối tuần, hộp thư ba mẹ, thế giới theo giờ thật, sao vàng lớn, giấy chứng nhận in được; kid-login có nhân vật; K2 trang chủ là cảnh thế giới có mascot chào; K3 `QuestMap` avatar di chuyển giữa trạm, rương cuối đường; K4 làm bài trên nền thế giới; K5 `SessionFinale` kịch bản 4–6 s; thưởng `StarLedger`, `Streak`, ≥ 10 `Badge`, `BadgeCeremony`, K7 bộ sưu tập đặt vật phẩm vào thế giới.

**Tiêu chí xong:** Mai Thy đăng nhập → Daily Quest 12 bài ≥ 3 dạng, ≥ 2 môn, xong có kịch bản ăn mừng và sao; làm sai 3 lần thấy gợi ý rồi đáp án, không có chữ "sai"; mastery các kỹ năng trong phiên thay đổi; Playwright K1→K5 xanh; **đạt đủ 9 mục checklist `06` §4** trên iPad Safari, kèm video 2 phút cho chủ dự án.

## Pha 4 — Nạp ảnh bài vở & duyệt

1. P5 nạp ảnh (camera PWA, nhiều ảnh, nén client), `POST /api/intake`, lưu file, pHash chống trùng.
2. Ảnh vào `InboxItem`; worker chỉ tiền xử lý (sharp: xoay, nén). `inbox:pull` xuất kèm `context.json` (bé, môn gợi ý, kỹ năng tuần này, bộ mã lỗi, 10 ví dụ phụ huynh đã sửa); Claude Code đọc → `result.json`; `inbox:push` → chờ duyệt; SSE khi có kết quả.
3. P6 duyệt: ảnh + bbox, bảng item sửa inline, duyệt tất cả → `Evidence`, `ExternalProgress` (NAVIO/Kids A-Z), cập nhật mastery; ghi cặp sửa để few-shot.
4. P7 hộp thư duyệt + badge; FR-INT-04 ghi chú nhanh.
5. **Nhật ký lớp & bài cô giao** (`11-NHAT-KY-LOP.md`): ô dán văn bản + nhận ảnh `CLASS_DIARY`; task `DIARY_PARSE`; bảng `ClassDiary`/`DiaryLesson`/`Homework`/`ClassReminder`; planner đổi nguồn "bài đang học" sang `DiaryLesson` 3 ngày gần nhất; trạm **"Bài cô giao"** đầu bản đồ nhiệm vụ (đọc lặp N lần có đếm, quay video lưu file để ba mẹ nộp Teams, checklist việc ngoài app); thẻ nhắc phi học tập trên dashboard; hiệu chỉnh ngày bắt đầu năm học (`11` §5).
6. Eval intake: 20 ảnh mẫu do chủ dự án cung cấp → `docs/eval/intake-v1.md` (độ chính xác đúng/sai, phân biệt `BLANK` vs sai, gắn kỹ năng). Thêm `content:import-intake` (`10` §8) để nạp lô lớn ảnh vở cũ bằng Claude Code — kết quả vào cùng hàng chờ duyệt P6.

**Tiêu chí xong:** dán bài đăng Edi Parent mẫu → ra đúng 3 mục đã học + 3 bài cô giao + 1 nhắc đồng phục, Daily Quest tối đó đổi trọng tâm sang bài hôm nay; phiếu ESL làm dở (2/6 câu Exercise 2) → hệ thống báo `BLANK` chứ không báo sai, ba mẹ đổi nhãn được bằng một chạm; 5 ảnh vở Tiếng Việt → ≤ 90 s có kết quả; duyệt → mastery đổi và bằng chứng hiện trong drawer kỹ năng; ảnh màn hình Raz-Kids → `raz_level` ghi nhận và `ENL.RF.FLUENCY_LEVEL_*` cập nhật theo bảng ánh xạ.

## Pha 5 — Bảng điều khiển ba mẹ

1. P2 tổng quan 2 bé, P3 hồ sơ bé (thẻ 5 môn, xu hướng, hoạt động 7 ngày, "3 điều cần chú ý" — v1 tính bằng quy tắc §3.5, AI viết câu ở pha 7).
2. P4 bản đồ năng lực (heatmap môn/mạch, drawer kỹ năng: lịch sử, bằng chứng, "Luyện hôm nay" → `Session kind=TARGETED`), lộ trình mong đợi theo `expectedWeek`; xuất PDF.
3. P9 kế hoạch: task `PLAN` + prompt, đề xuất/duyệt/sửa; planner dùng plan đã duyệt.
4. P12 TKB & năm học (sửa TKB, tuần, nghỉ), P13 cài đặt bé (thời lượng, mascot, sở thích, mã hình, phần thưởng đời thực).
5. Responsive điện thoại (bottom tab), nút nổi "Chụp bài vở".

**Tiêu chí xong:** mọi con số trên P2/P3 bấm ra bằng chứng; đổi TKB → Daily Quest ngày sau đổi môn ưu tiên; duyệt plan → phiên hôm sau có **≥ 40%** bài thuộc plan *(hạ từ 50% ngày 12/09/2026 — xem ADR-18 mục 1: giữ nhịp ôn ≥ 30% quan trọng hơn con số của tiêu chí này)*.

> ⚠️ **ĐỔI THỨ TỰ 12/09/2026 — chủ dự án chốt: sau pha 5 làm thẳng PHA 8, rồi mới quay lại pha 6 và 7.**
> Lý do: ngân hàng 1.236 bài của đợt 1 đủ dùng vài tuần, mà hai tuần hai bé dùng thật sẽ dạy mình
> nhiều hơn bất kỳ bản thiết kế nào — biết con thích gì, chán chỗ nào, rồi hãy đổ công sức soạn tiếp.
> Thứ tự thực hiện: 0 → 1 → 2 → 3 → 4 → 5 → **8** → 6 → 7.
> Trong pha 8 chạy thật, bỏ tiêu chí "chi phí AI ≤ 6 USD/tháng" (ADR-10: app không gọi API LLM);
> thay bằng chi phí TTS Azure thực tế, vốn nằm trong hạn mức miễn phí.

## Pha 6 — Nội dung đợt 2 & bám tuần học

1. **Soạn nội dung đợt 2** (`10` §9): phủ hết học kỳ 1 cả 6 môn — đọc nốt SGV Toán (bài 13–20), Tiếng Việt học vần, ESL/ENL/ESCI theo sách khi có; 40–60 bài/kỹ năng; ưu tiên kỹ năng `content:stats` báo thiếu và kỹ năng hai bé đang yếu theo dashboard.
2. **Bài học đầy đủ** — điền `objectives`/`vocabulary`/`sampleTasks`/`answerKeyNotes`/`contentText` cho `LessonUnit` khung (`09`), có `sourceRef` tới trang sách; `/parent/materials` hiển thị danh sách bài học kèm nguồn, sửa nhỏ được.
3. **Bám tuần học** — đánh dấu "tuần này học bài nào" theo môn (mặc định `expectedWeek`); thông báo tuần của lớp chụp/dán → đề xuất bài của tuần; planner ưu tiên kỹ năng thuộc bài tuần này ở phần 20% "mới" và ở phần trọng tâm.
4. **Thư viện hình vật thể** — mở rộng `content/art/objects/` lên ≥ 200 vật thể có nhãn EN/VI; `ImageRef` resolver; validator chặn bài trỏ tới vật thể không tồn tại.

**Tiêu chí xong:** `content:stats` không còn kỹ năng học kỳ 1 nào dưới 30 bài đã phát hành; mở một bài Toán bất kỳ trong `/parent/materials` thấy đúng mục tiêu và số trang SGV; đổi "tuần này" sang bài khác → Daily Quest hôm sau đổi trọng tâm; không bài luyện nào trỏ tới hình thiếu.

## Pha 7 — Báo cáo, trợ lý, gia sư giọng nói, dạng bài P1

1. Job `report.weekly` + prompt `REPORT`; P10 xem/in; "3 điều cần chú ý" do AI viết có dẫn chứng.
2. P11 "Hỏi về con": `ASSIST_PARENT` với tool truy vấn (mastery, evidence, sessions, plans), stream, trích dẫn.
3. K8 "Hỏi bạn Cú": `ASSIST_KID` + bộ lọc 2 lớp + lưu hội thoại 90 ngày + phụ huynh xem lại; eval 30 câu ngoài chủ đề.
4. Dạng bài `SPEAK_ANSWER`, `TRACE`, `MINI_STORY`; `GRADE` cho READ_ALOUD (vùng xám), SPEAK_ANSWER, WRITE_PHOTO (vision); hàng chờ chấm trong P7; phụ huynh sửa điểm.
5. K6 chơi thêm theo môn với "vé"/ngày; gửi báo cáo qua email (P1).
6. **Lấp hai lỗ `ENL.RL.*` (đọc hiểu) và `ENL.W.*` (viết câu)** — hai mạch này hiện **không có dạng bài nào chở được**, nên bản đồ năng lực của cả hai bé để trắng ở đó và eval đọc ảnh không đề xuất được chúng (`docs/eval/intake-v1.md` §2 ca *Read and match* và *Draw and write*). `MINI_STORY` ở mục 4 là dạng bài của `ENL.RL.*`; `TRACE` + `WRITE_PHOTO` là của `ENL.W.*`. Cùng lúc: khi `docType = WORKSHEET` và môn là ENL, `inbox:pull` đưa **cả mạch kỹ năng** vào `context.json` chứ không chỉ kết quả tìm kiếm, vì hai mạch này trượt full-text 100% số ca.

**Tiêu chí xong:** báo cáo tuần có 3 số QC đối chiếu đúng DB; 10 câu hỏi phụ huynh trả lời có nguồn; 30/30 câu ngoài chủ đề bị chặn; bài viết chụp được chấm và phản hồi ≤ 2 phút; **`ENL.RL.*` và `ENL.W.*` mỗi mạch có ≥ 1 dạng bài phát hành và hiện được trạng thái trên P4** (hết trắng).

## Pha 8 — Vận hành & nghiệm thu thực tế

1. Cloudflare Tunnel + Access cho `/parent`, `/admin`; PWA manifest/icon, cài lên iPad và điện thoại; HTTPS. **Phần của con KHÔNG đặt sau Access** — trẻ 6 tuổi không qua được lớp đăng nhập thứ hai; con vào bằng mã 4 hình.
2. Sao lưu hằng đêm (pg_dump + bản sao file → NAS), script khôi phục **đã diễn tập thật trên container sạch**; xuất dữ liệu 1 bé ra JSON; xoá dữ liệu 1 bé.
3. **Chi phí TTS Azure thực tế** + chỗ xem số liệu + cảnh báo; theo dõi dung lượng ổ; log/health; cảnh báo khi job hỏng; `docs/VAN-HANH.md` **viết cho người không phải lập trình viên**.
4. Phiên chẩn đoán ban đầu (04 §10) cho cả hai bé; bàn giao cho gia đình dùng thật (dữ liệu học sạch, hai hồ sơ thật, mã 4 hình, mascot theo thế giới của từng bé).
5. Chạy thật 2 tuần, mỗi ngày ghi `docs/nhat-ky-chay-that.md`; cuối hai tuần sửa lỗi & tinh chỉnh UX; chốt v1.0; **danh sách việc cho pha 6**.

**Tiêu chí xong** *(bản chốt 12/09/2026 — chủ dự án sửa khi đảo thứ tự)*:

1. 2 bé **tự dùng 10 phút/ngày không cần trợ giúp trong ≥ 10/14 ngày** — đo bằng số liệu thật trong DB (`pnpm db:trial`), không phải cảm tính.
2. Khôi phục sao lưu **thành công trên máy sạch**, chứng minh bằng log của lần diễn tập (`docs/dien-tap/`).
3. Cả hai bé mở app từ icon trên iPad, đăng nhập bằng mã 4 hình, **không cần bàn phím**.
4. `/parent` và `/admin` không vào được nếu chưa qua Cloudflare Access; **phần của con vẫn vào được bình thường**.
5. **Chi phí TTS Azure trong tháng nằm trong hạn mức miễn phí F0** (500.000 ký tự); có chỗ xem số liệu (`/admin/health`, `pnpm db:usage`). *Tiêu chí cũ "chi phí AI ≤ 6 USD/tháng" **bỏ** — ADR-9/ADR-10: app không gọi API LLM nào.*
6. `docs/VAN-HANH.md` đủ để chủ dự án tự xử lý khi web không vào được, không cần gọi developer.
7. Việc 0 xong: nhịp ôn ≥ 30%, dữ liệu múi giờ đã sạch, test canh giữ múi giờ xanh, 39/39 e2e chạy được với tài khoản test riêng.

---

## Việc của chủ dự án (gom theo pha — developer nhắc trong báo cáo cuối pha trước)

| Trước pha | Cần chuẩn bị |
|---|---|
| 0 | Docker Desktop trên máy chạy; quyết định máy/NAS nào chạy. **Không cần khoá API.** |
| 2 | Chọn nhà cung cấp TTS/STT cloud (hoặc tạm Web Speech); khoá API tương ứng. Duyệt 20 bài mẫu QC gửi lên để chốt “bài thế này con làm được không” trước khi soạn hàng loạt |
| 3 | Duyệt bảng phong cách mỹ thuật (mascot, thế giới) — có thể cho hai bé chọn cùng; tài khoản công cụ sinh ảnh AI nếu dùng để làm tài sản |
| 4 | 20 ảnh vở/bài kiểm tra mẫu của hai bé (đủ loại: vở, bài KT, nhận xét, màn hình Raz-Kids/NAVIO) |
| 6 | Đã có SGV Toán 1 + TV1 tập hai. Còn cần: **Tiếng Việt 1 tập một** (ưu tiên — HK1 đang học), SGK học sinh Toán/TV, sách ESL Macmillan đi kèm NAVIO, English Maths, English Science, thông báo tuần gần nhất |
| 8 | Tài khoản Cloudflare + domain; NAS/thư mục sao lưu; iPad để nghiệm thu |
