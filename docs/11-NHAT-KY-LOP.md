# 11 — NHẬT KÝ LỚP HẰNG NGÀY (EDI PARENT)

> Nguồn dữ liệu **giá trị nhất và rẻ nhất** của cả hệ thống: mỗi ngày GVCN lớp 1B3 đăng lên app **Edi Parent** một bài gồm *Phần Thông tin* (hôm nay học bài gì, từng môn) và *Phần dặn dò* (bài tập về nhà, nhắc nhở). Tài liệu này định nghĩa cách nạp, cách hiểu, và ba việc hệ thống làm với nó.

---

## 1. Bản ghi mẫu (10/09/2026, lớp 1B3)

```
Phần Thông tin
Hôm nay, con đã tham gia các hoạt động học tập của các môn học:
- Tiếng Việt: Bài 13: U u – Ư ư
- ESL: Unit 1 - Lesson 16 - Unit Review: Con ôn tập từ vựng và ngữ pháp Unit 1:
       family members, adjectives, have, to be
- Toán: Các số 6,7,8,9,10 (Tiếp)

Phần dặn dò
1. Tiếng Việt:
   + Con luyện đọc 5 lần Bài 13 - trang 38, 39.
   Cô khuyến khích con quay video luyện đọc các tiếng, từ và câu trong mục 2 và mục 4
   – Bài 13: U u - Ư ư (SGK Tiếng Việt tập 1, trang 38,39) tại bài tập được giao trong
   Teams – Chương trình Việt
2. ESL: Con hoàn thành phiếu bài tập
3. Đồng phục: Ngày mai, con mặc quần áo tự do, đi giày/ dép có quai.

Trân trọng,
GVCN lớp 1B3
```

## 2. Vì sao nguồn này quan trọng

| Việc hệ thống cần | Trước đây phải làm | Có nhật ký lớp |
|---|---|---|
| Biết **hôm nay con học bài nào** | Đoán theo `expectedWeek` suy ra từ số tiết trong SGV (`09`) | **Biết chính xác từng ngày, từng môn** — Daily Quest tối nay luyện đúng bài sáng nay học |
| Biết **cô giao bài gì** | Không có | Nhiệm vụ cụ thể, có số lần, có trang, có hạn |
| Biết **ESL đang học gì** | Chưa có sách ESL nào | Unit/Lesson + nội dung ("family members, adjectives, have, to be") — dựng dần được chương trình ESL |
| Biết **lịch năm học thật** | Giả định tuần 1 = 08/09/2026 | Suy ngược từ chuỗi bài: xem §5 |
| Biết **nhắc nhở phi học tập** | — | Đồng phục, đồ dùng… (không vào năng lực, chỉ hiện cho ba mẹ) |

Chi phí gần như bằng 0: một bài đăng chỉ vài trăm chữ, đọc bằng model rẻ; nếu dán được văn bản thì không tốn vision.

## 3. Cách nạp

Theo thứ tự ưu tiên:

1. **Dán văn bản** (rẻ nhất, chính xác nhất) — nếu Edi Parent cho chọn/sao chép: mẹ/ba dán vào ô "Nhật ký lớp hôm nay" trên app (một ô lớn + nút Lưu), hoặc chia sẻ sang app.
2. **Chụp màn hình** — ảnh vào đúng pipeline intake sẵn có (`07` §2) với `docType = CLASS_DIARY`; một bài dài có thể 2–3 ảnh nối nhau, hệ thống ghép theo thứ tự.
3. **Tự động (P2)** — nếu Edi Parent có bản web đăng nhập được, dùng trình duyệt lấy bài mới mỗi tối. Chỉ làm khi đã chạy ổn và chủ dự án xác nhận có bản web.

Nạp trùng một ngày → cập nhật bản ghi cũ, không tạo thêm.

## 4. Rút ra gì — bộ đọc theo mẫu trước, AI (hàng chờ) sau

