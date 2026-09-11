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

Tất cả đều thuộc bộ **Kết nối tri thức với cuộc sống** (NXB GDVN), **PDF quét — không có lớp chữ**, nên phải đọc bằng nhận dạng ảnh. **Quy đổi trang: trang PDF = trang sách + 1** (đã kiểm chứng: bài 13 ở trang sách 38–39 nằm ở PDF 39–40). ⚠️ **Khi tách ảnh trang ra khỏi PDF** (cách Claude Code đọc sách quét) thì chỉ số ảnh = **trang sách + 3** với cả hai file SGK trong repo, vì đầu file có 2 ảnh bìa lặp — kiểm lại bằng một trang đã biết trước khi soạn (ghi nhận ở pha 2).

> ⚠️ Hai file **sách giáo viên** nạp ngày 09/09 (`01-sgv-toan-1.pdf`, `01-sgvtieng-viet-1-tap-hai.pdf`) hiện **không còn trong thư mục**. SGV có mục tiêu bài dạy và đáp án — rất hữu ích khi soạn bài luyện và chấm. Nếu chủ dự án còn giữ, nên chép lại vào; bảng bài Toán ở §2 dưới đây đang dùng số trang của SGV.

**Xác nhận sách tiếng Anh:** bìa sau SGK liệt kê bộ 11 cuốn lớp 1, trong đó có **"Tiếng Anh 1 – Global Success – Sách học sinh"**. Khớp với mã `GS1` trên phiếu bài tập của trường → **GS1 = Global Success 1**, sách dễ tìm.

**Manh mối về sách ESL:** phiếu bài tập của trường có tiêu đề **`GS1 – UNIT 1 – REVIEW UNIT 1`** — nhiều khả năng **GS1 = Global Success 1** (Tiếng Anh 1, NXB GDVN, cùng bộ với các sách trên; bìa xuất hiện ở trang cuối SGV). Nếu đúng thì đây là sách phổ biến, dễ tìm bản PDF. Nội dung Unit 1 ghi nhận từ nhật ký lớp và phiếu: *family members* (mom, dad, brother, sister, aunt, uncle, grandparents, twins, baby, pets, cousins), *adjectives* (old, young, tall, short, funny, kind, cute, smart), *ngữ pháp* have/has, am/is/are + phủ định. Chương trình có ít nhất 16 lesson trong Unit 1 → nhiều hơn Global Success chuẩn, nên có thể trường ghép thêm giáo trình quốc tế; **cần chủ dự án xác nhận tên sách ESL với cô giáo**.

**Dạng bài phiếu ESL của trường** (dùng làm khuôn khi soạn ngân hàng bài, `10` §6): `Look and circle` (nhìn tranh chọn từ), `Look and unscramble` (xếp lại chữ cái thành từ, có cho chữ đầu), `Circle to choose` (chọn A/B ngữ pháp), `Read and match` (đọc đoạn rồi nối người ↔ tính từ), `Draw and write` (vẽ và điền câu về gia đình mình). Bài luyện trên app nên **giống hệt các dạng này** để con quen.

**Còn thiếu — chỉ còn phần tiếng Anh** (hướng dẫn thả file: `sach giao khoa/00-DOC-TRUOC-KHI-THA-SACH.md`):

| Ưu tiên | Tài liệu | Chặn việc gì |
|---|---|---|
| 1 | **Tiếng Anh 1 – Global Success – SGK học sinh** (+ workbook / phiếu bài tập nếu có) | ESL nhiều tiết nhất tuần; hiện chỉ suy được nội dung từ nhật ký lớp và phiếu bài tập |
| 2 | Giáo trình quốc tế đi kèm **NAVIO** (Macmillan) nếu trường dùng thêm — Unit 1 có tới 16 lesson nên nhiều khả năng có sách thứ hai | Gán đúng Unit/Lesson cho môn ESL/ENL |
| 3 | **English Maths**, **English Science** | Hai môn quốc tế còn lại |
| 4 | Hai file SGV đã mất (xem cảnh báo ở trên); vở bài tập; kế hoạch học kỳ của trường | Mục tiêu bài dạy, đáp án, gán tuần chính xác |

**Lưu ý dùng SGV:** SGV chứa mục tiêu, tiến trình dạy và **đáp án** từng bài — rất tốt để Claude Code soạn bài luyện bám sách và để app chấm bài mở. Nhưng nội dung bài tập thực tế nằm ở SGK/VBT; khi có SGK, `LessonUnit` lấy `sampleTasks` từ SGK và `objectives` từ SGV. Bản quyền NXB GDVN — chỉ dùng nội bộ gia đình, không hiển thị ảnh trang cho con.

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
