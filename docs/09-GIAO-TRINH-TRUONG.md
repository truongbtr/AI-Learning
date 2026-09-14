# 09 — GIÁO TRÌNH THỰC TẾ CỦA TRƯỜNG (KHO `sach giao khoa/`)

> Kiểm kê tài liệu chủ dự án đã nạp vào `sach giao khoa/`, cấu trúc bài học rút từ mục lục, và ánh xạ sang bản đồ kỹ năng (`05`) để: (a) pha 1 gán `expectedWeek` và tên bài SGK cho kỹ năng Toán/Tiếng Việt; (b) pha 6 nạp thành `Material` → `LessonUnit` với `code` đúng theo bảng dưới. Cập nhật khi có thêm sách.

---

## 1. Kiểm kê

| File | Sách | Loại | Trang PDF | Phạm vi |
|---|---|---|---|---|
| `01-sgk-tieng-viet-1-tap-mot.pdf` | Tiếng Việt 1 — tập một | **SGK học sinh** | 186 | HK1: **83 bài học vần** + Ôn tập + Đánh giá cuối HK1 (nội dung hết trang 182) |
| `01-sgk-tieng-viet-1-tap-hai.pdf` | Tiếng Việt 1 — tập hai | SGK học sinh | 178 | HK2: 8 chủ đề bài đọc + Ôn tập & đánh giá |
| `01-sgk-toan-1-tap-mot.pdf` | Toán 1 — tập một | SGK học sinh | 118 | HK1: chủ đề 1–5, bài 1–20 |
| `01-sgk-toan-1-tap-hai.pdf` | Toán 1 — tập hai | SGK học sinh | 110 | HK2: chủ đề 6–10, bài 21–41 |
| `global-stage/global-stage-1-language-book-scope-and-sequence.pdf` | Global Stage 1 — Language Book | **Bảng chương trình** (Macmillan, tải công khai) | 2 | 10 unit + Language Review: từ vựng, cấu trúc, nói, viết (§4b.1) |
| `global-stage/global-stage-1-literacy-book-scope-and-sequence.pdf` | Global Stage 1 — Literacy Book | **Bảng chương trình** (Macmillan, tải công khai) | 2 | 10 unit + Phonics Review: bài đọc, kỹ năng đọc, phonics (§4b.2) |

Tất cả đều thuộc bộ **Kết nối tri thức với cuộc sống** (NXB GDVN), **PDF quét — không có lớp chữ**, nên phải đọc bằng nhận dạng ảnh. **Quy đổi trang: trang PDF = trang sách + 1** (đã kiểm chứng: bài 13 ở trang sách 38–39 nằm ở PDF 39–40). ⚠️ **Khi tách ảnh trang ra khỏi PDF** (cách Claude Code đọc sách quét) thì chỉ số ảnh = **trang sách + 3** với cả hai file SGK trong repo, vì đầu file có 2 ảnh bìa lặp — kiểm lại bằng một trang đã biết trước khi soạn (ghi nhận ở pha 2).

> ⚠️ Hai file **sách giáo viên** nạp ngày 09/09 (`01-sgv-toan-1.pdf`, `01-sgvtieng-viet-1-tap-hai.pdf`) hiện **không còn trong thư mục**. SGV có mục tiêu bài dạy và đáp án — rất hữu ích khi soạn bài luyện và chấm. Nếu chủ dự án còn giữ, nên chép lại vào; bảng bài Toán ở §2 dưới đây đang dùng số trang của SGV.

> ⚠️ **ĐÍNH CHÍNH 11/09/2026 — GS1 KHÔNG phải Global Success.** Chủ dự án đưa ảnh cổng học liệu của trường: sách tiếng Anh là **Global Stage Level 1 (Macmillan)**, gồm **Language Book 1** và **Literacy Book 1** (bản số, khoá học 08/09/2026 – 07/12/2027). `GS1` trên phiếu bài tập = **Global Stage 1**. Điều này khớp với việc trường dùng **Navio** — Navio App là ứng dụng đi kèm bộ Global Stage. Mọi suy đoán "Global Success" bên dưới đã sai và được giữ lại chỉ để ghi nhận lịch sử.
>
> **Nguồn cấu trúc chương trình (tải công khai, miễn phí, không phải chụp sách):**
> - `https://www.macmillanenglish.com/api/fileadmin/user_upload/Catalogue/Global_Stage/Scope_and_Sequence_Language_Book.zip`
> - `https://www.macmillanenglish.com/api/fileadmin/user_upload/Catalogue/Global_Stage/Scope_and_Sequence_Literacy_Book.zip`
>
> Hai file này liệt kê từng unit dạy từ vựng gì, cấu trúc gì, âm phonics nào, kỹ năng đọc–viết nào → đủ để dựng lại bản đồ kỹ năng ESL/ENL. Nội dung trang sách chỉ chụp khi soạn bài cho unit cụ thể, theo tiến độ lớp.
>
> **Phân vai hai quyển:** Language Book → môn **ESL** (từ vựng, mẫu câu, nghe nói). Literacy Book → môn **ENL** (phonics, đọc hiểu, viết).

~~**Xác nhận sách tiếng Anh:** bìa sau SGK liệt kê bộ 11 cuốn lớp 1, trong đó có "Tiếng Anh 1 – Global Success – Sách học sinh". Khớp với mã `GS1` trên phiếu bài tập của trường → GS1 = Global Success 1, sách dễ tìm.~~ *(sai — xem đính chính ở trên)*

~~**Manh mối về sách ESL (đã giải quyết — xem §4b):**~~ phiếu bài tập của trường có tiêu đề **`GS1 – UNIT 1 – REVIEW UNIT 1`** — nhiều khả năng **GS1 = Global Success 1** (Tiếng Anh 1, NXB GDVN, cùng bộ với các sách trên; bìa xuất hiện ở trang cuối SGV). Nếu đúng thì đây là sách phổ biến, dễ tìm bản PDF. Nội dung Unit 1 ghi nhận từ nhật ký lớp và phiếu: *family members* (mom, dad, brother, sister, aunt, uncle, grandparents, twins, baby, pets, cousins), *adjectives* (old, young, tall, short, funny, kind, cute, smart), *ngữ pháp* have/has, am/is/are + phủ định. Chương trình có ít nhất 16 lesson trong Unit 1 → nhiều hơn Global Success chuẩn, nên có thể trường ghép thêm giáo trình quốc tế; **cần chủ dự án xác nhận tên sách ESL với cô giáo**. *(Đã xác nhận 11/09/2026: Global Stage Level 1 — bảng chương trình đầy đủ ở §4b. Nội dung Unit 1 đoán từ phiếu hoá ra **đúng**: gia đình + tính từ + have/has + be chính là Unit 1 của Language Book.)*

