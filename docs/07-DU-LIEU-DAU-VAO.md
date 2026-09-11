# 07 — GIẢI PHÁP DỮ LIỆU ĐẦU VÀO

> Hệ thống chỉ thông minh bằng dữ liệu nó có. Tài liệu này chốt **các kênh nạp dữ liệu**, pipeline xử lý, và thói quen của gia đình để dữ liệu chảy đều mà không tốn công.

---

## 1. Ba kênh chính (đã chốt với chủ dự án)

| Kênh | Tần suất | Ai làm | Công | Giá trị |
|---|---|---|---|---|
| **A. Chụp ảnh bài vở** (vở bài tập, bài kiểm tra, phiếu, nhận xét cô, màn hình NAVIO/Kids A-Z) | 2–4 lần/tuần, ~1 phút | Ba/Mẹ | rất thấp | Bằng chứng thật từ trường — biết con yếu gì *ở lớp* |
| **B. Kết quả bài luyện trên hệ thống** | mỗi ngày | Con (tự động) | 0 | Bằng chứng nhiều nhất, tin cậy nhất, đo tiến bộ |
| **C. Nội dung học soạn sẵn** (bài học rút từ sách + ngân hàng bài luyện) | mỗi đợt: đầu kỳ, khi thêm sách | Ba + Claude Code (ngoại tuyến, `10-NAP-NOI-DUNG.md`) | vài phiên Claude Code | Toàn bộ bài con luyện hằng ngày; bám đúng sách của trường |

| **D. Nhật ký lớp hằng ngày** (bài đăng của GVCN trên Edi Parent: hôm nay học bài gì + cô giao gì) | mỗi tối T2–T6, 20 giây | Ba/Mẹ (dán văn bản hoặc chụp) | rất thấp | **Biết chính xác hôm nay con học bài nào** → Daily Quest luyện đúng bài đó; biết bài cô giao; dựng dần chương trình ESL. Xem `11-NHAT-KY-LOP.md` |

Kênh phụ: **E. Ghi chú nhanh của phụ huynh** (1 câu) và **F. Hội thoại gia sư** (trọng số thấp).

## 2. Kênh A — Pipeline ảnh bài vở

```
Điện thoại (PWA) ──▶ POST /api/intake ──▶ lưu file ──▶ InboxItem(PENDING)  ── ADR-10: không gọi AI ở đây
   (các bước 2–3 dưới đây do CLAUDE CODE làm khi Ba chạy "Xử lý hàng chờ AI", xem 13-HANG-CHO-AI.md)
   │ camera trực tiếp, chọn nhiều ảnh                    │
   │ chọn bé / môn (tuỳ chọn) / ngày                     ▼
   │                                          1. Tiền xử lý (sharp): auto-rotate EXIF,
   │                                             resize cạnh dài 2000px, nén JPEG q80,
   │                                             tăng tương phản nhẹ, tách trang nếu ảnh 2 trang
   │                                          2. INTAKE_EXTRACT (Claude Vision, batch ≤ 4 ảnh/gọi):
   │                                             docType, subject, student guess, items[], teacherComment
   │                                          3. INTAKE_MAP: full-text searchSkills → top-8 skill → Claude Code chọn
   │                                          4. Lưu IntakeResult/IntakeItem (PENDING_REVIEW)
   │                                          5. SSE "intake.ready" → badge hộp thư
   ▼
Ba mẹ duyệt (P6) ──▶ Evidence[] + ExternalProgress[] ──▶ mastery update ──▶ dashboard
```

### 2.1 Các loại tài liệu AI phải nhận diện

