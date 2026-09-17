# ADR-24 — Xưởng Tiếng: âm ra trước, chữ là kết quả

**Ngày:** 16/09/2026 · **Pha:** 12 (Xưởng Tiếng) · **Trạng thái:** đã chốt (nhịp đánh vần được chủ dự án xác nhận 16/09/2026)

## Bối cảnh

Hai bé yếu phần đánh vần tiếng Việt. Kho bài **không thiếu** (3.422 bài học vần, 93 gói `HV.*`); cái
sai là **dạng bài**. Bài đánh vần lõi (`viet-danhvan-0001`) đọc "c – u. Ghép âm đầu với vần được tiếng
nào?" rồi cho chọn giữa ba dòng **chữ** "cu / bu / co". Đứa trẻ đang tập đọc phải **đọc được** đáp án mới
trả lời được câu hỏi về việc đọc. Con đoán; đoán trúng thì mastery lên trong khi con vẫn không đánh vần
được. 2.200 bài MCQ + LISTEN_CHOOSE của mạch HV có cùng vấn đề ở mức độ khác nhau.

## Quyết định

### 1. Nguyên tắc: âm ra trước, chữ là kết quả

Con **nghe** → con **lắp** → máy **đọc lại đúng cái con vừa lắp** → **tranh** hiện ra xác nhận nghĩa. Chữ
có mặt trên mảnh ghép để con quen mặt, nhưng **không trò nào bắt con đọc chữ mới làm được**. Mọi mảnh
ghép chạm vào là tự phát âm; âm đầu đọc **âm** ("bờ"), không đọc **tên chữ** ("bê").

Ngoại lệ có chủ ý: *Cặp dễ lẫn* hỏi mặt chữ giữa **đúng hai** thẻ khác nhau đúng một nét (b/d, ch/tr,
s/x, ng/ngh, c/k, hỏi/ngã). Đó là phân biệt hình, không phải đọc; và thẻ không phát âm trước khi chọn,
để trò không biến thành ghép âm.

### 2. Kho tiếng `content/lexicon/viet.json` (nội dung, ADR-9)

- **707 tiếng**, mỗi tiếng đã tách sẵn `amDau` + `van` + `thanh`, kèm `tranh` (Noto emoji hoặc `null` khi
  không có tranh nào nói đúng nghĩa — 305 tiếng có tranh), `nghia`, `skillCode`, `lessonUnitCode`,
  `tuanSGK`, `hangNgay`.
- **30 tiếng đầu** là tiếng con nghe hằng ngày (`hangNgay: true`): bà, ba, mẹ, bé, cá, gà, nhà, **thy**,
  **thanh**, ông, cô, chú, dì, cậu, anh, chị, em, bố, bạn, cơm, sữa, mèo, chó, sách, vở, bút, ghế, nhớ,
  yêu, vui. Còn lại theo thứ tự SGK.