**Dạng bài phiếu ESL của trường** (dùng làm khuôn khi soạn ngân hàng bài, `10` §6): `Look and circle` (nhìn tranh chọn từ), `Look and unscramble` (xếp lại chữ cái thành từ, có cho chữ đầu), `Circle to choose` (chọn A/B ngữ pháp), `Read and match` (đọc đoạn rồi nối người ↔ tính từ), `Draw and write` (vẽ và điền câu về gia đình mình). Bài luyện trên app nên **giống hệt các dạng này** để con quen.

**Còn thiếu — chỉ còn phần tiếng Anh** (hướng dẫn thả file: `sach giao khoa/00-DOC-TRUOC-KHI-THA-SACH.md`):

| Ưu tiên | Tài liệu | Chặn việc gì |
|---|---|---|
| 1 | **Ảnh trang Global Stage Level 1** từ cổng học liệu — danh sách trang cụ thể ở **§4b.4** | Bảng chương trình đã có (§4b); còn thiếu bài đọc, tranh và bài tập mẫu để soạn nội dung đợt 2 |
| 2 | ~~Giáo trình quốc tế đi kèm NAVIO~~ — **đã rõ**: Navio là app đi kèm chính bộ Global Stage; 16 lesson của Unit 1 = 8 lesson Language Book + 8 lesson Literacy Book | *(không còn chặn)* |
| 3 | **English Maths**, **English Science** | Hai môn quốc tế còn lại |
| 4 | Hai file SGV đã mất (xem cảnh báo ở trên); vở bài tập; kế hoạch học kỳ của trường | Mục tiêu bài dạy, đáp án, gán tuần chính xác |

**Lưu ý dùng SGV:** SGV chứa mục tiêu, tiến trình dạy và **đáp án** từng bài — rất tốt để Claude Code soạn bài luyện bám sách và để app chấm bài mở. Nhưng nội dung bài tập thực tế nằm ở SGK/VBT; khi có SGK, `LessonUnit` lấy `sampleTasks` từ SGK và `objectives` từ SGV. Bản quyền NXB GDVN — chỉ dùng nội bộ gia đình, không hiển thị ảnh trang cho con.


## 1c. English Maths — "MATH NOTES Grade 1" (tài liệu nội bộ Edison Schools)

Chủ dự án chụp bìa 14/09/2026: môn English Maths học theo quyển **MATH NOTES · Grade 1 · Volume 1**,
in nội bộ của Edison Schools (logo trường trên bìa). **Không có bản công khai** — đã tìm, không nhà
sách hay thư viện số nào có; đây là học liệu trường tự soạn.

Cách lấy, theo thứ tự ưu tiên:
1. Xin cô giáo **bản mềm PDF** qua Teams / Edi Parent (trường tự soạn thì thường có file gốc để in).
2. Chụp **trang mục lục / danh sách unit** → đủ để dựng bảng unit → kỹ năng → tuần, như đã làm với
   Global Stage 1. Có bảng này là nội dung bám chương trình ngay, chưa cần chụp hết quyển.
3. Chụp dần 2–3 trang mỗi bài theo tiến độ lớp.

### 1c.1 Mục lục Volume 1 (chủ dự án chụp 14/09/2026)

Volume 1 **chỉ gồm Unit 3 và Unit 4**, 60 trang. Mã tài liệu dùng trong `sourceRef`: `EDI-MN1`.

| Unit | Mục | Trang | Kỹ năng `EMATH.*` tương ứng |
|---|---|---|---|
| 3 | Unit Introduction · Learning Tips | 3–4 | — |
| 3 | **Numbers 1 to 10** | 5–7 | `NBT.COUNT_WRITE_1_10`, `NBT.COMPARE_1_10` |
| 3 | **Numbers 11 to 20** | 8–10 | `NBT.TEEN_NUMBERS`, `NBT.PLACE_VALUE_TEENS` |
| 3 | **Patterns on a Number Chart to 20** | 11–12 | `NBT.NUMBER_CHART_100`(rút gọn tới 20), `G.PATTERNS` |
| 3 | **Patterns on a Number Line to 20** | 14–16 | `NBT.NUMBER_LINE_TO_20` |
| 3 | Lesson 3-2 · 3-3 · 3-6 · 3-7 · 3-8 | 17–31 | **chưa rõ tên bài — cần chụp trang đầu mỗi bài** |
| 3 | Math in Real Life | 32 | (vận dụng — chưa mô hình hoá) |
| 3 | Student Self-Reflection | 33–34 | (tự đánh giá — chưa mô hình hoá) |
| 4 | Unit Introduction · Learning Tips | 35–36 | — |
| 4 | Lesson 4-1 | 37–39 | chưa rõ |
| 4 | **Addition within 10** | 40–42 | `OA.ADD_WITHIN_10`, `OA.COUNT_ON`, `OA.NUMBER_BONDS_10` |
| 4 | Lesson 4-2 · 4-3 · 4-5 · 4-7 · 4-8 | 43–57 | **chưa rõ tên bài — cần chụp trang đầu mỗi bài** |
| 4 | Math in Real Life | 58 | (vận dụng) |
| 4 | Student Self-Reflection | 59–60 | (tự đánh giá) |

**Nhận xét:**
- Nội dung khớp với giả định cũ: ngân hàng `EMATH` hiện bám **CCSS 1.NBT.A.1** (số tới 20) và
  **1.OA.C.6** (cộng trong 10) — đúng hai thứ Unit 3 và 4 dạy. Không phải soạn lại, chỉ gắn lại nguồn.
- Quyển **bắt đầu từ Unit 3** → Unit 1–2 ở quyển khác hoặc đã học từ mẫu giáo. **Cần hỏi cô.**
- Các bài đánh số trần (3-2, 3-6, 4-5…) mục lục không nói dạy gì; **chụp trang đầu mỗi bài** là đủ.
- Trường có **"Math in Real Life"** (toán vận dụng đời sống) và **"Student Self-Reflection"** (trẻ tự
  đánh giá) — hai thứ hệ thống chưa có. Đáng cân nhắc cho pha 7: một dạng bài vận dụng, và một bước
  "hôm nay con thấy thế nào" cuối phiên.

