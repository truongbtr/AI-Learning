# Đợt 3 — báo cáo soạn nội dung (pha 6b)

**Ngày:** 14/09/2026 · **Người soạn:** Claude Code · **Phạm vi:** 129 kỹ năng tuần 1–12 còn 0 bài, theo
thứ tự đề bài pha 6b — (1) kỹ năng lớp đang học, (2) Toán 9, (3) ESL 33, (4) Tiếng Việt 42, ENL 26,
English Maths 12, English Science 7.

**Chạy song song với pha 8c.** Không dựng lại Docker. Mọi lần nạp đều sau 21:00 (lần đầu 21:01, lần cuối
23:08), mỗi lần `--dry-run` trước và kiểm bảng `Session` trước (không có phiên nào mở). Chỉ đụng
`Exercise` / `ContentBatch` (qua `content:import`) và `Skill.exerciseTypes` + biên độ khó (qua
`sync-skill-types`). Một thay đổi code nhỏ ở validator nội dung (chữ p, mục 4 và ADR-19).

---

## 1. Số liệu

- **129 kỹ năng trống → 0.** Cộng 2 kỹ năng lớp đang học (`VIET.VIET.VIET_TU_VAN` là 1 trong 129;
  `ESL.GR.PREPOSITIONS_IN_ON_UNDER` ngoài danh sách) → **130 gói · 5.010 bài · tất cả `PUBLISHED`.**
- Theo môn: **VIET 42 kỹ năng / 1.801 bài** · ESL 34 / 1.258 · ENL 26 / 931 · EMATH 12 / 427 ·
  VMATH 9 / 348 · ESCI 7 / 245.
- Ngân hàng sau đợt 3: **8.443 bài `PUBLISHED` / 209 kỹ năng**, 27 bài nghỉ hưu.
  Mức khó: 1 → 1.208 · 2 → 2.013 · 3 → 2.097 · 4 → 1.793 · 5 → 1.332.
- **207/207 kỹ năng tuần 1–12 đang dùng có ≥ 35 bài `PUBLISHED`** (đo bằng script riêng đọc DB:
  `ExerciseSkill` ⨝ `Exercise.status = PUBLISHED`, lọc `Skill.isActive` và `expectedWeek ≤ 12`).
- Mọi gói đủ 5 mức khó; 26/130 gói đủ 6 dạng, 103 gói thiếu đúng COUNT_TAP, 1 gói thiếu COUNT_TAP và
  READ_ALOUD — lý do ở mục 3 và ADR-19.

## 2. Nguồn — không giả vờ bám sách

| Môn | Nguồn thật | Ghi trong `sourceRef` |
|---|---|---|
| Tiếng Việt | **Ảnh trang SGK Tiếng Việt 1 tập một tr.64–133** (bài 26–60), 4 agent chép từ ngữ từng mục (Đọc, tranh, Viết, bài đọc, Kể chuyện) ra JSON rồi mới soạn | Số bài và số trang thật; câu nào của sách có vần chưa học thì cắt và ghi trong `note` |
| Toán 1 | SGK Toán 1 tập một bài 1, 7–11 (số trang theo bảng bài học) | Số bài, số trang |
| ESL | Bảng *Scope and Sequence* Global Stage 1 Language/Literacy Book (từ vựng đúng danh sách Unit R, 1–4) | *"bảng chương trình — chưa chụp trang sách"* |
| ENL | CCSS ELA lớp 1 + Global Stage 1 Literacy Book; **sách nhỏ cấp aa–D viết mới**, không chép Raz-Kids | *"không chép sách Raz-Kids"* / *"chưa có giáo trình"* |
| English Maths | CCSS 1.OA, 1.G, K.G, MP1, MP6 | *"chưa có giáo trình English Maths của trường"* |
| English Science | NGSS 1-PS4-1/4, K-PS2-1, SEP.1; chủ đề nam châm, nóng–lạnh của chương trình quốc tế | *"chưa có sách English Science của trường"* |

## 3. Chất lượng — cách giữ từng luật

**Một đáp án.** `scripts/content-gen/audit-closed.mjs` đọc câu lệnh, suy ra cái được hỏi rồi đếm số ô
thoả: ô/thẻ trùng chữ; "có âm/vần X" (theo âm, `vn-units.mjs`); "có dấu X"; phép tính hai số
(`a ± b = ?`, "a và mấy được b", "x plus y" — đợt này sửa để "2 + 8 + 5 = ?" không bị đọc thành
"8 + 5"); câu đếm có tranh lặp; điền dấu `a ? b`; "viết đúng" theo luật ng/ngh, g/gh, c/k (đợt này thêm:
đề nêu tên tiếng thì chỉ ô trùng tiếng đó đúng, đề có tranh thì chỉ xét đáp án có phạm luật không).
Kết quả cuối: **đã soát 5.173 bài có ô lựa chọn · 0 bài không có đúng một đáp án.**