| docType | Dấu hiệu | Trích gì |
|---|---|---|
| `WORKBOOK` (vở bài tập) | chữ viết tay của con, dấu ✓/✗ hoặc sửa đỏ của cô | từng bài/câu, đáp án con, đúng/sai, lỗi cụ thể |
| `TEST` (bài kiểm tra) | có điểm, tiêu đề bài KT | từng câu + điểm tổng, nhận xét |
| `WORKSHEET` (phiếu in) | in sẵn, có ô điền; phiếu ESL của trường có tiêu đề kiểu `GS1 – UNIT 1 – REVIEW UNIT 1`, ô Name/Class | như WORKBOOK + rút `unit`, tên phiếu để gắn `DiaryLesson` |
| `CLASS_DIARY` (nhật ký lớp) | ảnh màn hình app Edi Parent, có "Phần Thông tin"/"Phần dặn dò" | bài đã học từng môn + bài cô giao + nhắc nhở (`11` §4) |
| `TEACHER_NOTE` (nhận xét/sổ liên lạc) | chữ cô, ngày, không có bài | nhận xét → kỹ năng + outcome `OBSERVED` |
| `NAVIO_REPORT` | giao diện NAVIO (unit, stars, %) | unit, điểm hoạt động |
| `KIDSAZ_REPORT` | giao diện Raz-Kids/Kids A-Z (level chữ cái, sách, quiz) | level, sách đọc, điểm quiz |
| `OTHER` | không phải bài học | bỏ qua, nêu lý do |

### 2.2 Xử lý đặc thù

- **Ảnh chứa cả hai bé** (vở khác nhau cùng ảnh): AI tách theo tên trên nhãn vở; không chắc → `NEEDS_REVIEW`.
- **Chữ viết tay tiếng Việt** của trẻ lớp 1: yêu cầu model "đọc theo ngữ cảnh bài", nêu `confidence` từng item; item `< 0.6` hiện màu vàng khi duyệt.
- **Không có dấu chấm của cô**: AI tự chấm theo đáp án chuẩn nhưng đánh dấu `gradedBy=AI` để phụ huynh biết.
- **Câu để trống ≠ câu sai.** Rất thường gặp: con làm dở phiếu (ví dụ Exercise 1 khoanh đủ 6 câu, Exercise 2 chỉ viết 2/6, Exercise 3 chỉ chọn câu đầu). AI phải trả `outcome=BLANK` cho ô trống và **không** suy ra là sai. Quy tắc diễn giải:
  - Trống **liên tiếp về cuối phiếu/cuối bài tập** → nhiều khả năng *chưa làm xong* → tạo `Evidence` với `weight × 0.3` và ghi chú "chưa làm xong", hoặc bỏ qua nếu ba mẹ chọn vậy.
  - Trống **rải rác giữa các câu đã làm** → nhiều khả năng *không biết làm* → bằng chứng `INCORRECT` nhẹ (`score=0`, `weight × 0.6`), gắn kỹ năng để đưa vào luyện.
  - Màn hình duyệt hiển thị hai nhóm này khác màu, ba mẹ đổi được bằng một chạm ("con chưa làm" / "con không biết làm").
- **Trùng ảnh** (chụp 2 lần): hash ảnh (pHash) → cảnh báo trùng trong 7 ngày.
- Lưu ảnh gốc mãi mãi (xem lại bằng chứng), ảnh gửi AI là bản nén.

### 2.3 Học từ sửa của phụ huynh

Mỗi lần phụ huynh sửa nhãn kỹ năng hoặc đúng/sai, lưu cặp (văn bản item, nhãn AI, nhãn đúng). `INTAKE_MAP` lấy 10 cặp gần nhất cùng môn làm few-shot. Sau 50 cặp, chạy eval lại (04 §9) và cân nhắc tinh chỉnh prompt.

## 3. Kênh B — Kết quả bài luyện

- Mỗi `Attempt` → 1 `Evidence` cho mỗi kỹ năng của bài (theo `ExerciseSkill.weight`).
- Ghi thêm tín hiệu hành vi: `timeMs` bất thường (quá nhanh < 2 s = đoán bừa → weight × 0.5; quá lâu > 90 s = khó/mất tập trung → ghi chú), số gợi ý.
- Bài mở (đọc to, nói, viết chụp) chỉ thành bằng chứng khi đã chấm.
- **Phiên chẩn đoán** (04 §10) là kênh B ở chế độ adaptive, dùng để khởi tạo.

## 4. Kênh C — Nội dung học (soạn ngoại tuyến)

> Từ 10/09/2026 kênh này **không đi qua giao diện app** mà do Claude Code soạn trong repo rồi nạp DB — quy trình đầy đủ ở `10-NAP-NOI-DUNG.md`. Phần dưới giữ lại vì mô tả *tài liệu nào cần nạp* và *rút ra cái gì*; phần "pipeline" là việc Claude Code làm, không phải worker của app.

### 4.1 Nạp gì