> ADR-10: phần "Thông tin" và các dặn dò theo mẫu được **đọc ngay trong app bằng quy tắc** (regex + bảng tên môn + so khớp tên bài); chỉ đoạn không khớp mẫu mới vào hàng chờ cho Claude Code. Schema kết quả giữ nguyên như dưới.

Đầu vào: văn bản (hoặc ảnh) + ngày + danh sách môn + bản đồ kỹ năng + danh sách `LessonUnit` đã biết.
Đầu ra `ClassDiaryExtraction`:

```jsonc
{
  "date": "2026-09-10",
  "taught": [
    { "subject": "VIET",  "lessonRefText": "Bài 13: U u – Ư ư",
      "lessonUnitCode": "KNTT-TV1-T1-B13", "pages": [38,39],
      "skillCodes": ["VIET.HV.AM_U_UW", "VIET.DOC.DOC_TIENG"] },
    { "subject": "ESL",   "lessonRefText": "Unit 1 - Lesson 16 - Unit Review",
      "unit": 1, "lesson": 16,
      "content": "family members, adjectives, have, to be",
      "skillCodes": ["ESL.VOC.FAMILY", "ESL.GR.HAVE_HAS", "ESL.GR.IS_ARE"] },
    { "subject": "VMATH", "lessonRefText": "Các số 6,7,8,9,10 (Tiếp)",
      "lessonUnitCode": "KNTT-T1-B02", "skillCodes": ["VMATH.SO.SO_6_10"] }
  ],
  "homework": [
    { "subject": "VIET", "taskType": "READ_ALOUD", "repeatCount": 5,
      "text": "Luyện đọc 5 lần Bài 13 - trang 38, 39", "pages": [38,39],
      "skillCodes": ["VIET.DOC.DOC_TIENG"], "optional": false },
    { "subject": "VIET", "taskType": "VIDEO_SUBMIT",
      "text": "Quay video luyện đọc mục 2 và mục 4 — Bài 13, nộp ở Teams",
      "optional": true, "submitTo": "Teams – Chương trình Việt" },
    { "subject": "ESL",  "taskType": "WORKSHEET", "text": "Hoàn thành phiếu bài tập" }
  ],
  "reminders": [
    { "kind": "UNIFORM", "text": "Ngày mai mặc quần áo tự do, đi giày/dép có quai",
      "forDate": "2026-09-11" }
  ],
  "confidence": 0.93
}
```

Quy tắc rút:
- **Một nhật ký lớp → bài cô giao cho từng bé.** Nhật ký là của lớp 1B3, nhưng `Homework` gắn `studentId`; hệ thống tạo **một bản cho mỗi bé trong lớp** (Thy và Thanh) để mỗi bé có tiến độ riêng (Thy đọc 5/5, Thanh mới 2/5).
- **Môn** chuẩn hoá về enum 6 môn cốt lõi; môn ngoài (Nghệ thuật, GDTC…) vẫn ghi `taught` nhưng `skillCodes` rỗng.
- **Khớp bài học**: ưu tiên khớp `lessonUnitCode` với `LessonUnit` đã có; không khớp thì giữ nguyên `lessonRefText` và tạo unit tạm `isApproved=false` để ba duyệt sau.
- **Gắn kỹ năng**: theo bản đồ kỹ năng + nội dung mô tả; ESL dựa vào phần "Con ôn tập…" vì chưa có sách.
- `taskType`: `READ_ALOUD | WRITE | WORKSHEET | VIDEO_SUBMIT | ONLINE_APP | BRING_ITEM | OTHER`; `optional=true` khi cô dùng chữ "khuyến khích".
- **Nhắc nhở phi học tập** (`UNIFORM`, `BRING`, `EVENT`, `SCHEDULE`) không sinh bằng chứng, chỉ hiện trên dashboard ba mẹ và nhắc đúng ngày.

## 5. Hiệu chỉnh lịch năm học

