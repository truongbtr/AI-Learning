# 10 — NẠP NỘI DUNG BẰNG CLAUDE CODE ("CONTENT STUDIO")

> **Quyết định kiến trúc (10/09/2026, ADR-9).** Nội dung học — bài học theo sách và ngân hàng bài luyện — **không sinh lúc chạy** mà được **Claude Code soạn sẵn ngoại tuyến trong repo, kiểm định, rồi nạp vào database**. App chỉ đọc dữ liệu đó ra cho con luyện. Tài liệu này định nghĩa quy trình, định dạng file và lệnh nạp.

---

## 1. Vì sao tách "sản xuất nội dung" khỏi "chạy ứng dụng"

| | Sinh lúc chạy (thiết kế cũ) | Soạn sẵn bằng Claude Code (chốt) |
|---|---|---|
| Chất lượng | Model chỉ thấy mô tả kỹ năng, sinh 6 bài một lượt, không ai đọc lại | Claude Code đọc **cả cuốn sách**, đối chiếu mục tiêu và đáp án trong SGV, tự chạy validator, sửa, lặp lại đến khi đạt |
| Chi phí AI | Tốn nhất hệ thống, lặp lại mỗi ngày | Trả một lần cho mỗi bài; dùng lại cho cả hai bé, cả năm sau |
| Độ trễ khi con học | 10–20 giây chờ sinh phiên | 0 — chọn bài từ DB bằng truy vấn |
| Kiểm soát của ba mẹ | Chỉ thấy bài sau khi con đã gặp | Xem trước file JSON, `git diff`, duyệt trong admin trước khi con thấy |
| Độ phức tạp app | Worker sinh bài, pre-generate, ngân sách token, retry schema | Bỏ hết; app chạy được cả khi **không có khoá AI** |
| Rủi ro | Bài sai/lệch chương trình lọt tới con | Sai sót bị chặn ở bước kiểm định, sửa trong file, nạp lại |

**Đánh đổi phải chấp nhận:** bài trong ngân hàng là *chung*, không sinh riêng theo lỗi vừa mắc của từng bé. Bù lại bằng ba cơ chế ở §7 (biến thể chủ đề, chỗ trống cá nhân hoá, thẻ lỗi) — đủ cho lớp 1, nơi tập bài tập vốn hữu hạn và lặp lại là điều tốt.

## 2. Ranh giới: cái gì ngoại tuyến, cái gì trong app

**Ngoại tuyến — Claude Code làm trong repo (không cần app chạy):**
1. Bản đồ kỹ năng (`content/skill-map/`) — đã có từ pha 1.
2. Bài học theo sách (`content/lessons/`) — đọc SGV/SGK trong `sach giao khoa/`.
3. Ngân hàng bài luyện (`content/exercises/`) — nguồn chính con luyện hằng ngày.
4. Thư viện hình vật thể và nhãn (`content/art/objects/`), kịch bản audio cần thu/sinh sẵn.
5. Nạp lô lớn ảnh bài vở cũ (đầu học kỳ, cả tập vở) — xem §8.

**Trong app — KHÔNG có AI (ADR-10, `13-HANG-CHO-AI.md`).** Những việc dưới đây trước đây dự định gọi API, nay cũng đi qua hàng chờ cho Claude Code:
1. Đọc ảnh bài vở hằng tuần mẹ/ba chụp (`INTAKE_EXTRACT`, `INTAKE_MAP`) — kênh chính, giữ nguyên pha 4.
2. Chấm bài mở: đọc to, nói đáp, ảnh bài viết tay (`GRADE`).
3. Báo cáo tuần (`REPORT`), trợ lý phụ huynh (`ASSIST_PARENT`), gia sư giọng nói (`ASSIST_KID`).
4. *(Tuỳ chọn, mặc định TẮT)* `EXERCISE_GEN` sinh bù khi ngân hàng cạn cho một kỹ năng — chỉ để phòng hờ, bật trong `/admin/ai`.

**Không dùng AI lúc chạy:** chọn kỹ năng, lập phiên, chấm bài đóng, tính mastery — thuần thuật toán (`04` §3–4).