| Tài liệu | Cách nạp | Dùng cho |
|---|---|---|
| Sách/vở bài tập ESL (Macmillan đi kèm NAVIO), sách English Maths, English Science | Chụp ảnh từng trang unit hoặc PDF (nếu có) | `LessonUnit` với từ vựng/khái niệm/dạng bài → sinh bài bám giáo trình |
| SGK/SGV Tiếng Việt 1, Toán 1 (bộ **Kết nối tri thức với cuộc sống**) | **Đã có** SGV Toán 1 (cả năm) và SGV Tiếng Việt 1 tập hai dạng PDF quét trong `sach giao khoa/` — xem `09-GIAO-TRINH-TRUONG.md`; còn thiếu Tiếng Việt tập một và SGK học sinh | `LessonUnit` + `expectedWeek` + đáp án (từ SGV) |
| Chương trình khung / kế hoạch học kỳ của trường (nếu trường gửi) | PDF | lịch unit theo tuần → tự đánh dấu "tuần này" |
| Thông báo tuần của lớp (Zalo/ClassDojo/email) | Chụp/dán văn bản | AI đọc "tuần này học Unit 3, từ vựng…" → đề xuất unit tuần này + kỹ năng ưu tiên |
| Danh sách sight words, bảng vần lớp 1 | Ảnh/CSV | mở rộng bản đồ kỹ năng |

### 4.2 Pipeline

```
PDF/ảnh → tách trang (pdf → ảnh 150dpi; PDF quét không có lớp chữ nên luôn đi đường Vision) → UNIT_EXTRACT theo batch 8–10 trang có overlap 1 trang
        → nếu Material đã có LessonUnit khung (seed từ 09) thì khớp theo số trang, không tạo unit mới
        → LessonUnitDraft[] (title, objectives, vocabulary, concepts, sampleTasks, pageFrom/To)
        → gộp draft trùng tên qua các batch → full-text searchSkills → gắn kỹ năng (top-5 + Claude Code chọn)
        → phụ huynh duyệt (sửa tên, gộp/tách, gắn tuần) → LessonUnit.isApproved
```

- Văn bản trích được lưu để RAG khi sinh bài; ảnh trang lưu để phụ huynh xem lại. Không hiển thị ảnh sách cho con (bản quyền + không cần).
- Bản quyền: tài liệu dùng nội bộ gia đình, không chia sẻ ra ngoài; ghi rõ trong README.

## 5. Thói quen gia đình được đề xuất (để dữ liệu chảy đều)

| Khi nào | Việc | ≈ thời gian |
|---|---|---|
| Tối, sau khi con học ở trường về (T2–T6) | Con làm Daily Quest 15 phút (ba mẹ ngồi cạnh 5 phút đầu, tuần đầu) | 15 phút/bé |
| Mỗi tối T2–T6 | Dán/chụp nhật ký lớp trên Edi Parent (`11`) | 20 giây |
| Mỗi tối có phiếu/vở bài tập mới | Chụp phiếu bài tập, trang vở con vừa làm (2–6 ảnh) | 1 phút |
| Tối T3 & T6 | Chụp thêm vở bài tập + bài chấm của cô tuần đó (10–15 ảnh) | 3 phút |
| Tối CN | Đọc báo cáo tuần; duyệt kế hoạch tuần sau; chụp thông báo tuần của lớp | 10 phút |
| Cuối mỗi unit ESL / mỗi 2 tuần | Chụp màn hình tiến độ NAVIO & Kids A-Z | 2 phút |
| Đầu học kỳ | Nạp sách/giáo trình các môn | 30–60 phút |

Hệ thống nhắc nhẹ (thông báo PWA / email) khi > 5 ngày không có intake mới.

## 6. Bảo vệ dữ liệu ở kênh đầu vào

- Ảnh chụp có thể chứa tên đầy đủ, mã học sinh, ảnh bạn khác → khi gửi AI chỉ gửi ảnh cần thiết; prompt yêu cầu **không trích thông tin cá nhân ngoài nội dung bài học**; kết quả trích không lưu tên bạn khác.
- Cho phép phụ huynh **che vùng** trên ảnh trước khi gửi (công cụ bôi đen đơn giản) — P1.
- Xoá 1 intake → xoá file + bằng chứng phái sinh, tính lại mastery (`RECALC`).
