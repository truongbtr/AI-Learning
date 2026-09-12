# 13 — HÀNG CHỜ AI: MỌI VIỆC CẦN AI ĐỀU QUA CLAUDE CODE (ADR-10)

> **Quyết định (10/09/2026):** ứng dụng **không gọi API Anthropic** (hay bất kỳ LLM nào) lúc chạy. Mọi việc cần "đọc – hiểu – viết" đều do **Claude Code** làm theo lô trong repo, giống cách soạn nội dung (ADR-9). App chỉ làm hai việc: **gom việc vào hàng chờ** và **nhận kết quả về để ba mẹ duyệt**. Không có `ANTHROPIC_API_KEY` trong `.env`.

---

## 1. Ranh giới mới

| Việc | Trước (ADR-9) | Nay (ADR-10) |
|---|---|---|
| Soạn bài học, ngân hàng bài luyện | Claude Code | Claude Code (không đổi) |
| Đọc ảnh bài vở, phiếu, nhận xét cô | API lúc chạy | **Hàng chờ → Claude Code** |
| Nhật ký lớp Edi Parent | API lúc chạy | **Bộ đọc theo mẫu (không AI)** cho phần "Thông tin"; phần "Dặn dò" phức tạp → hàng chờ |
| Chấm đọc to (STT) | STT + API vùng xám | **STT + so khớp từ, không AI**; máy không chắc → ba mẹ chạm "đúng/chưa đúng" |
| Chấm ảnh bài viết tay, nói đáp | API | **Hàng chờ → Claude Code** |
| Báo cáo tuần | API | **Claude Code chạy mỗi Chủ nhật** (một lệnh) |
| "3 điều cần chú ý" | API viết | **Mẫu câu + số liệu** (không AI); Claude Code làm giàu khi chạy báo cáo tuần |
| Trợ lý "Hỏi về con" | API chat trong app | **Ba hỏi Claude Code trực tiếp trong repo** (có lệnh xuất dữ liệu bé) |
| Gia sư giọng nói cho con | API | **Bỏ khỏi v1** (cần AI trực tuyến) |
| Gắn kỹ năng bằng embedding | API embed + pgvector | Bỏ — Claude Code gắn thẳng khi đọc ảnh; **bỏ pgvector** |
| TTS đề bài & giọng mascot | cloud TTS | Giữ tuỳ chọn cloud TTS (Google/Azure — **không phải Anthropic**, sinh một lần lúc nạp); mặc định **Web Speech miễn phí** |
| STT | Web Speech / Whisper | **Web Speech miễn phí** trên thiết bị; Whisper chỉ là tuỳ chọn |

Kết quả: app **thuần tất định**, chi phí vận hành ≈ 0; Daily Quest, chấm bài đóng, mastery, thang rèn, thế giới, mascot — **không thứ gì phụ thuộc AI trực tuyến**.

## 2. Hàng chờ AI hoạt động thế nào

```
 TRONG APP (hằng ngày, mẹ/ba)                    TRONG REPO (vài ngày một lần, ba)
 ──────────────────────────────                  ─────────────────────────────────
 Mẹ chụp phiếu/vở  ──▶ app lưu ảnh + tạo mục     ba mở Claude Code:
                       hàng chờ  (INBOX_PENDING)    "Xử lý hàng chờ AI"
 Dán nhật ký lớp   ──▶ phần Thông tin đọc ngay ──┐   │
                       phần Dặn dò khó → hàng chờ│   ▼
 Con chụp bài viết ──▶ hàng chờ                  │  pnpm inbox:pull   → chép việc ra ./inbox/<ngày>/
                                                  │  Claude Code đọc ảnh/văn bản, viết ket-qua.json
                                                  │  (đúng schema IntakeExtraction / GradeResult / …)
                                                  │  pnpm inbox:push   → nạp kết quả → PENDING_REVIEW
                                                  ▼
 Ba mẹ duyệt trong app (P6) ◀────────────────────┘  → Evidence → mastery → dashboard
```