## 3. Cấu trúc thư mục nội dung

```
content/
├─ skill-map/           <mon>.json          — bản đồ kỹ năng (pha 1)
├─ timetable/           1B3-2026.json
├─ lessons/
│   ├─ vmath/           KNTT-T1-B01.json … B41.json
│   ├─ viet/            KNTT-TV1-T2-CD1-B01.json …
│   └─ esl/             (khi có sách)
├─ exercises/
│   ├─ vmath/           SO.CONG_PV_10.pack.json  (một file / một kỹ năng)
│   ├─ viet/            HV.VAN_AN_AT.pack.json
│   ├─ emath/  esci/  esl/  enl/
├─ art/                 STYLE.md, objects/, manifest.json      (pha 3)
└─ _reports/            báo cáo kiểm định mỗi lô (Claude Code ghi)
```

Mọi file JSON **vào git** (nội dung do mình soạn, dung lượng nhỏ, cần lịch sử thay đổi). Riêng `sach giao khoa/` không vào git.

## 4. Định dạng file

### 4.1 Bài học — `content/lessons/<mon>/<code>.json`

```jsonc
{
  "code": "KNTT-T1-B10",
  "subject": "VMATH",
  "title": "Bài 10. Phép cộng trong phạm vi 10",
  "book": { "name": "Toán 1 — SGV — Kết nối tri thức", "file": "01-sgv-toan-1.pdf", "pageFrom": 39, "pageTo": 47 },
  "periods": 6,
  "weekFrom": 9, "weekTo": 10,
  "objectives": ["Nhận biết ý nghĩa của phép cộng…", "…"],
  "vocabulary": ["cộng", "bằng", "tất cả", "dấu +"],
  "concepts": ["gộp hai nhóm", "đếm tiếp", "cộng với 0"],
  "sampleTasks": [
    { "text": "Có 3 con cá và 2 con cá. Có tất cả mấy con cá?", "answer": "5", "type": "tranh" }
  ],
  "answerKeyNotes": "Đáp án bài luyện tập trang 46: …",
  "skills": [{ "code": "VMATH.SO.CONG_PV_10", "weight": 1 }, { "code": "VMATH.SO.CONG_VOI_0", "weight": 0.4 }],
  "source": { "extractedBy": "claude-code", "at": "2026-09-20", "verified": true }
}
```

### 4.2 Gói bài luyện — `content/exercises/<mon>/<SKILL_CODE>.pack.json`

```jsonc
{
  "skillCode": "VMATH.SO.CONG_PV_10",
  "generatedBy": "claude-code",
  "promptVersion": "exercise-gen-v1",
  "lessonRefs": ["KNTT-T1-B10", "KNTT-T1-B12"],
  "exercises": [
    {
      "id": "vmath-cong10-0007",                 // ổn định, dùng làm contentHash gốc
      "type": "MCQ",
      "language": "vi",
      "difficulty": 2,
      "skillCodes": ["VMATH.SO.CONG_PV_10"],
      "assetTheme": "neutral",                    // neutral | robot | garden
      "targetsError": null,                        // hoặc "quen_nho", "nham_dau_cong_tru"
      "prompt": { "text": "{ten} có 3 {vat} và 2 {vat} nữa. Tất cả mấy {vat}?", "tts": true },
      "choices": [{ "id":"a","text":"4" },{ "id":"b","text":"5" },{ "id":"c","text":"6" }],
      "answerKey": "b",
      "hints": ["Đếm tiếp từ 3: 4, 5.", "Gộp 3 và 2 lại xem được mấy?"],
      "explanation": "3 cộng 2 bằng 5.",
      "meta": { "estSeconds": 25, "lessonUnitCode": "KNTT-T1-B10", "sourceRef": "SGV tr.41" }
    }
  ]
}
```

Trường `spec` khi nạp vào DB dựng từ chính object này theo `ExerciseSpec` (`04` §5). `id` trong file là khoá bất biến: sửa nội dung bài → giữ `id`, hệ thống cập nhật tại chỗ; xoá `id` khỏi file → bài bị đánh dấu `retired` chứ không xoá (giữ lịch sử bằng chứng).