Chuỗi bài theo ngày cho biết **tốc độ thật của lớp**. Ví dụ ngày 10/09/2026 lớp đã học *Tiếng Việt bài 13* và *Toán bài 2 (tiếp)* — với nhịp Tiếng Việt ~1 bài/ngày thì lớp đã học khoảng 13 buổi, tức **khai giảng sớm hơn giả định 08/09/2026** trong `03` §4. Hệ thống làm hai việc:

1. **Suy ngược ngày bắt đầu**: từ số bài đã học và nhịp bài/tuần → đề xuất `SchoolWeek.dateFrom` của tuần 1; ba xác nhận một lần trong `/parent/school`.
2. **Cập nhật `expectedWeek`**: mỗi lần nhật ký khớp một `LessonUnit`, ghi `actualTaughtDate`; sai lệch > 2 tuần so với `expectedWeek` → cảnh báo trong admin để chỉnh lộ trình mong đợi (dashboard `05`/`09` dùng lộ trình này).

Sau vài tuần, lộ trình mong đợi trở thành **lịch thật của lớp**, không còn là ước lượng.

## 6. Ba việc hệ thống làm với nhật ký

### 6.1 Lái Daily Quest theo bài học hôm nay (giá trị lớn nhất)

Planner (`04` §4) đổi nguồn "bài đang học": ưu tiên `DiaryLesson` trong **3 ngày gần nhất** thay vì suy từ `expectedWeek`. Cụ thể:
- Phần "trọng tâm" (50%) ưu tiên kỹ năng của bài **học sáng nay**, rồi tới điểm yếu.
- Phần "mới" (20%) lấy kỹ năng bài hôm nay chưa có bằng chứng.
- Nếu tối nay không có nhật ký (chưa nạp), rơi về cách cũ theo TKB + `expectedWeek` — không bao giờ chặn phiên học.

### 6.2 "Bài cô giao" — nhiệm vụ riêng trong Góc của con

Mỗi `Homework` gắn được với dạng bài trong app thì thành **một trạm đặc biệt đứng đầu bản đồ nhiệm vụ**, có huy hiệu riêng "Xong bài cô giao":

| Cô giao | App làm gì |
|---|---|
| Luyện đọc 5 lần Bài 13 trang 38–39 | Trạm `READ_ALOUD` lặp 5 lượt, mỗi lượt một hàng tiếng/từ trong bài; đếm 1/5 → 5/5 bằng 5 ngôi sao; chấm phát âm, đánh dấu tiếng đọc sai để luyện thêm |
| Quay video luyện đọc mục 2 và mục 4 | Nút "Quay cho cô": ghi video ngay trong app, lưu vào thư mục kết quả để ba mẹ **tải lên Teams**; app không tự nộp |
| Hoàn thành phiếu bài tập ESL | Nhiệm vụ ngoài app: hiện checklist cho ba mẹ tick; kèm gợi ý "luyện thêm 5 bài về family members" từ ngân hàng bài |
| Nhắc đồng phục, mang đồ | Chỉ hiện cho ba mẹ (thẻ nhắc sáng hôm sau), **không** hiện cho con |

Con làm xong "Bài cô giao" mới mở phần luyện của hệ thống — vừa đúng thứ tự ưu tiên, vừa khiến app trở thành nơi ba mẹ mở hằng ngày.

### 6.3 Dựng chương trình ESL dần dần

Chưa có sách ESL, nhưng mỗi ngày nhật ký cho một mảnh (Unit, Lesson, nội dung). Sau vài tuần hệ thống có bảng "Unit 1: Lesson 1…16 — từ vựng family members, adjectives; ngữ pháp have/to be" → đủ để soạn `LessonUnit` ESL và ngân hàng bài luyện ESL bám đúng lớp, **không cần chờ mua sách**. Đây là cách rẻ nhất để lấp khoảng trống ESL/ENL.

## 7. Thói quen nạp (thêm vào `07` §5)