Dạng nghĩa (từ vựng, khoa học, đọc hiểu) máy không đếm được; ở đó luật đi bằng cấu trúc và soát tay:
- câu phụ thuộc điều emoji không vẽ được (gần/xa, trên/dưới, con thích gì) kèm dữ kiện tiếng Việt trong
  ngoặc; không đặt hai cách nói cùng đúng cạnh nhau (It's / It is);
- tranh chọn loại chỉ một tên (bỏ notebook vì 📓 cũng là "book", parrot vì 🦜 cũng là "bird", 👂 vì là
  "tai" chứ không phải "nghe");
- khoa học bỏ câu có hai cách hiểu ("turn the TV down" → "lower" cũng đúng; chìa khoá thường bằng đồng);
- đọc trôi chảy cấp C, D: ô nhiễu chỉ định tay vì nhân vật lặp giữa các trang (tranh 👧 khớp cả "asks Kim"
  và "Kim opens the box");
- quy luật lặp: bỏ bài "kéo hai thẻ tiếp theo" có hai thẻ giống nhau khác ô (đổi chỗ vẫn đúng).

**Soát tay trong lúc soạn — lỗi bắt được trước khi nạp:** 6 bài chính tả "Ô nào viết đúng?" không nêu
tiếng cần viết mà ô sai là tiếng thật khác dấu (kẻ / kẽ) → khuôn `writingPack` nay luôn nêu tiếng; 1 bài
cũ của lô A (`bí đỏ`) sửa theo. 4 ô `nham_cong_tru` trong câu hai phép tính bị validator đọc phép đầu →
đổi mã. 11 ô `chua_nghe_het_de` bị validator chặn (mã hành vi) → bỏ mã, giữ ô.

**Mã lỗi đúng nghĩa.** Mọi `errorTag` qua `error-semantics.ts` (validator chạy lại toàn kho). Toán và
học vần: mọi câu trắc nghiệm có ô nhiễu mang mã. ESL/ENL/ESCI: chỉ gắn khi mã tả đúng việc con làm
(`nham_am_is_are`, `nham_this_that`, `thieu_s_so_nhieu`, `doc_bo_tu_tieng_anh`, `sai_chinh_ta_tu`,
`nham_nguyen_am_ngan`, `doc_nham_van`); không có mã cho từ vựng, đọc hiểu, khoa học, lễ phép — để trống
thay vì gắn bừa.

**Chữ chưa học.** Validator `tieng-viet-progression` chạy trên mọi ô, thẻ, câu đọc tiếng Việt. Soạn
bài 31–59 gặp khoảng 20 lỗi "vần chưa học" trong câu sách (thăm, hát, học, con, cái…) → cắt câu hoặc đổi
tiếng. Ba kỹ năng mở `lessonRef` (hỏi/ngã tới bài 19, nói theo tranh tới 31, kể lại tới 40) — ADR-19.

**Câu lệnh.** ≥ 6 biến thể câu lệnh và ≥ 4 biến thể gợi ý mỗi dạng (khuôn quay vòng); tiếng Anh ≤ 12
từ, tiếng Việt ≤ 20 từ (validator); không có chữ "sai".

**COUNT_TAP.** Chỉ dùng khi đếm là một phần kỹ năng (Toán, "how many", đếm hình, số lượng). Ở ngữ âm,
ngữ pháp, đọc hiểu, khoa học: không dùng — bài đếm ở đó ghi bằng chứng sai kỹ năng (đợt 2:
`viet-bd-0049`). Bỏ COUNT_TAP khỏi bản đồ của `ENL.RF.PRINT_CONCEPTS`, `SYLLABLES`, `SEGMENT_PHONEMES`.
Không dùng TRACE (chưa có trình hiển thị) và MINI_STORY (trình hiển thị hiện "để dành lần sau") —
truyện đi bằng nghe (`listenTarget` dài) + câu hỏi in.

## 4. Thay đổi ngoài nội dung

- `packages/content/src/tieng-viet-progression.ts`: bài 26 dạy thêm **p** (SGK tr.64 in "p – ph"),
  kèm test. Không có nó, không bài vần ap/op/ep/ip/up nào qua validator. Chỉ validator dùng bảng này.
- `content/skill-map/viet.json`: mở `lessonRef` ba kỹ năng (ADR-19). `enl.json`: bỏ COUNT_TAP ba kỹ năng.
- `lib-viet-pairs.mjs` tách từ `viet-letters-2.mjs` (nội dung các gói cũ không đổi — so JSON với
  commit trước: giống hệt); `lib-en.mjs`, `lib-vi.mjs` thêm ô tranh, thẻ chỉ có tranh, câu hỏi in cho
  bài nghe, giỏ hai ngăn.
- **Sửa nội dung cũ:** 70 bài viết của đợt 1–3 ghi "Viết đủ 2 tiếng" cho "cá mè, nơ đỏ" (đếm cụm thay vì
  tiếng) → đếm đúng tiếng; 20 bài `EMATH.NBT.COUNT_TO_20` (mục 6).

## 5. 20 bài mẫu đợt 3

`node scripts/sample-exercises.mjs pha-6b-dot-3 20 "" --only='^(<130 gói đợt 3>)$'` — pool 5.010 bài.

```
esl-greet-0014  enl-label-0011  viet-vanan-0002  esl-shapes-0023  viet-vanep-0042
vmath-toanthem-0010  viet-hoinga-0015  enl-longshort-0026  emath-compose-0018  vmath-cong5-0020
viet-vanat-0012  esl-intro-0024  esci-vibrate-0005  esl-color-0008  viet-vanat-0046
esl-school-0022  esl-intro-0021  esl-instruct-0002  viet-amphqu-0038  emath-pattern-0015
```

Tự chấm theo rubric `docs/10` §6: **18/20 → 20/20** sau khi sửa. Hai bài chưa đạt: `viet-vanep-0042` và `viet-vanat-0046`
có tiêu chí "Viết đủ 2 tiếng" cho "đôi dép, búp sen" — lỗi đếm cụm đã nói ở mục 4, sửa cho cả 70 bài.
Còn lại: một đáp án, mã lỗi đúng nghĩa (`dig` = nham_nguyen_am_ngan, `dogg` = sai_chinh_ta_tu,
`khô` = doc_nham_van, `mủ` = nham_hoi_nga, `1` trong "một cộng hai" = lap_lai_tong), tranh khớp tên.

## 6. Vòng phản hồi — `exercise-health.csv` (ops/state/2026-09-14)

20 dòng, mỗi bài **1 lượt** — chưa đủ để nói bài nào quá dễ / quá khó (ngưỡng đọc: ≥ 5 lượt). Dù vậy
đọc từng dòng vẫn ra một lỗi thật:

- **`emath-count20-0016`: 119 giây, 3 lần thử.** Mở bài: câu "Point to the right one." kèm **một** 🚗,
  đáp án 16. Soát cả gói: **20/20 câu trắc nghiệm của `EMATH.NBT.COUNT_TO_20` đều vẽ một vật** (thiếu
  `repeat`) và câu lệnh không nói phải làm gì — con không thể biết đáp án. Đã sửa: `repeat` = đáp án,
  câu lệnh "How many? Count, then tap." (5 biến thể). Quét toàn kho tìm câu đếm có tranh một vật: chỉ gói
  này hỏng (các gói khác là bài lời văn hoặc hỏi số cạnh, có số trong đề).
- `viet-am-u-0041` (viết ư vào vở) bị bỏ qua 1 lần — bài viết cần ba mẹ chụp, bỏ qua lúc tối muộn là
  bình thường; chưa đổi, theo dõi.
- `viet-bd-0049` 0% — đã nghỉ hưu ở đợt 2 (COUNT_TAP sai kỹ năng).
- Không bài nào đủ lượt để RETIRE hay nâng khó. Đọc lại sau 2–3 ngày học (17/09).

## 7. Không ngày học nào gián đoạn

Mỗi lần nạp: `Get-Date` PowerShell (giờ máy UTC+7) > 21:00, bảng `Session` không có phiên mở. Bảng
`Session` trong 10 giờ trước 23:15 ngày 14/09: 0 phiên. Không khởi động lại container nào.

## 8. Tồn đọng

- **Giọng đọc:** chạy `content:import` sinh mp3 sau lần nạp cuối (số liệu cuối ở TIEN-DO).
- **Seed ghi đè `exerciseTypes`** mỗi lần container web khởi động (image cũ): sau restart phải chạy lại
  `sync-skill-types` cho 130 kỹ năng đợt 3 tới khi dựng lại image.
- Ảnh trang **Global Stage** và **sách English Science / English Maths**: vẫn chưa có; 1.258 + 931 + 427
  + 245 bài đang bám bảng chương trình / chuẩn — cần rà lại khi có sách.
- TRACE, MINI_STORY chưa có trình hiển thị: tô chữ (`TO_CHU_THUONG`, `VIET_CHU_SO`) và truyện tranh
  đang đi bằng bài viết và bài nghe.
- Mã lỗi còn thiếu: gọi nhầm tên hình, viết hoa, dấu câu, lễ phép, từ vựng — nhiều gói ESL/ENL/ESCI có
  `targetsError` = 0 (validator chỉ cảnh báo).

## 9. Bảng từng kỹ năng

Cột dạng bài theo thứ tự `MCQ / LISTEN_CHOOSE / DRAG_DROP / COUNT_TAP / READ_ALOUD / WRITE_PHOTO`.

| Kỹ năng | Bài | Mức 1/2/3/4/5 | Dạng bài | `targetsError` | Nguồn |
|---|---|---|---|---|---|
| `EMATH.G.COMPOSE_SHAPES` | 35 | 4/8/11/7/5 | 12/8/5/3/3/4 | 20 | CCSS 1.G.A.2 (composing shapes) — chưa có giáo trình English Maths của |
| `EMATH.G.NAME_2D_SHAPES` | 36 | 7/8/9/7/5 | 12/8/6/4/3/3 | 20 | CCSS K.G.A.2 (naming shapes) — chưa có giáo trình English Maths của tr |
| `EMATH.G.PATTERNS` | 35 | 5/7/9/8/6 | 12/8/6/3/3/3 | 20 | CCSS K.OA / 1.OA (repeating and growing patterns) — chưa có giáo trình |
| `EMATH.G.SHAPE_ATTRIBUTES` | 35 | 5/6/9/8/7 | 13/8/3/4/4/3 | 21 | CCSS 1.G.A.1 (defining attributes) — chưa có giáo trình English Maths  |
| `EMATH.MP.MATH_VOCAB_EN` | 35 | 6/9/8/7/5 | 12/8/7/0/5/3 | 20 | CCSS MP6 (math vocabulary in English) — chưa có giáo trình English Mat |
| `EMATH.MP.READ_WORD_PROBLEM_EN` | 35 | 2/8/9/8/8 | 14/8/6/0/4/3 | 22 | CCSS MP1 (making sense of word problems) — chưa có giáo trình English  |
| `EMATH.OA.COUNT_BACK` | 36 | 6/9/8/7/6 | 12/8/5/4/4/3 | 20 | CCSS 1.OA.C.5 (counting back to subtract) — chưa có giáo trình English |
| `EMATH.OA.COUNT_ON` | 36 | 6/9/8/7/6 | 12/8/5/4/4/3 | 20 | CCSS 1.OA.C.5 (counting on to add) — chưa có giáo trình English Maths  |
| `EMATH.OA.DOUBLES` | 35 | 6/8/9/7/5 | 12/8/5/3/4/3 | 20 | CCSS 1.OA.C.6 (doubles and near doubles) — chưa có giáo trình English  |
| `EMATH.OA.NUMBER_BONDS_10` | 39 | 6/10/10/7/6 | 15/8/6/3/4/3 | 23 | CCSS 1.OA.C.6 (part-part-whole to 10) — chưa có giáo trình English Mat |
| `EMATH.OA.PROPERTIES_COMMUTATIVE` | 35 | 4/6/9/8/8 | 14/8/6/0/4/3 | 22 | CCSS 1.OA.B.3 (properties of operations) — chưa có giáo trình English  |
| `EMATH.OA.RELATE_ADD_SUB` | 35 | 2/6/10/9/8 | 14/8/6/0/4/3 | 22 | CCSS 1.OA.B.4 (subtraction as an unknown-addend problem) — chưa có giá |
| `ENL.L.CAPITALIZATION` | 35 | 5/7/9/7/7 | 14/6/7/0/4/4 | 1 | Global Stage 1 Language Book Unit 1 Meet My Family (punctuation: capit |
| `ENL.L.CATEGORIES` | 36 | 6/7/9/7/7 | 12/6/10/0/4/4 | 0 | CCSS L.1.5a (sorting words into categories) — ENL chưa có giáo trình c |
| `ENL.L.END_PUNCTUATION` | 36 | 6/6/9/8/7 | 14/6/9/0/4/3 | 0 | Global Stage 1 Language Book Unit 2 This Is Delicious (question marks, |
| `ENL.L.SPELL_PHONETICALLY` | 36 | 5/8/8/8/7 | 12/8/6/0/4/6 | 20 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ENL.RF.FLUENCY_LEVEL_A` | 38 | 5/8/8/10/7 | 12/6/4/0/14/2 | 6 | Bài viết mới theo đặc điểm cấp A của Kids A-Z (CCSS RF.1.4) — không ch |
| `ENL.RF.FLUENCY_LEVEL_AA` | 38 | 5/8/8/11/6 | 12/6/4/0/14/2 | 6 | Bài viết mới theo đặc điểm cấp aa của Kids A-Z (CCSS RF.1.4) — không c |
| `ENL.RF.FLUENCY_LEVEL_B` | 38 | 5/8/8/9/8 | 12/6/4/0/14/2 | 6 | Bài viết mới theo đặc điểm cấp B của Kids A-Z (CCSS RF.1.4) — không ch |
| `ENL.RF.FLUENCY_LEVEL_C` | 38 | 5/8/8/9/8 | 12/6/4/0/14/2 | 6 | Bài viết mới theo đặc điểm cấp C của Kids A-Z (CCSS RF.1.4) — không ch |
| `ENL.RF.FLUENCY_LEVEL_D` | 38 | 5/8/8/8/9 | 12/6/4/0/14/2 | 6 | Bài viết mới theo đặc điểm cấp D của Kids A-Z (CCSS RF.1.4) — không ch |
| `ENL.RF.INFLECTIONS_S_ED_ING` | 35 | 4/9/10/6/6 | 12/8/6/0/6/3 | 6 | Global Stage 1 Language Book Unit 4 (viết: chính tả động từ đuôi -ing, |
| `ENL.RF.LONG_SHORT_VOWEL_DISTINCTION` | 35 | 4/8/8/8/7 | 14/10/3/0/5/3 | 6 | Global Stage 1 Literacy Book Unit 1–3 (GS1-LIT.U1) (long o, long e, lo |
| `ENL.RF.PRINT_CONCEPTS` | 35 | 7/9/9/5/5 | 16/8/2/0/6/3 | 17 | CCSS RF.1.1 (print concepts) — ENL chưa có giáo trình của trường |
| `ENL.RF.SEGMENT_PHONEMES` | 35 | 4/8/10/7/6 | 14/8/6/0/4/3 | 16 | Global Stage 1 Literacy Book Phonics Review (GS1-LIT.R) (segmenting so |
| `ENL.RF.SIGHT_WORDS_PRIMER` | 36 | 4/8/9/7/8 | 12/10/6/0/5/3 | 0 | CCSS RF.1.3g (Dolch primer sight words) — ENL chưa có giáo trình của t |
| `ENL.RF.SYLLABLES` | 35 | 5/5/13/7/5 | 16/8/3/0/5/3 | 24 | CCSS RF.1.2 (syllables) — ENL chưa có giáo trình của trường |
| `ENL.RI.PICTURE_INFO` | 35 | 3/8/9/9/6 | 14/8/5/0/5/3 | 8 | Global Stage 1 Literacy Book Unit 1 (predict from pictures, bảng chươn |
| `ENL.RL.CHARACTERS_SETTING` | 35 | 3/8/9/8/7 | 10/10/8/0/4/3 | 0 | Global Stage 1 Literacy Book Unit 2 (identify characters and setting,  |
| `ENL.RL.KEY_DETAILS` | 35 | 4/8/9/8/6 | 10/13/4/0/5/3 | 0 | CCSS RL.1.1 (key details) — truyện ngắn viết mới |
| `ENL.RL.PREDICTING` | 35 | 4/9/10/7/5 | 12/8/6/0/5/4 | 0 | Global Stage 1 Literacy Book Unit 1, 3, 7, 8, 10 (predict from picture |
| `ENL.SL.ASK_ANSWER` | 35 | 4/6/8/10/7 | 10/10/8/0/4/3 | 0 | CCSS SL.1.2 (ask and answer questions about what is read or heard) — E |
| `ENL.SL.COMPLETE_SENTENCES` | 35 | 4/6/8/8/9 | 12/8/6/0/6/3 | 11 | CCSS SL.1.6 (speaking in complete sentences) — ENL chưa có giáo trình  |
| `ENL.SL.DESCRIBE_DETAILS` | 35 | 4/9/10/7/5 | 12/8/6/0/5/4 | 0 | CCSS SL.1.4 (describing with relevant details) — ENL chưa có giáo trìn |
| `ENL.SL.FOLLOW_RULES_DISCUSSION` | 35 | 3/8/9/8/7 | 10/10/7/0/5/3 | 0 | CCSS SL.1.1a (rules for discussions) — ENL chưa có giáo trình của trườ |
| `ENL.W.INFORMATIVE` | 36 | 4/5/10/9/8 | 10/6/6/0/4/10 | 0 | Global Stage 1 Language Book Unit 4 Animals Are Awesome (An Awesome An |
| `ENL.W.LABEL_PICTURE` | 35 | 5/6/9/8/7 | 10/6/6/0/5/8 | 16 | CCSS W.1.2 (labelling pictures) — ENL chưa có giáo trình của trường |
| `ENL.W.SENTENCE` | 36 | 4/4/8/11/9 | 10/6/8/0/4/8 | 12 | Global Stage 1 Language Book Unit 3 Play With Me (sentence building: c |
| `ESCI.INQ.ASK_QUESTIONS` | 35 | 6/8/8/7/6 | 14/8/7/0/4/2 | 0 | NGSS SEP.1 (asking questions) — chưa có sách English Science của trườn |
| `ESCI.PS.COMMUNICATE_LIGHT_SOUND` | 35 | 4/9/9/8/5 | 15/8/3/0/6/3 | 0 | NGSS 1-PS4-4 (communicating with light and sound) — chưa có sách Engli |
| `ESCI.PS.HOT_COLD_TEMPERATURE` | 35 | 5/9/9/8/4 | 16/8/3/0/6/2 | 0 | Chuẩn quốc tế INTL.MATERIALS (hot and cold, thermometers) — chưa có sá |
| `ESCI.PS.LOUD_SOFT_HIGH_LOW` | 35 | 5/9/10/7/4 | 16/8/3/0/6/2 | 0 | NGSS 1-PS4-1 (loud / soft, high / low) — chưa có sách English Science  |
| `ESCI.PS.MAGNETS` | 35 | 5/8/8/9/5 | 16/8/4/0/5/2 | 0 | Chuẩn quốc tế INTL.FORCES (Cambridge Primary Science stage 1–2: magnet |
| `ESCI.PS.PUSH_PULL` | 35 | 4/10/10/8/3 | 16/8/4/0/5/2 | 0 | NGSS K-PS2-1 (pushes and pulls) — chưa có sách English Science của trư |
| `ESCI.PS.SOUND_VIBRATION` | 35 | 4/10/8/7/6 | 15/8/3/0/6/3 | 0 | NGSS 1-PS4-1 (sound and vibration) — chưa có sách English Science của  |
| `ESL.GR.CAN_CANT` | 35 | 4/8/10/9/4 | 12/8/8/0/5/2 | 0 | Global Stage 1 Language Book Unit 3 Play With Me tr.36 — Modal Can (bả |
| `ESL.GR.IS_ARE` | 35 | 5/7/8/9/6 | 13/8/8/0/4/2 | 16 | Global Stage 1 Language Book Unit 1 Meet My Family tr.10 — Simple Pres |
| `ESL.GR.PREPOSITIONS_IN_ON_UNDER` | 36 | 5/9/6/7/9 | 12/8/8/0/5/3 | 0 | Global Stage 1 Language Book Unit 5 (GS1-LB.U5) — nhật ký lớp gắn cho  |
| `ESL.GR.PRESENT_PROGRESSIVE` | 35 | 3/7/8/9/8 | 12/8/7/0/5/3 | 10 | Global Stage 1 Language Book Unit 4 Animals Are Awesome tr.48 — Presen |
| `ESL.GR.THIS_THAT` | 35 | 5/7/8/10/5 | 13/8/8/0/4/2 | 13 | Global Stage 1 Language Book Unit 3 Play With Me tr.36 — This / That / |
| `ESL.GR.WHAT_IS_THIS_IT_IS` | 35 | 5/7/8/10/5 | 13/8/8/0/4/2 | 3 | Global Stage 1 Language Book Unit 2 This Is Delicious tr.22 — What …?; |
| `ESL.LIS.NUMBERS_LETTERS_DICTATION` | 35 | 4/7/8/8/8 | 12/10/3/2/5/3 | 6 | Global Stage 1 Language Book, Language Review + Literacy Phonics Revie |
| `ESL.LIS.SHORT_DIALOGUE` | 35 | 4/5/10/9/7 | 10/14/5/0/4/2 | 0 | Kỹ năng nghe CCSS SL.1.2, dùng từ vựng Global Stage 1 Language Review– |
| `ESL.LIS.SHORT_INSTRUCTION` | 36 | 6/7/9/8/6 | 8/17/6/0/3/2 | 0 | Kỹ năng nghe CCSS SL.1.2, dùng từ vựng Global Stage 1 Language Review– |
| `ESL.LIS.SONG_CHANT` | 35 | 3/8/8/9/7 | 8/14/6/0/5/2 | 0 | Kỹ năng nghe CCSS SL.1.2, dùng từ vựng Global Stage 1 Language Review– |
| `ESL.LIS.WORD_PICTURE` | 40 | 5/9/9/9/8 | 8/20/6/0/4/2 | 22 | Global Stage 1 Language Book, từ vựng Language Review + Unit 1–3 (bảng |
| `ESL.PH.ALPHABET_NAMES` | 37 | 5/9/8/8/7 | 14/10/5/0/5/3 | 0 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.CVC_SHORT_A` | 39 | 2/10/11/8/8 | 16/8/6/0/6/3 | 18 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.CVC_SHORT_E` | 39 | 2/10/11/8/8 | 16/8/6/0/6/3 | 18 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.CVC_SHORT_I` | 38 | 2/10/11/8/7 | 15/8/6/0/6/3 | 17 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.CVC_SHORT_O` | 38 | 2/10/11/8/7 | 15/8/6/0/6/3 | 17 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.CVC_SHORT_U` | 39 | 2/10/11/8/8 | 16/8/6/0/6/3 | 18 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.INITIAL_SOUND_ID` | 35 | 4/9/8/7/7 | 14/8/5/0/5/3 | 22 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.PH.MAGIC_E` | 36 | 5/7/10/8/6 | 15/8/5/0/5/3 | 23 | Global Stage 1 Literacy Book Unit 1–3: long o / long e / long a (GS1-L |
| `ESL.PH.RHYMING_CVC` | 35 | 5/8/8/7/7 | 14/8/5/0/5/3 | 22 | Global Stage 1 Literacy Book, Phonics Review (GS1-LIT.R, bảng chương t |
| `ESL.SPK.ANSWER_WH` | 35 | 6/6/7/10/6 | 12/8/7/2/4/2 | 3 | Global Stage 1 Language Book Unit 1–2 — How many…? / What…? (bảng chươ |
| `ESL.SPK.ANSWER_YES_NO` | 35 | 4/7/10/9/5 | 14/8/6/0/5/2 | 1 | Global Stage 1 Language Book Language Review + Unit 1–3 — Be, Can, Lik |
| `ESL.SPK.ASK_QUESTIONS` | 35 | 4/6/9/11/5 | 14/8/7/0/4/2 | 2 | Global Stage 1 Language Book Unit 1–2 — How many…? / What…? (bảng chươ |
| `ESL.SPK.DESCRIBE_PICTURE` | 35 | 3/8/9/8/7 | 12/7/7/0/6/3 | 0 | Global Stage 1 Language Book Unit 4 Animals Are Awesome tr.48 — nói: t |
| `ESL.SPK.INTRODUCE_SELF` | 35 | 3/7/9/8/8 | 12/6/6/0/8/3 | 3 | Global Stage 1 Language Book Unit 1 Meet My Family tr.10 — nói: giới t |
| `ESL.VOC.ACTIONS_VERBS` | 41 | 6/10/10/8/7 | 17/8/5/4/4/3 | 0 | Global Stage 1 Language Book Unit 3 Play With Me tr.36 (GS1-LB.U3, bản |
| `ESL.VOC.ANIMALS_PETS` | 40 | 5/10/10/8/7 | 16/8/5/4/4/3 | 0 | Global Stage 1 Language Book Unit 1 (GS1-LB.U1, bảng chương trình) + L |
| `ESL.VOC.BODY` | 41 | 6/10/10/8/7 | 17/8/5/4/4/3 | 0 | Global Stage 1 Language Book, Language Review (GS1-LB.R, bảng chương t |
| `ESL.VOC.CLASSROOM_COMMANDS` | 35 | 4/7/10/9/5 | 12/8/7/0/5/3 | 0 | Global Stage 1 Language Book Language Review — Imperatives (bảng chươn |
| `ESL.VOC.COLORS` | 41 | 5/11/10/8/7 | 16/8/5/4/5/3 | 0 | Global Stage 1 Language Book, Language Review (GS1-LB.R, bảng chương t |
| `ESL.VOC.GREETINGS` | 35 | 4/8/8/9/6 | 12/8/7/0/5/3 | 2 | Global Stage 1 Language Book Unit 1 Meet My Family tr.10 — nói: giới t |
| `ESL.VOC.SCHOOL_OBJECTS` | 41 | 6/10/10/8/7 | 17/8/5/4/4/3 | 0 | Global Stage 1 Language Book, Language Review (GS1-LB.R, bảng chương t |
| `ESL.VOC.SHAPES` | 39 | 5/11/10/7/6 | 14/8/5/4/5/3 | 0 | Global Stage 1 Language Book, Language Review (GS1-LB.R, bảng chương t |
| `ESL.VOC.TOYS` | 42 | 6/11/10/8/7 | 18/8/5/4/4/3 | 0 | Global Stage 1 Language Book Unit 3 Play With Me tr.36 (GS1-LB.U3, bản |
| `VIET.DOC.DOC_CAU` | 44 | 9/10/10/9/6 | 14/8/5/0/15/2 | 8 | SGK Tiếng Việt 1 tập một, mục 4 Đọc của Bài 16–31 (tr.44–75) và Bài 30 |
| `VIET.HV.AM_PH_QU` | 45 | 6/12/12/9/6 | 19/10/7/0/6/3 | 36 | SGK Tiếng Việt 1 tập một, Bài 26 tr.64–65 (Ph ph, Qu qu) |
| `VIET.HV.AM_V_X` | 42 | 6/12/10/9/5 | 18/9/7/0/5/3 | 34 | SGK Tiếng Việt 1 tập một, Bài 27 tr.66–67 (V v, X x) |
| `VIET.HV.AM_Y` | 36 | 3/9/9/8/7 | 11/5/6/0/9/5 | 22 | SGK Tiếng Việt 1 tập một, Bài 28 tr.68–69 (Y y) |
| `VIET.HV.CHU_CAI_29` | 40 | 7/9/11/7/6 | 16/8/8/0/6/2 | 26 | SGK Tiếng Việt 1 tập một, bảng chữ cái cuối sách (29 chữ) — chưa gắn b |
| `VIET.HV.NHAM_LAN_C_K_Q` | 46 | 4/11/13/12/6 | 20/14/4/0/5/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 3 (C c), Bài 11 (I i, K k), Bài 26 tr.64 |
| `VIET.HV.NHAM_LAN_DAU_HOI_NGA` | 39 | 7/7/9/9/7 | 16/10/4/0/6/3 | 30 | SGK Tiếng Việt 1 tập một, Bài 6 (dấu hỏi) và Bài 9 (dấu ngã); tiếng lấ |
| `VIET.HV.NHAM_LAN_P_Q` | 37 | 6/8/10/8/5 | 18/8/3/0/5/3 | 29 | SGK Tiếng Việt 1 tập một, Bài 26 tr.64–65 (p – ph, qu) |
| `VIET.HV.NHAM_LAN_S_X` | 47 | 3/9/12/12/11 | 17/18/4/0/5/3 | 39 | SGK Tiếng Việt 1 tập một, Bài 21 tr.54–55 (R r, S s) và Bài 27 tr.66–6 |
| `VIET.HV.VAN_ACH_EECH_ICH` | 42 | 6/11/10/9/6 | 17/9/7/0/6/3 | 33 | SGK Tiếng Việt 1 tập một, Bài 58 tr.128–129 (ach êch ich) |
| `VIET.HV.VAN_AC_AWC_AAC` | 44 | 6/11/11/10/6 | 17/11/7/0/6/3 | 35 | SGK Tiếng Việt 1 tập một, Bài 46 tr.104–105 (ac ăc âc) |
| `VIET.HV.VAN_AI_AY_AAY` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 38 tr.88–89 (ai ay ây) |
| `VIET.HV.VAN_AM_AWM_AAM` | 44 | 6/11/12/8/7 | 16/13/6/0/6/3 | 35 | SGK Tiếng Việt 1 tập một, Bài 34 tr.80–81 (am ăm âm) |
| `VIET.HV.VAN_ANG_AWNG_AANG` | 46 | 6/11/12/10/7 | 17/13/7/0/6/3 | 37 | SGK Tiếng Việt 1 tập một, Bài 59 tr.130–131 (ang ăng âng) |
| `VIET.HV.VAN_ANH_EENH_INH` | 40 | 6/11/10/7/6 | 16/9/6/0/6/3 | 31 | SGK Tiếng Việt 1 tập một, Bài 57 tr.126–127 (anh ênh inh) |
| `VIET.HV.VAN_AN_AWN_AAN` | 46 | 6/11/12/10/7 | 17/13/7/0/6/3 | 37 | SGK Tiếng Việt 1 tập một, Bài 31 tr.74–75 (an ăn ân) |
| `VIET.HV.VAN_AO_EO` | 43 | 6/12/10/9/6 | 18/9/7/0/6/3 | 34 | SGK Tiếng Việt 1 tập một, Bài 42 tr.96–97 (ao eo) |
| `VIET.HV.VAN_AP_AWP_AAP` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 53 tr.118–119 (ap ăp âp) |
| `VIET.HV.VAN_AT_AWT_AAT` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 48 tr.108–109 (at ăt ât) |
| `VIET.HV.VAN_AU_AAU_EEU` | 46 | 6/12/11/10/7 | 18/12/7/0/6/3 | 37 | SGK Tiếng Việt 1 tập một, Bài 43 tr.98–99 (au âu êu) |
| `VIET.HV.VAN_EM_EEM_IM_UM` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 37 tr.86–87 (em êm im um) |
| `VIET.HV.VAN_EN_EEN_IN_UN` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 33 tr.78–79 (en ên in un) |
| `VIET.HV.VAN_EP_EEP_IP_UP` | 44 | 6/11/11/10/6 | 17/11/7/0/6/3 | 35 | SGK Tiếng Việt 1 tập một, Bài 56 tr.124–125 (ep êp ip up) |
| `VIET.HV.VAN_ET_EET_IT` | 44 | 6/11/12/8/7 | 16/13/6/0/6/3 | 35 | SGK Tiếng Việt 1 tập một, Bài 51 tr.114–115 (et êt it) |
| `VIET.HV.VAN_IU_UWU` | 41 | 6/11/11/7/6 | 16/9/6/0/7/3 | 31 | SGK Tiếng Việt 1 tập một, Bài 44 tr.100–101 (iu ưu) |
| `VIET.HV.VAN_OC_OOC_UC_UWC` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 47 tr.106–107 (oc ôc uc ưc) |
| `VIET.HV.VAN_OI_OOI_OWI` | 44 | 6/11/12/8/7 | 16/13/6/0/6/3 | 35 | SGK Tiếng Việt 1 tập một, Bài 39 tr.90–91 (oi ôi ơi) |
| `VIET.HV.VAN_OM_OOM_OWM` | 46 | 6/11/12/10/7 | 17/13/7/0/6/3 | 37 | SGK Tiếng Việt 1 tập một, Bài 36 tr.84–85 (om ôm ơm) |
| `VIET.HV.VAN_ON_OON_OWN` | 48 | 6/12/13/10/7 | 18/13/7/0/7/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 32 tr.76–77 (on ôn ơn) |
| `VIET.HV.VAN_OP_OOP_OWP` | 47 | 6/12/12/10/7 | 18/13/7/0/6/3 | 38 | SGK Tiếng Việt 1 tập một, Bài 54 tr.120–121 (op ôp ơp) |
| `VIET.HV.VAN_OT_OOT_OWT` | 46 | 6/11/12/10/7 | 17/13/7/0/6/3 | 37 | SGK Tiếng Việt 1 tập một, Bài 49 tr.110–111 (ot ôt ơt) |
| `VIET.HV.VAN_UI_UWI` | 45 | 6/12/11/10/6 | 18/11/7/0/6/3 | 36 | SGK Tiếng Việt 1 tập một, Bài 41 tr.94–95 (ui ưi) |
| `VIET.HV.VAN_UT_UWT` | 44 | 6/11/12/8/7 | 16/13/6/0/6/3 | 35 | SGK Tiếng Việt 1 tập một, Bài 52 tr.116–117 (ut ưt) |
| `VIET.NN.CHAO_HOI_LE_PHEP` | 35 | 8/8/8/6/5 | 14/8/3/0/7/3 | 0 | SGK Tiếng Việt 1, mục Nói 'Cảm ơn' (Bài 26, 28), 'Xin lỗi' (Bài 31, 33 |
| `VIET.NN.KE_LAI` | 35 | 5/7/9/7/7 | 12/11/4/0/5/3 | 0 | SGK Tiếng Việt 1 tập một, mục Kể chuyện: Bài 30 tr.73 (Kiến và dế mèn) |
| `VIET.NN.NOI_THEO_TRANH` | 35 | 8/6/8/7/6 | 15/6/4/0/6/4 | 0 | SGK Tiếng Việt 1 tập một, mục 'Nói theo tranh' của các bài học âm (Bài |
| `VIET.NN.TRA_LOI_CAU_HOI` | 35 | 7/8/9/6/5 | 13/8/4/0/6/4 | 0 | SGK Tiếng Việt 1 tập một, hoạt động hỏi – đáp của mục 'Nói theo tranh' |
| `VIET.VIET.CHINH_TA_NGHE_VIET` | 42 | 7/11/9/8/7 | 12/8/6/0/4/12 | 20 | SGK Tiếng Việt 1 tập một, Bài 29 tr.70–71 (Luyện tập chính tả); câu ch |
| `VIET.VIET.TO_CHU_THUONG` | 39 | 5/7/11/8/8 | 14/6/4/0/3/12 | 6 | SGK Tiếng Việt 1 tập một, Bài 1 và mục Tô và viết của các bài học âm;  |
| `VIET.VIET.VIET_CAU_CHINH_TA_NHIN` | 44 | 8/11/9/8/8 | 12/8/6/0/6/12 | 20 | SGK Tiếng Việt 1 tập một, Bài 29 tr.70–71 (Luyện tập chính tả); câu ch |
| `VIET.VIET.VIET_CHU_SO` | 36 | 5/7/10/7/7 | 12/8/4/0/0/12 | 0 | SGK Tiếng Việt 1 tập một, trang mẫu chữ số (cuối sách) và vở Tập viết  |
| `VIET.VIET.VIET_TU_VAN` | 42 | 7/11/9/8/7 | 12/8/6/0/4/12 | 20 | SGK Tiếng Việt 1 tập một, Bài 13 tr.38–39 (mục 3 Tô và viết) |
| `VMATH.GT.BAI_TOAN_THEM` | 36 | 2/7/11/10/6 | 12/8/6/4/3/3 | 26 | SGK Toán 1 tập một, Bài 10 tr.56 và Bài 18 (bài toán có lời văn dạng t |
| `VMATH.HH.HINH_VUONG_TRON_TAM_GIAC_CN` | 37 | 6/9/10/9/3 | 15/6/5/4/4/3 | 21 | SGK Toán 1 tập một, Bài 7 tr.46–49 |
| `VMATH.HH.LAP_GHEP_XEP_HINH` | 36 | 7/9/10/6/4 | 13/6/6/4/3/4 | 19 | SGK Toán 1 tập một, Bài 8 Thực hành lắp ghép, xếp hình tr.50–53 |
| `VMATH.HH.NHAN_DANG_HINH_THUC_TE` | 36 | 6/8/10/7/5 | 12/6/8/4/3/3 | 18 | SGK Toán 1 tập một, Bài 9 Luyện tập chung tr.54–55 |
| `VMATH.SO.CONG_PV_5` | 42 | 7/11/10/8/6 | 18/7/6/4/4/3 | 31 | SGK Toán 1 tập một, Bài 10 Phép cộng trong phạm vi 10 tr.56–67 (phần p |
| `VMATH.SO.CONG_VOI_0` | 42 | 7/11/10/8/6 | 18/7/6/4/4/3 | 31 | SGK Toán 1 tập một, Bài 10 tr.56–67 (cộng với 0) |
| `VMATH.SO.DEM_DEN_10_THUOC_LONG` | 40 | 10/9/11/7/3 | 18/6/5/4/4/3 | 24 | SGK Toán 1 tập một, Tiết học đầu tiên tr.6–7 |
| `VMATH.SO.NHAN_BIET_SO_LUONG_1_5` | 37 | 6/9/10/9/3 | 12/7/6/4/5/3 | 19 | SGK Toán 1 tập một, Bài 1 tr.8–13 |
| `VMATH.SO.TRU_PV_5` | 42 | 7/11/10/8/6 | 18/7/6/4/4/3 | 31 | SGK Toán 1 tập một, Bài 11 Phép trừ trong phạm vi 10 tr.68–79 (phần ph |