## 5. Quy trình 5 bước

```
① ĐỌC SÁCH        Claude Code đọc PDF trong sach giao khoa/ theo bài
                   (pdftoppm → ảnh trang → đọc; SGV quét nên phải nhìn ảnh)
                          ↓
② SOẠN             Ghi content/lessons/<...>.json và content/exercises/<...>.pack.json
                   theo bản đồ kỹ năng + mục tiêu + đáp án trong sách
                          ↓
③ TỰ KIỂM          pnpm content:validate   (Zod, trùng lặp, độ khó, phủ dạng bài…)
                   + Claude Code tự đọc lại theo rubric §6, sửa, chạy lại đến khi sạch
                   → ghi content/_reports/<lo>.md
                          ↓
④ NẠP              pnpm content:import --dir content/exercises/vmath
                   upsert theo id/code, ghi ContentBatch, không đụng dữ liệu học của con
                          ↓
⑤ DUYỆT            /admin/content: xem lô vừa nạp, xem thử từng bài đúng như con thấy,
                   gắn cờ GOOD/BAD, bật "phát hành" → planner mới được dùng
```

Bài chưa phát hành (`status=draft`) không bao giờ vào phiên học của con.

## 6. Rubric chất lượng (Claude Code tự chấm ở bước ③)

Mỗi bài phải đạt **tất cả**:

1. **Đúng kỹ năng** — chỉ đo kỹ năng đã khai, không lẫn kỹ năng khác (bài cộng trong 10 không được yêu cầu đọc hiểu dài).
2. **Đúng trình độ lớp 1** — số/từ nằm trong phạm vi bài đã học tính đến `weekTo`; không dùng kiến thức tuần sau.
3. **Đề ngắn** — tiếng Việt ≤ 20 chữ, tiếng Anh ≤ 8 từ; một câu hỏi, một việc phải làm.
4. **Đáp án đúng và duy nhất** — Claude Code tự giải lại độc lập; phương án nhiễu sai rõ ràng nhưng hợp lý (phản ánh lỗi thật của trẻ: đếm thiếu 1, nhầm dấu).
5. **Gợi ý là gợi ý** — không tiết lộ đáp án; gợi ý 1 chỉ hướng cách làm, gợi ý 2 cụ thể hơn.
6. **Giải thích ≤ 20 chữ**, giọng thân thiện, đọc to lên nghe tự nhiên.
7. **Bám sách** — có `lessonUnitCode` và `sourceRef` khi kỹ năng thuộc bài đã có trong `content/lessons/`.
8. **Không trùng** — khác mọi bài còn lại trong gói về cả số liệu lẫn ngữ cảnh (không phải chỉ đổi con số).
9. **An toàn** — không bạo lực, không so sánh trẻ, không nhắc tên riêng ngoài chỗ trống `{ten}`, không thương hiệu.
10. **Đủ dữ liệu render** — mọi `ImageRef` trỏ tới vật thể có thật trong `content/art/objects/manifest.json`.
11. **Nhiễu có chẩn đoán** — bài Toán và bài âm/vần Tiếng Việt dạng chọn phải có **≥ 1 phương án sai mang `errorTag`** từ bộ mã chuẩn (`04` §11.1–11.2); `targetsError` cũng chỉ được dùng mã trong bộ này. Mỗi kỹ năng có ≥ 6 bài `scaffold: "model"` (mascot làm mẫu) và ≥ 6 bài đối chiếu cặp dễ nhầm.

Validator tự động bắt được 1 (một phần), 3, 4 (định dạng), 8, 10; các mục còn lại Claude Code đọc và tự chấm, ghi kết quả vào báo cáo lô.

## 7. Cá nhân hoá dù bài dùng chung