- **Mục hàng chờ** (`InboxItem`): `kind` (`PHOTO_INTAKE | DIARY_HARD | WRITE_PHOTO_GRADE | SPEAK_GRADE | WEEKLY_REPORT`), `studentId?`, `payload` (ảnh, văn bản, ngữ cảnh: bài học, kỹ năng ứng viên, bộ mã lỗi), `status` (`PENDING | PULLED | DONE | FAILED`), `resultRef`.
- **`pnpm inbox:pull`** xuất mọi mục `PENDING` thành thư mục `inbox/<ngày>/<id>/` gồm ảnh + `context.json` (những gì Claude Code cần biết: bé nào, môn gợi ý, kỹ năng đang học tuần này, bộ mã lỗi, 10 ví dụ phụ huynh đã sửa trước đó).
- **Claude Code** đọc từng mục, ghi `result.json` theo schema Zod tương ứng, tự kiểm bằng `pnpm inbox:validate`.
- **`pnpm inbox:push`** nạp `result.json` → tạo `IntakeResult`/`GradeResult`/`Report` ở trạng thái chờ duyệt, đánh dấu mục `DONE`.
- Toàn bộ chạy được **một câu** trong Claude Code: *"Xử lý hàng chờ AI"* — `CLAUDE.md` mô tả quy trình để lần nào cũng làm đúng.

## 3. Hai chế độ quyết định bài học (chốt 10/09/2026)

| Chế độ | Khi nào | Ai quyết | Cách |
|---|---|---|---|
| **A. Có dữ liệu mới** | Ba đưa ảnh vở, nhật ký lớp, phiếu… vào và chạy Claude Code | **Claude Code** đọc dữ liệu → ghi bằng chứng, mã lỗi, bài cô giao → **và có thể ghi thẳng "trọng tâm" cho những ngày tới** (`PlanHint`) | Một câu: *"Xử lý dữ liệu hôm nay và quyết định bài học"* → `inbox:pull` → đọc → `result.json` + `plan-hint.json` → `inbox:push` |
| **B. Không có dữ liệu mới** | Mọi ngày còn lại | **Backend** tự quyết bằng thuật toán planner (`04` §4) trên dữ liệu đang có | Job `planner.daily` 04:00, hoặc lúc con mở app |

Điểm quan trọng: **backend luôn chạy planner**, kể cả ở chế độ A. Claude Code không thay planner; nó **nạp dữ liệu tốt hơn và để lại gợi ý trọng tâm** (`PlanHint`: kỹ năng ưu tiên, mã lỗi cần rèn, bài cô giao, số ngày hiệu lực, lý do). Planner tôn trọng gợi ý còn hiệu lực rồi mới đến quy tắc mặc định. Hết hiệu lực hoặc không có gợi ý → chế độ B tự nhiên, không cần ai bật tắt. Con **không bao giờ** mở app mà không có bài.

`PlanHint` — `studentId`, `validFrom`, `validTo` (mặc định 3 ngày), `focusSkills[]` (mã + trọng số), `focusErrors[]`, `avoidSkills[]` (tạm tránh, ví dụ con đang chán), `note` (Claude Code giải thích để ba mẹ đọc), `createdBy` (`claude-code|parent`). Ba mẹ cũng đặt được `PlanHint` bằng tay trong `/parent` ("tuần này tập trung đọc").

## 3b. Nhịp trong tuần (thực tế)

| Khi nào | Ai | Việc |
|---|---|---|
| Mỗi tối | Con | Daily Quest — **không cần AI**, luôn chạy |
| Mỗi tối | Mẹ/Ba | Chụp phiếu/vở, dán nhật ký lớp (phần "hôm nay học bài gì" có hiệu lực ngay, không cần AI) |
| 2–3 tối/tuần (T3, T6…) | Ba | Mở Claude Code: "Xử lý hàng chờ AI" → 3–10 phút → duyệt kết quả trong app |
| Chủ nhật | Ba | "Viết báo cáo tuần" → Claude Code đọc số liệu (`pnpm report:data`), viết báo cáo, `pnpm report:push` |
| Khi cần | Ba | Hỏi thẳng Claude Code: "Thy yếu gì tháng này?" — nó chạy `pnpm export:student thy` rồi trả lời |

**Đánh đổi phải chấp nhận:** kết quả đọc ảnh vở **trễ 1–3 ngày** thay vì 90 giây; bài viết tay/nói đáp của con được chấm muộn (con vẫn nhận sao ngay, "Cú chấm sau"); không có gia sư giọng nói ở v1. Bù lại: không tốn phí, không lộ dữ liệu con qua API lúc chạy, và Ba nhìn thấy mọi kết quả AI trước khi vào hệ thống.

**Không bị ảnh hưởng:** việc "biết con yếu chỗ nào" từ **bài luyện trên app** (nguồn bằng chứng nhiều nhất) diễn ra tức thì vì chấm cục bộ; thang rèn, thẻ lỗi, ưu tiên theo bài học hôm nay đều chạy ngay.

## 4. Nhật ký lớp không cần AI (phần lớn)