**Việc phải làm khi có sách:** 346 bài `EMATH.*` hiện dựa trên CCSS, `sourceRef` ghi *"chưa có giáo
trình English Maths của trường"*. Rà lại toàn bộ: đổi `sourceRef` sang unit và trang thật, sửa thứ tự
`expectedWeek` cho khớp, RETIRE những bài dạy thứ không có trong quyển này. Còn Volume 2 (học kỳ 2)
thì hỏi sau.

**Đã làm 15/09/2026 (pha 6c):** rà 5 kỹ năng có tên bài khớp thẳng với mục lục — `NBT.COUNT_TO_20`
(→ tr.5–10, gộp cả hai mục "Numbers 1 to 10" và "Numbers 11 to 20" vì ngân hàng chỉ có một kỹ năng đếm
tới 20, không tách riêng 1–10/11–20 như sách), `NBT.NUMBER_LINE_TO_20` (→ tr.14–16), `OA.ADD_WITHIN_10`
+ `OA.COUNT_ON` + `OA.NUMBER_BONDS_10` (→ tr.40–42, cả ba đều là chiến lược dạy trong cùng bài "Addition
within 10") — **205 bài** đổi `sourceRef` sang `EDI-MN1`, giữ nguyên nội dung. **Chưa đổi**
`NBT.COMPARE_1_10` và `G.PATTERNS` (tuần 4): mục lục ghi tên bài nhưng không chắc đúng nội dung (so
sánh 1–10 có thể nằm ở Lesson 3-2/3-3 "chưa rõ"; "Patterns on a Number Chart" nhiều khả năng dạy đọc
bảng 100 chứ không phải quy luật lặp AB/ABB mà `G.PATTERNS` đo) — để CCSS, chờ ảnh trang xác nhận thay
vì đoán. `NBT.ORDINAL_NUMBERS` không có trong mục lục Volume 1 — có thể ở quyển khác, để CCSS.
`expectedWeek` không đổi (chưa có tiến độ dạy 2026-2027 để lùi tuần). Còn 141/346 bài EMATH khác (các
kỹ năng `EMATH.G.*`, `EMATH.MP.*`, `EMATH.OA.SUB_*`, `EMATH.OA.DOUBLES`… và Unit 5+ chưa có trong
Volume 1) vẫn ghi CCSS — đúng, vì sách chưa dạy tới hoặc mục lục chưa đủ rõ.

## 2. Toán 1 (Kết nối tri thức) — cấu trúc cả năm

Định mức 3 tiết/tuần; HK1 = 18 tuần (54 tiết), HK2 = 17 tuần (51 tiết). Tuần dự kiến tính từ số tiết trong mục lục; phụ huynh chỉnh theo thông báo lớp. `code` đặt `KNTT-T1-B<số bài>`.

**Số trang trong SGK học sinh** (khác số trang SGV ở bảng dưới — khi soạn bài phải dùng số này để trích đúng dạng bài của con):
*Tập một* — B1 tr.8 · B2 tr.14 · B3 tr.20 · B4 tr.24 · B5 tr.32 · B6 tr.38 · B7 tr.46 · B8 tr.50 · B9 tr.54 · B10 tr.56 · B11 tr.68 · B12 tr.80 · B13 tr.86 · B14 tr.92 · B15 tr.96 · B16 tr.100 · B17 tr.102 · B18 tr.106 · B19 tr.110 · B20 tr.112 (thuật ngữ tr.114).
*Tập hai* — bắt đầu chủ đề 6 "Các số đến 100", B21 tr.4.

| Chủ đề | Bài (số tiết) | Tuần dự kiến | Kỹ năng `VMATH.*` (bổ sung/khớp với `05` §3.6) |
|---|---|---|---|
| **1. Các số từ 0 đến 10** (tr.16) | Tiết học đầu tiên · B1 Các số 0,1,2,3,4,5 (3) · B2 Các số 6,7,8,9,10 (3) · B3 Nhiều hơn, ít hơn, bằng nhau (2) · B4 So sánh số (4) · B5 Mấy và mấy (3) · B6 Luyện tập chung (4) | 1–7 | `SO.SO_0_5`, `SO.SO_6_10`, `SO.NHIEU_HON_IT_HON`, `SO.SO_SANH_1_10`, `SO.TACH_GOP_10` (mấy và mấy), `SO.DEM_VAT` |
| **2. Làm quen với một số hình phẳng** (tr.32) | B7 Hình vuông, tròn, tam giác, chữ nhật (2) · B8 Thực hành lắp ghép, xếp hình (2) · B9 LTC (1) | 7–8 | `HH.HINH_VUONG_TRON_TAM_GIAC_CN`, `HH.LAP_GHEP_XEP_HINH` |
| **3. Phép cộng, phép trừ trong phạm vi 10** (tr.39) | B10 Phép cộng trong PV 10 (6) · B11 Phép trừ trong PV 10 (6) · B12 Bảng cộng, bảng trừ trong PV 10 (3) · B13 LTC (3) | 9–14 | `SO.CONG_PV_10`, `SO.TRU_PV_10`, `SO.BANG_CONG_TRU_10`, `SO.CONG_VOI_0`, `SO.TRU_VE_0`, `GT.BAI_TOAN_THEM`, `GT.BAI_TOAN_BOT` (dạng tranh) |
| **4. Làm quen với một số hình khối** (tr.55) | B14 Khối lập phương, khối hộp chữ nhật (2) · B15 Vị trí, định hướng trong không gian (2) · B16 LTC (1) | 15–16 | `HH.KHOI_HOP_KHOI_LAP_PHUONG`, `HH.VI_TRI_TREN_DUOI_TRAI_PHAI` |
| **5. Ôn tập học kì 1** (tr.61) | B17 Ôn các số trong PV 10 (2) · B18 Ôn cộng trừ PV 10 (2) · B19 Ôn hình học (1) · B20 Ôn tập chung (1) | 17–18 | ôn — dùng cho phiên `ASSESSMENT` cuối HK1 |
| **6. Các số đến 100** (tr.67) | B21 Số có hai chữ số (6) · B22 So sánh số có hai chữ số (3) · B23 Bảng các số từ 1 đến 100 (1) · B24 LTC (2) | 19–22 | `SO.SO_11_20`, `SO.SO_DEN_100`, `SO.CHUC_DON_VI`, `SO.SO_SANH_100`, `SO.BANG_100_DEM_THEO_CHUC` |
| **7. Độ dài và đo độ dài** (tr.78) | B25 Dài hơn, ngắn hơn (2) · B26 Đơn vị đo độ dài (2) · B27 Thực hành ước lượng và đo độ dài (2) · B28 LTC (2) | 23–25 | `DL.DAI_HON_NGAN_HON`, `DL.DO_CM`, `DL.UOC_LUONG_DO_DAI` |
| **8. Phép cộng, phép trừ (không nhớ) trong phạm vi 100** (tr.87) | B29 Cộng số 2 chữ số với số 1 chữ số (2) · B30 Cộng số 2 chữ số với số 2 chữ số (3) · B31 Trừ số 2 chữ số cho số 1 chữ số (3) · B32 Trừ số 2 chữ số cho số 2 chữ số (3) · B33 LTC (4) | 26–30 | `SO.CONG_KHONG_NHO_100`, `SO.TRU_KHONG_NHO_100`, `SO.CONG_TRU_TRON_CHUC`, `SO.DAT_TINH_DOC`, `GT.BAI_TOAN_THEM`, `GT.BAI_TOAN_BOT` (lời văn, PV 100) |
| **9. Thời gian. Giờ và lịch** (tr.99) | B34 Xem giờ đúng trên đồng hồ (2) · B35 Các ngày trong tuần (2) · B36 Thực hành xem lịch và giờ (2) · B37 LTC (2) | 31–33 | `DL.XEM_GIO_DUNG`, `DL.NGAY_TUAN`, `DL.XEM_LICH` |
| **10. Ôn tập cuối năm** (tr.110) | B38 Ôn số & phép tính PV 10 (3) · B39 Ôn số & phép tính PV 100 (3) · B40 Ôn hình học và đo lường (2) · B41 Ôn tập chung (1) | 34–35 | ôn — phiên `ASSESSMENT` cuối năm; đề mẫu ở tr.118–119 SGV có đáp án |

Kỹ năng in nghiêng/mới (`SO.SO_0_5`, `SO.SO_6_10`, `SO.NHIEU_HON_IT_HON`, `SO.DEM_VAT`, `SO.BANG_CONG_TRU_10`, `SO.CONG_VOI_0`, `SO.TRU_VE_0`, `HH.LAP_GHEP_XEP_HINH`, `SO.BANG_100_DEM_THEO_CHUC`, `DL.UOC_LUONG_DO_DAI`, `SO.DAT_TINH_DOC`, `DL.XEM_LICH`) → **bổ sung vào `content/skill-map/vmath.json`** ở pha 1, mỗi kỹ năng ghi `lessonRef: "KNTT-T1-B<n>"` và `expectedWeek` theo bảng.

**Liên kết chéo với English Maths** (cùng năng lực, khác ngôn ngữ — hệ số 0.3, xem `05` §3.6): B10–B12 ↔ `EMATH.OA.ADD_WITHIN_10/SUB_WITHIN_10`; B21–B23 ↔ `EMATH.NBT.COUNT_TO_120/TENS_ONES/COMPARE_TWO_DIGIT`; B29–B32 ↔ `EMATH.NBT.ADD_WITHIN_100`; B34 ↔ `EMATH.MD.TELL_TIME_HOUR_HALF`; B7/B14 ↔ `EMATH.G.SHAPE_ATTRIBUTES`; B25–B27 ↔ `EMATH.MD.ORDER_LENGTH/MEASURE_NONSTANDARD`. Lưu ý chương trình VN dạy đến 100 không nhớ, Common Core lớp 1 dạy cộng trong 20 có "make ten" và trong 100 — hai chương trình bổ trợ nhau, planner có thể dùng bài EMATH để luyện phần VN còn yếu và ngược lại.

## 3. Tiếng Việt 1 — TẬP MỘT (học kỳ 1) — bản đồ 83 bài học vần

**Đây là phần hai bé đang học ngay lúc này** (10/09/2026 lớp học Bài 13). Rút từ mục lục SGK trang 4–5. `code` đặt `KNTT-TV1-T1-B<n>`; mỗi bài 2 trang, 2 tiết.

**Cấu trúc cố định của một bài** (đã kiểm chứng ở bài 13 và bài 66) — đây chính là các "mục" cô giáo nhắc trong nhật ký lớp:
`1 Nhận biết` (câu có tiếng chứa âm/vần mới) · `2 Đọc` (âm/vần → tiếng → từ khoá có tranh) · `3 Viết` (tập viết âm/vần và từ) · `4 Đọc` (câu/đoạn ngắn có tranh) · `5 Nói` (nói theo tranh, chủ đề). Cô hay giao "luyện đọc mục 2 và mục 4" → hệ thống ánh xạ thành hai nhiệm vụ `READ_ALOUD` riêng.

| Bài | Nội dung | Trang | Bài | Nội dung | Trang |
|---|---|---|---|---|---|
| — | Chào em vào lớp 1 | 6 | 43 | au âu êu | 98 |
| 1 | A a | 14 | 44 | iu ưu | 100 |
| 2 | B b · dấu huyền | 16 | 45 | *Ôn tập và kể chuyện* | 102 |
| 3 | C c · dấu sắc | 18 | 46 | ac ăc âc | 104 |
| 4 | E e Ê ê | 20 | 47 | oc ôc uc ưc | 106 |
| 5 | *Ôn tập và kể chuyện* | 22 | 48 | at ăt ât | 108 |
| 6 | O o · dấu hỏi | 24 | 49 | ot ôt ơt | 110 |
| 7 | Ô ô · dấu nặng | 26 | 50 | *Ôn tập và kể chuyện* | 112 |
| 8 | D d Đ đ | 28 | 51 | et êt it | 114 |
| 9 | Ơ ơ · dấu ngã | 30 | 52 | ut ưt | 116 |
| 10 | *Ôn tập và kể chuyện* | 32 | 53 | ap ăp âp | 118 |
| 11 | I i K k | 34 | 54 | op ôp ơp | 120 |
| 12 | H h L l | 36 | 55 | *Ôn tập và kể chuyện* | 122 |
| **13** | **U u Ư ư** ← đang học | **38** | 56 | ep êp ip up | 124 |
| 14 | Ch ch Kh kh | 40 | 57 | anh ênh inh | 126 |
| 15 | *Ôn tập và kể chuyện* | 42 | 58 | ach êch ich | 128 |
| 16 | M m N n | 44 | 59 | ang ăng âng | 130 |
| 17 | G g Gi gi | 46 | 60 | *Ôn tập và kể chuyện* | 132 |
| 18 | Gh gh Nh nh | 48 | 61 | ong ông ung ưng | 134 |
| 19 | Ng ng Ngh ngh | 50 | 62 | iêc iên iêp | 136 |
| 20 | *Ôn tập và kể chuyện* | 52 | 63 | iêng iêm yên | 138 |
| 21 | R r S s | 54 | 64 | iêt iêu yêu | 140 |
| 22 | T t Tr tr | 56 | 65 | *Ôn tập và kể chuyện* | 142 |
| 23 | Th th · ia | 58 | 66 | uôi uôm | 144 |
| 24 | ua ưa | 60 | 67 | uôc uôt | 146 |
| 25 | *Ôn tập và kể chuyện* | 62 | 68 | uôn uông | 148 |
| 26 | Ph ph Qu qu | 64 | 69 | ươi ươu | 150 |
| 27 | V v X x | 66 | 70 | *Ôn tập và kể chuyện* | 152 |
| 28 | Y y | 68 | 71 | ươc ươt | 154 |
| 29 | Luyện tập chính tả | 70 | 72 | ươm ươp | 156 |
| 30 | *Ôn tập và kể chuyện* | 72 | 73 | ươn ương | 158 |
| 31 | an ăn ân | 74 | 74 | oa oe | 160 |
| 32 | on ôn ơn | 76 | 75 | *Ôn tập và kể chuyện* | 162 |
| 33 | en ên in un | 78 | 76 | oan oăn oat oăt | 164 |
| 34 | am ăm âm | 80 | 77 | oai uê uy | 166 |
| 35 | *Ôn tập và kể chuyện* | 82 | 78 | uân uât | 168 |
| 36 | om ôm ơm | 84 | 79 | uyên uyêt | 170 |
| 37 | em êm im um | 86 | 80 | *Ôn tập và kể chuyện* | 172 |
| 38 | ai ay ây | 88 | — | Ôn tập | 174 |
| 39 | oi ôi ơi | 90 | 81–83 | (bài đọc tổng hợp) | 174–178 |
| 40 | *Ôn tập và kể chuyện* | 92 | — | Đánh giá cuối học kì | 180 |
| 41 | ui ưi | 94 | — | Thuật ngữ dùng trong sách | 183 |
| 42 | ao eo | 96 | | | |

### 3.1 Quy tắc sinh kỹ năng `VIET.HV.*` từ bảng này (thay cho danh sách đoán ở `05` §3.5)

- **Mỗi bài không phải "Ôn tập" → một kỹ năng**, mã đặt theo nội dung: `VIET.HV.AM_A` (bài 1), `VIET.HV.DAU_HUYEN` (bài 2, tách riêng khỏi âm B), `VIET.HV.AM_CH_KH` (bài 14), `VIET.HV.VAN_AN_AN_AN` (bài 31)… Bài dạy nhiều âm/vần thì **tách thành nhiều kỹ năng con** nhưng cùng `lessonRef`.
- `expectedWeek` = suy từ thứ tự bài và nhịp thực tế của lớp (nhật ký lớp `11` §5 sẽ hiệu chỉnh). Với nhịp ~1 bài/buổi học Tiếng Việt, 83 bài phủ trọn học kỳ 1.
- Bài **"Ôn tập và kể chuyện"** (17 bài) không tạo kỹ năng mới — gắn vào các kỹ năng của 4 bài liền trước, dùng làm mốc ôn tập trong lịch spaced repetition, và là nguồn cho dạng bài `MINI_STORY`.
- Bài 29 **Luyện tập chính tả** → `VIET.VIET.CHINH_TA_NGHE_VIET`.
- Các bài dễ nhầm cần gắn `targetsError` (`10` §7): b/d (bài 2 vs 8), p/q (bài 26), s/x (bài 21 vs 27), ch/tr (bài 14 vs 22), ng/ngh và g/gh (bài 18, 19), dấu hỏi/ngã (bài 6 vs 9).

## 4. Tiếng Việt 1 — Tập hai (Kết nối tri thức) — học kỳ 2

Tập hai chuyển từ *học vần* (tập một) sang **văn bản đọc**: mỗi bài là một bài đọc (văn xuôi 4 tiết, thơ 2 tiết), gồm khởi động, đọc, trả lời câu hỏi, viết (tập viết/chính tả), nói–nghe, nhận biết vần/từ trong bài. Định mức 12 tiết/tuần (10 tiết "cứng" + 2 tiết luyện linh hoạt). `code` đặt `KNTT-TV1-T2-CD<chủ đề>-B<bài>`.

| Chủ đề | Bài đọc | Tuần dự kiến | Kỹ năng `VIET.*` trọng tâm |
|---|---|---|---|
| **1. Tôi và các bạn** (tr.4) | B1 Tôi là học sinh lớp 1 · B2 Đôi tai xấu xí · B3 Bạn của gió · B4 Giải thưởng tình bạn · B5 Sinh nhật của voi con · Ôn tập | 19–20 | `DOC.DOC_CAU`, `DOC.DOC_DOAN_NGAN`, `DOC.DOC_HIEU_TRA_LOI`, `VIET.VIET_CAU_CHINH_TA_NHIN`, `NN.KE_LAI` |
| **2. Mái ấm gia đình** (tr.28) | B1 Nụ hôn trên bàn tay · B2 Làm anh · B3 Cả nhà đi chơi núi · B4 Quạt cho bà ngủ · B5 Bữa cơm gia đình · B6 Ngôi nhà · Ôn tập | 21–22 | như trên + `DOC.DOC_THO`, `NN.NOI_THEO_TRANH` |
| **3. Mái trường mến yêu** (tr.51) | B1 Tôi đi học · B2 Đi học · B3 Hoa yêu thương · B4 Cây bàng và lớp học · B5 Bác trống trường · B6 Giờ ra chơi · Ôn tập | 23–24 | + `VIET.CHINH_TA_NGHE_VIET`, `TV.VIET_HOA_DAU_CAU` |
| **4. Điều em cần biết** (tr.77) | B1 Rửa tay trước khi ăn · B2 Lời chào đi trước · B3 Khi mẹ vắng nhà · B4 Nếu không may bị lạc · B5 Đèn giao thông · Ôn tập | 25–26 | + `DOC.DOC_HIEU_VAN_BAN_THONG_TIN`, `NN.CHAO_HOI_LE_PHEP` |
| **5. Bài học từ cuộc sống** (tr.100) | B1 Kiến và chim bồ câu · B2 Câu chuyện của rễ · B3 Câu hỏi của sói · B4 Chú bé chăn cừu · B5 Tiếng vọng của núi · Ôn tập | 27–28 | + `DOC.RUT_RA_BAI_HOC`, `TV.DAU_CHAM_HOI` |
| **6. Thiên nhiên kì thú** (tr.122) | B1 Loài chim của biển cả · B2 Bảy sắc cầu vồng · B3 Chúa tể rừng xanh · B4 Cuộc thi tài năng rừng xanh · B5 Cây liễu dẻo dai · Ôn tập | 29–30 | + `TV.TU_CHI_SU_VAT`, `TV.TU_CHI_DAC_DIEM` |
| **7. Thế giới trong mắt em** (tr.146) | B1 Tia nắng đi đâu? · B2 Trong giấc mơ buổi sáng · B3 Ngày mới bắt đầu · B4 Hỏi mẹ · B5 Những cánh cò · B6 Buổi trưa hè · B7 Hoa phượng · Ôn tập | 31–32 | + `DOC.DOC_THO`, `DOC.DOC_DIEN_CAM` |
| **8. Đất nước và con người** (tr.172) | B1 Cậu bé thông minh · B2 Lính cứu hoả · B3 Lớn lên bạn làm gì? · B4 Ruộng bậc thang ở Sa Pa · B5 Nhớ ơn · B6 Du lịch biển Việt Nam · Ôn tập | 33–34 | + `DOC.DOC_HIEU_VAN_BAN_THONG_TIN`, `NN.TRA_LOI_CAU_HOI` |
| **Ôn tập và đánh giá** (tr.198) | Ôn tập · Bài 1–3 · Đánh giá cuối năm học (tr.204) | 35 | phiên `ASSESSMENT` cuối năm |

Kỹ năng mới cần bổ sung vào `content/skill-map/viet.json`: `DOC.DOC_THO`, `DOC.DOC_DIEN_CAM`, `DOC.DOC_HIEU_VAN_BAN_THONG_TIN`, `DOC.RUT_RA_BAI_HOC`, `TV.TU_CHI_DAC_DIEM`. Mỗi bài đọc thành một `LessonUnit` với `vocabulary` (từ mới trong bài), `concepts` (vần được ôn trong bài), `sampleTasks` (câu hỏi đọc hiểu, câu chính tả), `contentText` (văn bản bài đọc — để sinh bài `MINI_STORY` và `READ_ALOUD` **đúng bài con đang học**).

**Học kỳ 1 (tập một — chưa có sách):** phần học vần theo bộ Kết nối tri thức có thứ tự âm/vần riêng; bản đồ `VIET.HV.*` trong `05` §3.5 tạm giữ thứ tự chung, sẽ gán `lessonRef`/`expectedWeek` khi có tập một. Vì con đang ở HK1 (tuần 1 từ 08/09/2026), **tập một là tài liệu cần ưu tiên tìm nhất**.

## 4b. Tiếng Anh — Global Stage Level 1 (Macmillan): Language Book + Literacy Book

> Đánh số **4b** để không phải đánh số lại §5–§6 (nhiều chỗ trong code và tài liệu đang trỏ tới
> `docs/09` §2 và §3). Nguồn: hai file *Scope and Sequence* tải công khai từ Macmillan
> (xem §1), bản Level 1 đã lưu trong `sach giao khoa/global-stage/`:
> `global-stage-1-language-book-scope-and-sequence.pdf` · `global-stage-1-literacy-book-scope-and-sequence.pdf`.
> Đây **không phải nội dung sách** (không có bài đọc, không có tranh) — chỉ là bảng chương trình,
> đủ để dựng bản đồ kỹ năng và gán unit; nội dung trang sách chụp theo tiến độ lớp khi cần.

**Cách ghi `standardRef`** (thay cho `GS1.U<n>` đoán sai trước đây):
`GS1-LB.U1…U10` và `GS1-LB.R` (Language Review đầu sách) cho **ESL**;
`GS1-LIT.U1…U10` và `GS1-LIT.R` (Phonics Review đầu sách) cho **ENL**.

**Nhịp học:** TKB 1B3 có **6 tiết ESL/ENL mỗi tuần** (1 tiết `ESL & ENL` + 5 tiết native). Mỗi unit
trải trên cả hai quyển (Language ~8 lesson + Literacy ~8 lesson = **16 lesson/unit** — khớp với
"Unit 1 – Lesson 16" trong nhật ký lớp), tức **≈ 3 tuần/unit**. Cột "tuần" dưới đây là tuần **dự
kiến học xong**; nhật ký lớp (`docs/11`) sẽ hiệu chỉnh.

### 4b.1 Language Book 1 → môn ESL

| Unit | Tên (trang) | Từ vựng | Cấu trúc | Nói · phát âm | Viết | Tuần |
|---|---|---|---|---|---|---|
| **R** | Language Review | School Supplies · Colors · Shapes · Food · Animals · Parts of the Body | Imperatives · Be · Can · Have · Like | — | — | 1 |
| **1** | Meet My Family (tr.10) | **Family:** parents, grandparents, grandma, grandpa, baby, pets, aunt, uncle, cousins, twins · **Adjectives:** kind, tall, short, old, young, smart, funny, scary, cute | Simple Present **Have** · **How many …?** · Simple Present **Be** | Giới thiệu bản thân và gia đình · /ɪ/ – /i/ | Dấu câu: viết hoa và dấu chấm · *A Special Person Poster* | 3 |
| **2** | This Is Delicious (tr.22) | **Food 1:** carrots, potatoes, tomatoes, onions, mushrooms, strawberries, watermelons, peaches, coconuts, limes, broccoli · **Food 2:** rice, salad, breakfast, lunch, dinner, cereal, chicken, cheese, soup, pasta, eggs | Simple Present **Like** · **What …?** · **Want** | Đồng ý – không đồng ý · /æ/ – /ɔ/ | Dấu hỏi · *A Rainbow Food Survey* | 6 |
| **3** | Play With Me (tr.36) | **Toys:** video game, train, bike, kite, dinosaur, skateboard, robot, teddy bear, scooter, drum · **Action Verbs 1:** walk, ride a bike, throw, catch, fly, climb, dance, run, sing, turn | **This/That/These/Those** · Modal **Can** (khả năng) | Đưa ra đề nghị · /ɪ/ – /aɪ/ | Dựng câu: màu (tính từ) + danh từ · *A Toy Swap Shop Ad* | 9 |
| **4** | Animals Are Awesome (tr.48) | **Wild Animals:** penguin, hippo, tiger, elephant, frog, giraffe, parrot, crocodile, rhino, zebra · **Action Verbs 2:** jump, eat, drink, swim, carry, hide, sleep, stand | **Present Progressive** (câu kể) · **What …?** | Thuyết trình bằng tranh · /u/ – /oʊ/ | Chính tả động từ đuôi –ing · *An Awesome Animals Fact File* | 12 |
| **5** | Where Are My Shoes? (tr.62) | **Clothes:** pants, glasses, shirt, skirt, jacket, sweater, shorts, hat, boots, sneakers · **Bedroom Furniture:** bed, rug, lamp, table, chair, desk, closet, wall, picture, floor | **Whose …?** · sở hữu cách **’s** · **There is / There are** (+ và −) · giới từ nơi chốn on, behind, under, in | Dẫn khách thăm phòng ngủ · /s/ – /ʃ/ | Dựng câu có tính từ và màu · *A Dream Bedroom Description* | 15 |
| **6** | Look What I Can Do (tr.74) | **Activity Verbs:** watch TV, read comic books, do homework, paint a picture, listen to music, play outside, play board games, play table tennis, make cookies · **go / play / do:** go swimming, go horseback riding, go surfing, play tennis, play basketball, play soccer, do karate, do yoga, do ballet | Simple Present **What …?** và câu kể · câu hỏi **Yes/No** | Rủ bạn chơi · can – can’t | Chính tả –s, –es, –ies · *A Weekly Calendar* | 18 |
| **7** | Look Around (tr.88) | **Places in Town:** park, library, café, movie theater, hospital, town, sports center, grocery store, swimming pool, station, street, hotel · **Nature:** tree, forest, insects, flowers, leaves, grass, river, lake, mountain | Present Progressive câu hỏi Yes/No và **Who …?** · câu mệnh lệnh **chỉ đường** | Tả thị trấn của mình · /f/ – /v/ | Viết hoa tên phố, tên thị trấn · *A Fantasy Town Description* | 21 |
| **8** | Let’s Go Home (tr.100) | **Rooms and Furniture:** living room, bedroom, kitchen, office, yard, bathroom, cabinet, shower, sofa, hallway · **Daily Routines:** get up, brush your teeth, wash your face, get dressed, make your bed, go to school, go home, take a shower, pack your backpack, go to bed | **Where …?** + giới từ nơi chốn · **When …?** · before / after · trạng từ tần suất never / always | Tả một ngày hoàn hảo · /p/ – /b/ | Dựng câu với *and* · *A Crazy House Description* | 24 |
| **9** | We’re Working Hard (tr.114) | **Jobs:** doctor, firefighter, chef, police officer, pilot, actor, office worker, dentist, vet, astronaut · **Verbs with Jobs:** fly, teach, drive, clean, cook, take care of, help, work, travel, wear a uniform | Simple Present với nghề · **Want to** · **Why? – Because** | Thể hiện sự quan tâm · /e/ – /ɜ/ | a / an · *A Job Poster* | 27 |
| **10** | It’s Party Time (tr.126) | **Parties:** balloons, gift, candy, invitation, fireworks, card, band, drinks, decorations · **Tableware:** cup, plate, knife, fork, spoon, chopsticks, bowl, candle, napkin | Lượng từ **some / any** · danh từ đếm được – không đếm được · đại từ sở hữu mine, yours, his, hers, ours, theirs | Nhờ vả lịch sự · /dʒ/ – /tʃ/ | Giới từ on, at, from · *Invitations* | 31 |
| **Plays** | tr.140 | Play 1 *Fenella’s Birthday Surprise* (Unit 1–5) · Play 2 *Where’s Caspar?* (Unit 6–10) | | | | 32–35 |

Mỗi hai unit có một trang **Put It Together** (ôn Unit 1–2, 3–4, 5–6, 7–8, 9–10) — dùng làm mốc
phiên `ASSESSMENT` nhỏ. Cột **International English** của sách dạy cặp Mỹ/Anh (eraser–rubber,
backpack–rucksack, mom–mum, candy–sweets, movie theater–cinema, pants–trousers, cookies–biscuits,
soccer–football, yard–garden, cabinet–cupboard, cell phone–mobile phone…) — **giữ nguyên cả hai
biến thể trong bài luyện**, đừng coi biến thể Anh là lỗi.

### 4b.2 Literacy Book 1 → môn ENL

| Unit | Trang | Bài đọc 1 | Bài đọc 2 | Kỹ năng đọc | Phonics | Tích hợp · SEL |
|---|---|---|---|---|---|---|
| **R** | đầu sách | — | — | — | **Ôn phonics:** âm đầu, âm cuối, nguyên âm ngắn, từ CVC | — |
| **1** | tr.8 | *Come On, Family!* (truyện) | *Zoom Town* (creative nonfiction) | Dự đoán từ **tranh** | **long o** | Xã hội – Gia đình · Social Awareness |
| **2** | tr.24 | *The Right Place* (creative nonfiction) | *The Yum Café* (kịch) | Nhận biết **nhân vật và bối cảnh** | **long e** | Khoa học – Nông nghiệp |
| **3** | tr.40 | *We Make Toys* (tiểu sử) | *A New Way to Play* (truyện) | Dự đoán từ **nhan đề** | **long a** | Xã hội – Thời gian rảnh |
| **4** | tr.56 | *Jungle Animals* (thơ) | *Little Ant and Big Parrot* (ngụ ngôn) | **So sánh – đối chiếu** | **long i** | Khoa học – Sinh học |
| **5** | tr.72 | *Hurry Up, Hugo!* (kịch) | *Jan’s Blog* (creative nonfiction) | **Mở – thân – kết** | **long u** | Xã hội – Cộng đồng |
| **6** | tr.88 | *This Is Yoga* (văn bản hướng dẫn) | *I Can Do It* (truyện) | Nhận biết và **sắp thứ tự sự việc** | blend đầu **pr, pl** | Khoa học – Sức khoẻ |
| **7** | tr.104 | *What’s Inside?* (thơ) | *Butterfly Forest* (fantasy) | Dự đoán **kết truyện** | blend đầu **fl, fr** | Xã hội – Cộng đồng |
| **8** | tr.120 | *The Storm* (thơ) | *Old and New* (văn bản thông tin) | Dự đoán từ **nhan đề và tranh** | blend đầu **sl, st** | Xã hội – Truyền thống · gọi tên cảm xúc |
| **9** | tr.136 | *Helping Hands* (văn bản thông tin) | *Clean-up Day* (truyện) | **Ý chính và chi tiết** | digraph **sh, ch** (đầu và cuối) | Xã hội – Tình nguyện |
| **10** | tr.152 | *Children’s Day* (văn bản thông tin) | *The Feast* (truyện dân gian) | **Xem lại dự đoán** | digraph **th** (hữu thanh/vô thanh) | Xã hội – Truyền thống |

### 4b.3 Đã gắn lại bản đồ kỹ năng (11/09/2026)

- **ESL** (`content/skill-map/esl.json`): 32 kỹ năng gắn `GS1-LB.*`, 14 kỹ năng phonics gắn
  `GS1-LIT.*`, **3 kỹ năng ngừng dùng** (`isActive=false`, không xoá): `VOC.WEATHER`,
  `VOC.DAYS_OF_WEEK`, `VOC.TRANSPORT` — Global Stage 1 không có ba chủ đề này.
  `VOC.NUMBERS_1_20` và `PH.BLENDS_FINAL` giữ lại nhưng bỏ `standardRef` (số đếm học ở English
  Maths; blend cuối thuộc Raz-Kids). **Thêm 16 kỹ năng** cho phần chương trình trước đây không có
  kỹ năng nào trỏ tới: đồ phòng ngủ, hoạt động go/play/do, nơi chốn, thiên nhiên, việc hằng ngày,
  động từ nghề, tiệc, đồ ăn uống, hiện tại tiếp diễn, Whose/’s, chỉ đường, trạng từ tần suất,
  want to, why/because, some/any, đại từ sở hữu.
- **ENL** (`content/skill-map/enl.json`): 7 kỹ năng ngôn ngữ–viết gắn `GS1-LB.*` (Language Book dạy
  phần này), 11 kỹ năng phonics và đọc gắn `GS1-LIT.*`, thêm `ENL.RL.PREDICTING` — kỹ năng đọc
  xuất hiện ở 5/10 unit mà bản đồ cũ không có. Các kỹ năng còn lại (Dolch sight words, fluency
  Raz-Kids, r-controlled, vowel teams…) giữ `standardRef` CCSS vì thuộc mạch Raz-Kids/NAVIO.
- **Không còn `standardRef` nào dạng `GS1.U<n>`** (đoán theo Global Success).

### 4b.4 Còn thiếu — đúng những trang cần chụp

Scope and Sequence **không có**: câu chuyện, tranh, bài tập mẫu, danh sách từ của *Language Review*,
và số lesson trong từng unit. Khi soạn nội dung đợt 2 (pha 6) cần chụp từ cổng học liệu, **theo tiến
độ lớp, mỗi lần vài trang**:

| Ưu tiên | Quyển | Trang cần chụp | Để làm gì |
|---|---|---|---|
| 1 | Language Book 1 | **tr.4–9** (Language Review) | danh sách từ thật của phần ôn đầu sách — đang phải đoán |
| 2 | Language Book 1 | **tr.10–21** (Unit 1 trọn vẹn) | lớp đang học; lấy mẫu câu, bài tập, thứ tự lesson |
| 3 | Literacy Book 1 | **tr.4–7** (Phonics Review) + **tr.8–23** (Unit 1) | hai bài đọc *Come On, Family!* và *Zoom Town* để soạn `MINI_STORY`, `READ_ALOUD` |
| 4 | Language Book 1 | **tr.22–33** (Unit 2) | unit kế tiếp |
| 5 | Literacy Book 1 | **tr.24–39** (Unit 2) | unit kế tiếp |
| 6 | cả hai | **trang mục lục** (thường tr.2–3) | xác nhận số lesson mỗi unit để chia tuần cho đúng |

Không cần chụp cả quyển: bảng §4b.1 và §4b.2 đã đủ để gán kỹ năng và lên kế hoạch.

## 5. Cách dùng trong các pha

| Pha | Việc dùng tài liệu này |
|---|---|
| 1 | Seed `vmath.json`, `viet.json`: thêm kỹ năng mới ở §2–3, gán `lessonRef` + `expectedWeek`; seed sẵn danh sách `LessonUnit` **khung** (code, title, subject, weekFrom/To, pageFrom/To, `isApproved=false`, chưa có contentText) từ hai bảng trên để dashboard có "lộ trình mong đợi" ngay. |
| 6 | Nạp 2 PDF qua pipeline `material.process` (`07` §4.2): PDF quét → ảnh trang 150 dpi → `UNIT_EXTRACT` (Vision) → **khớp vào LessonUnit khung theo trang** (không tạo unit mới trùng) → điền objectives/vocabulary/sampleTasks/đáp án/contentText → phụ huynh duyệt. Ưu tiên nạp Tiếng Việt tập hai từ tuần 17 (trước HK2); Toán nạp ngay (dùng cả năm). |
| 5 | "Tuần này học bài nào" hiển thị theo `expectedWeek`; phụ huynh chỉ cần sửa lệch. |

## 6. Quy ước thư mục `sach giao khoa/`

- Tên file: `<stt>-<loai>-<mon>-<lop>[-tap-x].pdf` (`sgv` sách giáo viên, `sgk` sách học sinh, `vbt` vở bài tập, `ct` chương trình/kế hoạch). Ví dụ: `02-sgk-tieng-viet-1-tap-mot.pdf`, `03-sgk-esl-macmillan-<ten>.pdf`.
- Thư mục này **không commit vào git** (thêm vào `.gitignore` ở pha 0) — bản quyền và dung lượng; pha 6 đọc từ đường dẫn cấu hình `MATERIALS_DIR` (mặc định `./sach giao khoa`).
- Ảnh xem trước tạm thời không để trong thư mục này.