1. **Chỗ trống thay lúc hiển thị:** `{ten}` → tên gọi ở nhà, `{vat}` → vật thể theo thế giới của bé (Chí Thanh: bánh răng, tên lửa; Mai Thy: bông hoa, ngôi sao), `{ban}` → tên nhân vật mascot. App thay bằng bảng tra, không cần AI.
2. **Biến thể chủ đề:** bài có ngữ cảnh sinh 2 bản `assetTheme: robot | garden`; planner chọn bản hợp với thế giới của bé.
3. **Thẻ lỗi:** bài nhắm đúng lỗi thường gặp gắn `targetsError`. Khi ảnh bài vở cho thấy con hay nhầm b/d, planner ưu tiên bài có `targetsError: "nham_b_d"` — trúng đích mà không cần sinh mới.

Ba cơ chế này nằm ở tầng chọn bài và hiển thị, nên nội dung vẫn dùng chung cho cả hai bé.

## 8. Nạp lô lớn ảnh bài vở bằng Claude Code (bổ trợ cho app)

Dùng khi nạp cả tập vở cũ, cả xấp bài kiểm tra đầu học kỳ — nhanh và rẻ hơn chụp từng lần trên điện thoại:

```
① Ba chép ảnh vào  intake-inbox/<ten-be>/<ngay>/*.jpg
② Claude Code đọc, viết intake-inbox/<...>/ket-qua.json (đúng schema IntakeExtraction)
③ pnpm content:import-intake --dir intake-inbox/thy/2026-09-20
   → tạo IntakeResult ở trạng thái PENDING_REVIEW
④ Ba mẹ duyệt trên app như bình thường (P6) → thành Evidence
```

Việc chụp hằng tuần vẫn đi đường app (pha 4) — mẹ không phải mở máy tính.

## 9. Quy mô & lịch sản xuất

| Đợt | Khi nào | Nội dung | Ước lượng |
|---|---|---|---|
| Đợt 1 (pha 2) | trước khi làm giao diện con | 25–30 kỹ năng đang học tuần này–tuần 12 (Toán B1–B12, Tiếng Việt học vần, ESL nền), **40 bài/kỹ năng** | ~1.100 bài |
| Đợt 2 (pha 6) | sau khi app chạy ổn | phủ hết học kỳ 1 cả 6 môn, 40–60 bài/kỹ năng | ~2.000 bài |
| Đợt 3 | trước học kỳ 2 (tháng 1) | học kỳ 2, có Tiếng Việt tập hai | ~1.500 bài |
| Bổ sung | hằng tháng | kỹ năng con yếu cần thêm bài, kỹ năng bank cạn | 100–300 bài |

Tổng ~4.500–5.000 bài là dư cho cả năm với hai bé (mỗi bé ~15 bài/ngày, có lặp lại ôn tập theo lịch spaced repetition — lặp lại là mục đích chứ không phải khuyết điểm).

## 10. Lệnh CLI (`packages/content`)

| Lệnh | Việc |
|---|---|
| `pnpm content:validate [--dir …]` | Kiểm định định dạng, trùng lặp, tham chiếu kỹ năng/bài học/vật thể; xuất báo cáo |
| `pnpm content:import [--dir …] [--dry-run]` | Nạp/cập nhật vào DB, ghi `ContentBatch`; `--dry-run` in ra thay đổi mà không ghi |
| `pnpm content:export --skill <code>` | Xuất ngược từ DB ra file (khi sửa trong admin) |
| `pnpm content:stats` | Bảng: mỗi kỹ năng có bao nhiêu bài, theo dạng và độ khó, chỗ nào thiếu |
| `pnpm content:import-intake --dir …` | §8 |

`content:stats` là công cụ chính để biết cần soạn thêm ở đâu — Claude Code chạy nó trước mỗi đợt.

## 11. An toàn dữ liệu

- Nạp nội dung **chỉ đụng** bảng `Skill`, `LessonUnit`, `Exercise`, `ExerciseSkill`, `ContentBatch`. Không bao giờ chạm `Evidence`, `SkillMastery`, `Session`, `Attempt` — dữ liệu học của con.
- Mọi lần nạp ghi `ContentBatch` (ai, khi nào, file nào, thêm/sửa/nghỉ hưu bao nhiêu) → hoàn tác được bằng `content:import` bản trước.
- `--dry-run` là bắt buộc trong tài liệu vận hành trước mỗi lần nạp lô lớn.