- **Tên hai bé** (`thy`, `thanh`) mang `tenRieng: true` (chủ dự án, 17/09/2026: "Tên là Mai Thy và Chí
  Thanh"): `tieng` vẫn viết thường để ba mảnh ghép như mọi tiếng, còn trên màn hình trò viết hoa chữ đầu
  ("Thy", "Thanh") qua `writtenSyllable()`; nghĩa ghi đủ tên "Mai Thy", "Chí Thanh". Trò *Cặp dễ lẫn* và
  *Bánh xe thanh* viết hoa **mọi** thẻ của lượt đó, để chữ hoa không làm lộ đáp án.
- **Bài và tuần suy ra, không gõ tay**: bài của một tiếng = bài **muộn nhất** trong ba phần (âm đầu, vần,
  thanh) theo bảng bài học của SGK Tiếng Việt 1 tập một (Kết nối tri thức); tuần = `(bài − 1) / 5 + 1`
  (khớp `expectedWeek` của skill map). `skillCode` là kỹ năng của chính phần muộn nhất đó.
- Hai bảng đi kèm: **27 âm đầu** (có `doc` — cách đọc âm) và **125 vần** theo nhóm bài SGK (tập một có
  125 vần thật; đề bài ước ~160 là tính cả tập hai — tập hai chưa nạp).
- Nguồn: rút từ các đáp án/tiếng trong 93 gói `HV.*` (1.154 chuỗi, lọc bỏ tiếng vô nghĩa dùng làm
  nhiễu) rồi soạn nghĩa + tranh bằng tay.
- `content:validate` kiểm từng tiếng bằng **chính hàm** `splitSyllable`/`joinSyllable` mà trò chơi dùng
  để đọc ba mảnh của con: tách không khớp file, ghép không ra đúng chữ, âm đầu/vần không có trong bảng,
  kỹ năng không tồn tại, emoji chưa có tranh → lỗi, không nạp.

Hai lựa chọn chính tả được ghi lại để không cãi lại:

- **`qu` và `gi` là âm đầu** ("quả" = quờ + a) — theo cách sách lớp 1 dạy, không theo ngữ âm học.
- **Đặt dấu theo kiểu sách in**: dấu nằm trên nguyên âm cuối cùng trong `â ê ô ơ ă ư`; nếu không có thì
  trên nguyên âm cuối khi sau nó còn phụ âm ("toán"), còn không thì trên nguyên âm áp chót ("hòa",
  "khỏe", "thủy", "của"). Kho tiếng viết thống nhất theo kiểu này.
- **Ngoài phạm vi**: "gì", "gìn" — chữ i của `gi` và của vần viết chung một con chữ, không lắp được bằng
  ba mảnh mà không dạy con một ngoại lệ; validator chặn.

### 3. Nhịp đánh vần là **một hàm thuần** `cadence()` (`packages/core/src/syllable/cadence.ts`)

```
bà     → bờ · a · ba · huyền · bà
ba     → bờ · a · ba                  (thanh ngang không gọi tên)
anh    → anh                          (không âm đầu, không thanh: không có gì để ghép)
ánh    → anh · sắc · ánh
quyển  → quờ · yên · quyên · hỏi · quyển
```

Đây là lối **chương trình mới** (đọc âm, không đọc tên chữ). Mọi nơi phát nhịp — trò Lắp tiếng, Bánh xe
thanh, Cặp dễ lẫn, nút "Nghe đánh vần" ở Sổ tiếng — đều gọi `cadence()`, và mp3 được sinh từ nó. Đổi lối
đọc = sửa **một** file + sinh lại mp3 đợt 2. Có 50 ca kiểm (27 dòng nhịp + tách/ghép/đặt dấu).

**Chờ xác nhận**: chủ dự án hỏi cô giáo lớp 1B3 xem trên lớp có đọc đúng "bờ – a – ba – huyền – bà"
không. Vì vậy mp3 chia hai đợt (`--viet-tts`):

| Đợt | Gồm | Số câu | Ký tự |
|---|---|---|---|
| `pieces` (đã sinh trên máy dev) | 125 vần, 6 tên thanh, 707 tiếng, các bước ghép âm đầu + vần | 1.237 | 3.971 |
| `rhythm` (đã xác nhận 16/09, đã sinh trên production) | 27 âm đầu đọc thành âm ("bờ"), cả chuỗi đánh vần của từng tiếng | 723 | 16.208 |
| tổng | | 1.957 | 20.172 |

Bộ đệm mp3 theo nội dung câu, nên đổi nhịp chỉ **thêm** câu mới; đợt 1 vẫn dùng được.

### 4. Sáu trò (ExerciseType mới về mặt khái niệm, là **trạm trò chơi** về mặt dữ liệu)

`SYL_BUILD` Lắp tiếng · `SYL_SPLIT` Tách tiếng · `SYL_TONE` Bánh xe thanh điệu · `SYL_PAIR` Cặp dễ lẫn ·
`SYL_TRAIN` Tàu chở vần · `SYL_READ` Đọc to. Như Bến Cảng Từ (ADR-22), chúng **không phải** dòng
`Exercise`: không có `answerKey` để giấu, trạm được chia bài lúc con mở (`syllableStation`) từ kho tiếng
và tiến độ của con, và **đúng/sai do máy chủ quyết** từ tiếng trong DB, không tin điều thiết bị báo.
Enum `ExerciseType` trong Prisma **không** thêm giá trị (không có dòng bài nào mang kiểu đó); tên
`SYL_*` sống ở `SYLLABLE_GAME_TYPES` trong `@mtct/core`.

Luật mở trò (đề bài chỉ nêu điều kiện của Tách tiếng; hai điều kiện còn lại là **diễn giải của
developer**, chỉnh được ở `packages/core/src/syllable/rounds.ts`):

| Trò | Mở khi |
|---|---|
| Lắp tiếng, Cặp dễ lẫn, Đọc to | luôn mở |
| Tách tiếng | ≥ 5 lần lắp với tiếng đã ở box ≥ 2 trong 30 ngày, đúng ≥ 80 % |
| Bánh xe thanh | lớp đã học đủ 6 thanh (tuần ≥ 2, Bài 9) **và** con đã gặp ≥ 6 tiếng |
| Tàu chở vần | con có ≥ 10 tiếng ở box ≥ 2 (đủ vần trong tai để tìm được tiếng) |

Một trạm = **2 vòng khác loại**, xoay theo ngày; Lắp tiếng mở vòng đầu của trạm thứ nhất. Trò nào không
chia được từ tiếng tối nay (không đủ cặp, không có toa nào lớp đã học tới) thì lặng lẽ thành Lắp tiếng.

### 5. Dữ liệu: mở rộng `WordProgress` thành `LexemeProgress` (xem phần bổ sung ADR-22)

Mỗi lần gặp một tiếng ghi **hai** thứ, mỗi thứ qua dịch vụ của nó:

1. `LexemeProgress` (`kind = syllable`) qua `recordLexemeMeeting` — lịch Leitner 1-3-7-14-30 như từ
   tiếng Anh;
2. **một `Evidence`** cho kỹ năng `VIET.HV.*` của tiếng qua `commitEvidence` (`source = EXERCISE`,
   không `attemptId`) — mastery mạch HV vẫn đi qua bằng chứng như cũ. Trọng số nhân: Lắp/Tách 0,6 ·
   Bánh xe 0,5 · Đọc to 0,5 · Cặp 0,4 (hai lựa chọn, đoán trúng 50 %) · Tàu 0,4 (chỉ báo cái con tìm
   được). `note = xuong-tieng:<trò>:<tiếng>:box<n trước khi gặp>` — đó là nhật ký gặp mà luật mở Tách
   tiếng đọc lại.

Mã lỗi (chỉ dùng mã **đã có** trong `content/error-taxonomy.json`; không cần thêm mã mới):

| Con lắp sai ở | Mã |
|---|---|
| khe âm đầu, là cặp b/d, ch/tr, s/x, ng/ngh, c/k | `nham_b_d` · `nham_ch_tr` · `nham_s_x` · `nham_ng_ngh` · `nham_c_k_q` |
| khe âm đầu, còn lại | `nham_am_dau_viet` (trước 17/09: `nham_am_dau`) |
| khe vần | `doc_nham_van` |
| thanh hỏi ↔ ngã | `nham_hoi_nga` (đề bài gọi là `nham_thanh_hoi_nga`; mã đã có sẵn với đúng nghĩa đó) |
| chọn thanh ngang cho tiếng có dấu | `thieu_dau_thanh` |
| thanh khác | `sai_dau_thanh` |

Một lần gặp chỉ mang **một** mã: khe âm đầu trước, rồi vần, rồi thanh — lỗi mà ba mẹ sẽ sửa trước.
Lưu ý: `nham_am_dau` trong taxonomy đang gắn môn ESL; gói `HV.DANH_VAN_TIENG` có sẵn cũng đã dùng nó cho
tiếng Việt. Pha này theo đúng đề bài và tiền lệ đó; tách mã riêng cho tiếng Việt là việc của chủ dự án
quyết (nêu trong báo cáo).

**Cập nhật 17/09/2026 — chủ dự án: "tách mã lỗi riêng".** Thêm `nham_am_dau_viet` (môn VIET, nhóm
`viet_am_chu`, sửa bằng `VIET.HV.DANH_VAN_TIENG` + `VIET.DOC.DOC_TIENG`); `nham_am_dau` chỉ còn cho tiếng
Anh. Xưởng Tiếng, mọi gói `content/exercises/viet` và script sinh bài tiếng Việt dùng mã mới;
`content:validate` chặn mã tiếng Anh trên bài tiếng Việt và ngược lại. Bằng chứng cũ của hai bé mang
`nham_am_dau` **giữ nguyên** (không sửa `Evidence`).

### 6. Planner

Chỉ ô `focus`/`new` của `VIET.HV.*` thành trạm; **ôn tập, thang rèn, khởi động, kết thúc và bài cô
giao giữ bài cũ**. Tối đa 2 trạm/tối. Một trạm ≈ 90 giây ≈ 4 ô bài (≈ 25 giây/ô), nên trạm **nuốt thêm
tối đa 3 ô học vần**; thiếu thì nhường chỗ các ô `focus`/`new` cuối buổi — **buổi học không dài
thêm**. Mỗi trạm: 5 tiếng đến hạn + 3 tiếng mới (tiếng hằng ngày trước với bé mới bắt đầu, rồi kỹ năng
của trạm, rồi bài gần nhất lớp đã học — tuần lớp đọc từ nhật ký lớp 7 ngày, không có thì theo lịch năm
học). Trạm thứ hai không lặp tiếng của trạm thứ nhất. Chạy ở **cả hai thế giới**; trong thành phố chỉ
Phố Chữ có trạm này.

### 7. Phố Chữ

Mỗi tiếng vào **box ≥ 3** là **một viên gạch**; **10 gạch = một ngôi nhà** (`workshopProgress` trong
`packages/core/src/city/rules.ts`, `CityView.workshop`). Đống gạch là **mốc cao nhất từng đạt**
(`StudentCity.syllableBricks`) — tiếng tụt bậc không kéo nhà xuống, đúng luật "không gì trong thành phố
mất đi" (ADR-21). HUD Phố Chữ có nút **Sổ tiếng** (đống gạch vẽ bằng hình, không phân số); trạm Xưởng
Tiếng mang **bánh răng ⚙️** thay ngôi sao trên toà nhà của nó.

## Đã cân nhắc rồi bỏ

- **Sửa 2.200 bài MCQ cũ cho "đỡ đọc"**: vẫn là trả lời câu hỏi về chữ; và REVIEW cần chúng như cũ.
- **Nhét tiến độ tiếng vào `SkillMastery`**: cùng lý do ADR-22 — lịch nhắc lại không phải xác suất nắm
  kỹ năng.
- **Bảng `SyllableProgress` riêng**: đề bài chốt mở rộng bảng pha 11; một bảng, một thang Leitner, một
  chỗ để xoá/xuất.
- **Thêm giá trị `SYL_*` vào enum `ExerciseType`**: không có dòng `Exercise` nào dùng; thêm vào chỉ làm
  bộ chọn bài và validator phải biết một kiểu không bao giờ có dữ liệu.
- **Vẽ nhà Xưởng Tiếng trong cảnh 3D ngay pha này**: cảnh thành phố (`packages/city/src/scene/compose.ts`)
  đang được làm lại song song cho bản đồ Ecopark; dữ liệu (`CityView.workshop`) đã sẵn, phần vẽ nối vào
  khi pha bản đồ xong để không giẫm lên nhau.