Bài đăng của cô có cấu trúc ổn định: `- <Môn>: <Tên bài>` ở "Phần Thông tin". Bộ đọc theo mẫu (regex + bảng tên môn + so khớp tên bài với `LessonUnit` bằng chuỗi) xử lý được **ngay trong app**, hiện cho ba mẹ xác nhận một chạm. "Phần dặn dò" thường cũng theo mẫu (`luyện đọc N lần Bài X trang Y`); mẫu nào không khớp → đưa vào hàng chờ cho Claude Code, hôm sau có. Vì vậy Daily Quest tối đó **vẫn bám đúng bài sáng nay học** mà không cần AI.

## 5. Thay đổi kéo theo trong tài liệu khác

- `02`: bỏ hàng "AI (Anthropic API)", bỏ pgvector, bỏ `packages/ai`; thêm `packages/inbox`; ADR-10.
- `04` §1 nhóm B: đổi thành "chạy theo lô bằng Claude Code qua hàng chờ"; `EXERCISE_GEN` bỏ hẳn.
- `01`: FR-INT-01/02 (kết quả về sau khi xử lý hàng chờ), FR-INT-06 (bộ đọc theo mẫu), FR-LRN-05 (gia sư giọng nói → P2), FR-PAR-04 (báo cáo tuần qua Claude Code), FR-PAR-05 (trợ lý → hỏi Claude Code trong repo), NFR-09 (chi phí ≈ 0).
- `07` §2: pipeline ảnh đi qua hàng chờ. `11` §3–4: bộ đọc theo mẫu.
- `08`: pha 2 việc 2 → `packages/inbox`; pha 4 → hàng chờ + bộ đọc mẫu; pha 7 bỏ trợ lý/gia sư, thay bằng báo cáo tuần qua Claude Code.
- `CLAUDE.md`: quy trình "Xử lý hàng chờ AI" và "Viết báo cáo tuần".

## 6. Cánh cửa mở: worker tự động (v2, tuỳ chọn — KHÔNG làm ở v1)

Hàng chờ là một **giao diện**, không gắn với ai xử lý. v1: Claude Code xử lý theo lô bằng tay. v2 (nếu chủ dự án muốn sau khi dùng ổn vài tháng): thêm `apps/ai-worker` — một process riêng có khoá API, tự lấy `InboxItem(PENDING)` và trả kết quả về **cùng bảng, cùng schema**; app web không đổi một dòng. Vì vậy thiết kế `InboxItem`, `context.json`, `result.json` phải đủ tổng quát: không giả định người xử lý là người hay máy.

Nếu bật worker tự động thì các rào sau là **bắt buộc, không thương lượng** (rút từ các sự cố "AI chạy vòng lặp đội chi phí" thường gặp):

| Rào | Cách làm |
|---|---|
| Trần cứng ở nhà cung cấp | Đặt giới hạn chi tiêu tháng trong console Anthropic — app không thể vượt |
| Ngân sách ngày trong app | `AiConfig.dailyBudgetUsd`; chạm → worker dừng, hàng chờ giữ nguyên, chờ Claude Code |
| Giới hạn mỗi lời gọi | `max_tokens` cố định theo loại việc; ảnh nén ≤ 1.5 MB, ≤ 4 ảnh/lời gọi |
| Thử lại | tối đa 2 lần khi sai schema, rồi đánh dấu `FAILED` cho người xem — không lặp vô hạn |
| Không vòng lặp tự dùng công cụ | worker chỉ gọi một lần / một mục; không có agent tự lặp |
| Chống chạy lại | mục `PULLED` quá 30 phút mới được lấy lại; idempotent theo `InboxItem.id` |
| Nhật ký & cảnh báo | mỗi lời gọi ghi token + chi phí; email khi vượt 50% và 100% ngân sách ngày |
| Gia sư giọng nói (nếu có) | giới hạn cứng 20 câu/ngày/bé, mỗi câu ≤ 2 câu trả lời, lưu hội thoại cho ba mẹ xem |

Ước lượng khi bật đủ rào: ≤ 1–2 USD/tháng cho hai bé. Không có rào: một lỗi lập trình có thể tiêu vài chục USD trong một đêm.

---

## 7. Chế độ C — Claude chat đọc ảnh hằng ngày (chốt 12/09/2026, sửa cùng ngày)

Chủ dự án chụp ảnh bài vở mỗi tối và đưa thẳng vào phiên Claude chat. **Yêu cầu số một: chủ dự án
không phải gõ lệnh nào.** Chỉ gửi ảnh, dán nhật ký lớp, rồi đọc lại vài dòng chat tóm tắt.

### 7.1 Đường chính — API nội bộ

Chat gọi thẳng API của web qua tên miền Cloudflare Tunnel (pha 8 việc 1).