| Khi nào | Việc | ≈ thời gian |
|---|---|---|
| Mỗi tối T2–T6, khi đọc Edi Parent | Dán/chụp bài đăng của cô vào app | 20 giây |
| Nếu quên vài ngày | Nạp bù nhiều ngày một lượt, hệ thống tự tách theo ngày | 1 phút |

Nhắc nhẹ lúc 19:00 nếu hôm đó chưa có nhật ký (tắt được).

## 8. Riêng tư

Bài đăng là thông tin chung của lớp, không chứa dữ liệu bạn khác. Nếu ảnh chụp có tên/ảnh học sinh khác → prompt yêu cầu bỏ qua, không lưu. Không đăng lại nội dung của cô ra ngoài phạm vi gia đình.

---

## 9. Ví dụ đọc thật một phiếu bài tập ESL (chuẩn để hiệu chỉnh)

Phiếu `GS1 – UNIT 1 – REVIEW UNIT 1` của Mai Thy, chụp 10/09/2026 — dùng làm ca kiểm thử bắt buộc ở pha 4.

| Bài | Nội dung | Con làm | Đọc ra |
|---|---|---|---|
| Ex1. Look and circle (6 câu) | chọn từ đúng theo tranh: uncle/aunt, pets/baby, parents/grandpa, parents/grandparents, uncle/baby, twins/pets | khoanh gần đủ, các câu khoanh đều đúng | `ESL.VOC.FAMILY` **nhận biết từ: tốt** |
| Ex2. Look and unscramble (6 câu) | xếp chữ cái thành tính từ, cho sẵn chữ đầu: old, young, tall, funny, kind, smart | viết đúng câu 1 (`old`) và 2 (`young`); **câu 3–6 để trống** | `ESL.VOC.ADJECTIVES` + kỹ năng **viết/đánh vần từ**: trống 4 câu liên tiếp về cuối bài → nhãn `BLANK`, ghi "có thể chưa làm xong", chờ ba mẹ xác nhận |
| Ex3. Circle to choose (6 câu) | ngữ pháp have/has, am/is/are, phủ định | chỉ chọn câu 1 (`has` — đúng), 5 câu còn trống | `ESL.GR.HAVE_HAS`, `ESL.GR.IS_ARE` — chưa đủ dữ liệu, `BLANK` |
| Ex4. Read and match (6 người ↔ tính từ) | đọc đoạn "This is my family…" rồi nối | nối được 1 (grandma → funny) | `ENL.RL.KEY_DETAILS` + `ESL.VOC.ADJECTIVES`, `BLANK` phần còn lại |
| Draw and write (trang sau) | vẽ gia đình + điền "Hello, I'm…, This is my…" | đang làm dở, đã viết được vài dòng | `ENL.W.SENTENCE` — ghi nhận hoạt động, không chấm đúng/sai |

**Kết luận hệ thống rút ra:** với Mai Thy, *nhận biết* từ vựng gia đình đã vững, nhưng *viết được từ* (unscramble) và *ngữ pháp have/has – to be* chưa có bằng chứng đủ. Đề xuất cho phiên tối: 4 bài `ESL.VOC.ADJECTIVES` dạng ghép chữ cái (dễ → khó), 4 bài `ESL.GR.HAVE_HAS`/`IS_ARE` dạng chọn A/B **giống hệt Ex3 của phiếu**, 2 bài `ESL.VOC.FAMILY` để giữ nhịp. Ba mẹ nhận gợi ý: "Tối nay ngồi cùng con làm nốt Exercise 2–4 của phiếu, con còn để trống."

**Bài học cho thiết kế** (đã đưa vào `07` §2.2 và `10` §6): (a) **trống ≠ sai** — phải tách hai nhãn, nếu không hệ thống sẽ kết luận sai về con ngay ngày đầu; (b) ngân hàng bài nên có đúng 5 dạng phiếu của trường (`Look and circle`, `Look and unscramble`, `Circle to choose`, `Read and match`, `Draw and write`) để con luyện trên app thấy quen tay khi vào lớp.