**Tên miền đã có (12/09/2026): `https://edu.medifa.vn`** — chủ dự án đã trỏ qua Cloudflare Tunnel về
`localhost:5000` trên máy chủ. ⚠️ Web của dự án mặc định chạy cổng 3000: hoặc đổi web sang **5000**,
hoặc sửa cấu hình tunnel về 3000 — phải khớp, ghi rõ trong `docs/VAN-HANH.md`.

- `POST /api/internal/intake` — thân là `IntakeExtraction` kèm ảnh đã tải lên trước qua
  `POST /api/internal/intake/photo`; `POST /api/internal/diary` cho nhật ký lớp.
- Xác thực bằng `Authorization: Bearer $INTERNAL_API_TOKEN` (biến đã có từ pha 1), **không** dùng phiên
  đăng nhập người dùng. Nhánh `/api/internal/*` được Cloudflare cho qua Access nhưng chặn bằng token,
  giới hạn tần suất, và **chỉ nhận các thao tác ghi bằng chứng học** — không chạm `User`, `.env`,
  không xoá gì.
- Chủ dự án làm **một lần**: thêm tên miền vào danh sách mạng cho phép của tài khoản Claude, và đặt
  `INTERNAL_API_TOKEN` vào `.env`.

### 7.2 Đường lùi — thư mục + job tự nhặt

> **Lưu ý:** chủ dự án chụp bằng app Claude **trên điện thoại** và tải thẳng vào phiên chat ở đó. Phiên
> trên điện thoại **không có cầu nối tới máy chủ**, nên đường lùi này chỉ dùng được khi làm từ máy tính.
> Vì vậy §7.1 (API) là **đường duy nhất cho nhịp hằng ngày**, không phải tuỳ chọn: tên miền phải nằm
> trong danh sách mạng cho phép và `INTERNAL_API_TOKEN` phải sống.

Khi chat không gọi được API (mạng, tunnel, token hết hạn): chat viết `result.json` vào
`inbox/<ngày>/<task>/` qua cầu nối; job `intake.watch` trên máy chủ quét mỗi phút, tự
`validate` + `push`. Vẫn không cần chủ dự án gõ gì. Job ghi log và báo lỗi lên `/admin/inbox`.

### 7.3 Duyệt: áp luôn, hoàn tác được

- Mặc định **áp ngay**, không chặn chờ duyệt. Mỗi lô mang `batchId` và `source=CHAT_INTAKE`.
- Dashboard ba mẹ hiện một thẻ mỗi tối: đọc mấy ảnh, ghi nhận gì, **nút "Hoàn tác lô này"** một chạm
  (gỡ đúng các `Evidence` của lô và tính lại mastery).
- **Ngoại lệ giữ lại chờ người:** item có `confidence < 0.6`, hoặc không phân biệt được `BLANK` với
  sai, hoặc kỹ năng không nằm trong `skillCandidates`. Đây là chỗ máy hay sai và sai thì hại nhất.
- Trọng số bằng chứng từ chế độ này: như `INTAKE_PHOTO` (0,8).

### 7.4 Ràng buộc không đổi

- Chat **chỉ chọn mã kỹ năng có trong ngữ cảnh** API trả về (`GET /api/internal/context?student=&date=`:
  ứng viên kỹ năng, bài lớp 3 ngày gần nhất, bộ mã lỗi, 10 ví dụ ba mẹ đã sửa). Không có thì để `null`
  và đánh dấu cần người xem — không bịa. Eval `intake-v1`: tự đoán đúng 33 %, có ngữ cảnh 77,8 %.
- `BLANK` ≠ sai, luôn luôn.
- Nickname (`thy`, `thanh`), không tên đầy đủ, không ngày sinh.
- **Hệ thống không phụ thuộc vào chat**: tối nào không có ảnh thì planner tự quyết (chế độ B).

### 7.5 Việc cho developer

- Ba endpoint `/api/internal/{context,intake,diary}` + upload ảnh, Zod kiểm định, token bearer, giới
  hạn tần suất, log mọi lần gọi vào `/admin/inbox`.
- `batchId`, `source=CHAT_INTAKE`, và **hoàn tác lô** (gỡ Evidence + tính lại mastery) — có test.
- Job `intake.watch` cho đường lùi §7.2.
- Validator từ chối: mã kỹ năng ngoài `skillCandidates`, mã lỗi ngoài `error-taxonomy.json`, thiếu
  trường bắt buộc — báo rõ sai ở đâu.
- Ảnh gốc giữ trong `intake-inbox/`, không lên git.
