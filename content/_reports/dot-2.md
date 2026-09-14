# Đợt 2 — báo cáo soạn nội dung (pha 6a)

**Ngày:** 12/09/2026 · **Người soạn:** Claude Code · **Phạm vi:** `docs/10` §9 đợt 2, theo thứ tự
ưu tiên của đề bài pha 6a — (1) kỹ năng lớp đang học, (2) English Science, (3) English Maths,
(4) ESL/ENL tuần 1–12.

**Chạy song song với pha 8c.** Không dựng lại Docker, không sửa một dòng code nào của app; chỉ soạn
file trong `content/`, chạy `content:import`, và đồng bộ `exerciseTypes` của đúng 47 kỹ năng đã đổi.
Không có ngày học nào bị gián đoạn (mục 7).

---

## 1. Số liệu

- **34 kỹ năng mới · 1.463 bài · tất cả đã `PUBLISHED`.**
- Theo môn: **ESCI 442** (từ 0) · VIET 517 · EMATH 257 · ESL 167 · ENL 80.
- Ngân hàng sau đợt 2: **2.676 bài / 62 kỹ năng** (đợt 1: 1.236 / 28), 24 bài nghỉ hưu (mục 5).
- Mức khó toàn ngân hàng: 1 → 446 · 2 → 668 · 3 → 633 · 4 → 543 · 5 → 386.
- Giọng đọc: **1.858/1.858 câu đã có mp3**, dùng 24.945/500.000 ký tự Azure tháng 09 (5%).

### 1.1 Nguồn

| Môn | Nguồn | Ghi chú `sourceRef` |
|---|---|---|
| Tiếng Việt | SGK Tiếng Việt 1 tập một, bài 2–13 | Ghi số trang sách thật (bài 7 tr.26, bài 11 tr.34, bài 12 tr.36, bài 13 tr.38–39) |
| English Science | **NGSS lớp 1** (1-LS1, 1-PS4-1…4) và chủ đề Materials của chương trình quốc tế | Mỗi bài ghi rõ *"chưa có sách English Science của trường"* — `docs/09` §1 ưu tiên 3 |
| English Maths | CCSS 1.OA.C.6, 1.NBT.A.1, 1.NBT.B.3 | Ghi rõ *"chưa có giáo trình English Maths của trường"* |
| ESL / ENL | Bảng *Scope and Sequence* Global Stage 1 (`docs/09` §4b) | Ghi rõ *"chưa chụp trang sách"* — phải rà lại khi có ảnh trang (§4b.4) |

### 1.2 Bảng từng kỹ năng

Cột dạng bài theo thứ tự `MCQ / LISTEN_CHOOSE / DRAG_DROP / COUNT_TAP / READ_ALOUD / WRITE_PHOTO`.

| Kỹ năng | Bài | Mức 1/2/3/4/5 | Dạng bài | Có nhiễu chẩn đoán | `model` | `targetsError` | robot/garden |
|---|---|---|---|---|---|---|---|
| `EMATH.NBT.COMPARE_1_10` | 41 | 4/12/10/9/6 | 22/6/5/4/4/0 | 28 | 7 | 28 | 2/2 |
| `EMATH.NBT.NUMBER_LINE_TO_20` | 41 | 3/10/11/9/8 | 20/6/5/4/6/0 | 26 | 7 | 26 | 2/2 |
| `EMATH.NBT.ORDINAL_NUMBERS` | 40 | 3/12/12/7/6 | 18/6/6/4/6/0 | 24 | 7 | 24 | 6/6 |
| `EMATH.OA.ADD_WITHIN_5` | 45 | 7/12/10/9/7 | 18/7/7/5/5/3 | 32 | 8 | 32 | 5/6 |
| `EMATH.OA.SUB_WITHIN_5` | 45 | 7/12/10/9/7 | 18/7/7/5/5/3 | 32 | 8 | 32 | 5/6 |
| `EMATH.OA.SUB_WITHIN_10` | 45 | 7/12/10/9/7 | 18/7/7/5/5/3 | 32 | 8 | 32 | 5/6 |
| `ENL.RF.BLEND_PHONEMES` | 40 | 4/9/9/9/9 | 10/10/8/0/12/0 | 20 | 7 | 20 | 5/5 |
| `ENL.RF.ISOLATE_SOUNDS` | 40 | 3/11/10/8/8 | 15/10/6/0/9/0 | 15 | 9 | 0 | 7/8 |
| `ESCI.INQ.OBSERVE_DESCRIBE` | 44 | 7/11/11/9/6 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.INQ.PREDICT` | 44 | 6/12/11/9/6 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.INQ.SORT_CLASSIFY` | 44 | 6/12/11/8/7 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.LS.LIVING_NONLIVING` | 46 | 6/13/12/8/7 | 20/10/5/4/4/3 | 0 | 9 | 0 | 6/6 |
| `ESCI.LS.NEEDS_OF_LIVING_THINGS` | 44 | 6/13/11/8/6 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.PS.FLOAT_SINK` | 44 | 7/11/10/9/7 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.PS.LIGHT_MATERIALS` | 44 | 6/11/11/8/8 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.PS.LIGHT_SEE` | 44 | 6/12/10/9/7 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.PS.MATERIALS_PROPERTIES` | 44 | 6/12/11/9/6 | 18/10/5/4/4/3 | 0 | 9 | 0 | 5/5 |
| `ESCI.VOC.MATERIALS` | 44 | 6/12/11/8/7 | 18/10/5/4/4/3 | 6 | 9 | 6 | 5/5 |
| `ESL.GR.HOW_MANY` | 41 | 3/9/11/11/7 | 16/8/8/4/5/0 | 32 | 7 | 24 | 6/6 |
| `ESL.PH.SPELL_CVC` | 41 | 3/11/9/9/9 | 12/12/8/0/5/4 | 24 | 7 | 24 | 6/6 |
| `ESL.VOC.ANIMALS_FARM` | 40 | 6/11/9/7/7 | 12/8/6/5/5/4 | 0 | 9 | 0 | 8/9 |
| `ESL.VOC.NUMBERS_1_20` | 45 | 6/10/11/9/9 | 18/7/6/5/5/4 | 10 | 9 | 10 | 7/8 |
| `VIET.DOC.DOC_TIENG` | 40 | 8/11/9/7/5 | 10/8/6/0/12/4 | 18 | 6 | 18 | 3/7 |
| `VIET.DOC.DOC_TU` | 42 | 7/10/9/8/8 | 12/8/8/0/10/4 | 28 | 6 | 28 | 4/8 |
| `VIET.HV.AM_H_L` | 48 | 6/12/13/11/6 | 20/13/7/0/5/3 | 39 | 8 | 39 | 2/7 |
| `VIET.HV.AM_I_K` | 41 | 6/12/12/7/4 | 15/9/7/0/6/4 | 27 | 8 | 27 | 5/3 |
| `VIET.HV.AM_OO` | 46 | 6/12/12/10/6 | 18/13/7/0/5/3 | 38 | 8 | 38 | 2/5 |
| `VIET.HV.AM_OW` | 43 | 6/11/12/8/6 | 16/13/6/0/5/3 | 35 | 8 | 35 | 2/2 |
| `VIET.HV.DANH_VAN_TIENG` | 40 | 5/11/12/9/3 | 17/8/7/0/5/3 | 32 | 7 | 32 | 0/0 |
| `VIET.HV.DAU_HOI` | 43 | 5/11/12/9/6 | 16/12/7/0/5/3 | 35 | 8 | 35 | 2/4 |
| `VIET.HV.DAU_HUYEN` | 46 | 5/12/13/10/6 | 19/12/7/0/5/3 | 38 | 8 | 38 | 2/7 |
| `VIET.HV.DAU_NANG` | 41 | 5/11/12/7/6 | 15/12/6/0/5/3 | 33 | 8 | 33 | 2/2 |
| `VIET.HV.DAU_NGA` | 41 | 5/11/11/7/7 | 14/12/5/0/6/4 | 31 | 8 | 31 | 0/2 |
| `VIET.HV.DAU_SAC` | 46 | 5/12/13/10/6 | 19/12/7/0/5/3 | 38 | 8 | 38 | 3/6 |

**Vì sao mười gói ESCI có 0 `targetsError`:** bộ mã lỗi 44 mã của `04` §11 không có mã nào tả được
"con nghĩ ô tô là vật sống". Bịa một mã mới sẽ khiến thang ôn tập đuổi theo nhầm thứ — đúng lý do
validator chỉ *cảnh báo* chứ không chặn với môn không phải Toán và không phải học vần. `ESCI.VOC.MATERIALS`
là ngoại lệ: ô nhiễu ở đó là chính từ đó viết lệch một chữ (`metel`, `plastik`) nên `sai_chinh_ta_tu`
nói đúng.

---

## 2. Cách soạn — vì sao lần này có bộ sinh

Đợt 1 viết tay 1.236 bài và bộ 20 bài mẫu lộ ra **9 lỗi hệ thống**, mỗi lỗi ảnh hưởng hàng chục tới
hàng trăm bài (`dot-1.md` §4). Nguyên nhân chung: cùng một quyết định sai được chép lại ở nhiều chỗ.

Đợt 2 tách hẳn hai phần:

- **Phần sư phạm viết tay** — từ ngữ, con số, phương án sai và *vì sao* trẻ 6 tuổi chọn nó. Đây là
  các bảng dữ liệu trong `scripts/content-gen/*.mjs`, đọc được như một giáo án.
- **Phần lặp do máy** — mã bài ổn định, xoay câu lệnh và gợi ý, rải mức khó, đổi vị trí đáp án.

Nhờ vậy một lỗi chỉ phải sửa **một chỗ** rồi sinh lại; và bảng dữ liệu buộc phải chọn thẻ lỗi cho
từng mục một chứ không gắn theo thói quen. Sáu file:

| File | Gói |
|---|---|
| `viet-tones.mjs` | 5 gói dấu thanh |
| `viet-letters.mjs` | âm ô, ơ, i–k, h–l |
| `viet-doc.mjs` | đánh vần, đọc tiếng, đọc từ (bài 13 — bài lớp đang học) |
| `esci.mjs` | 10 gói English Science |
| `emath.mjs` | 6 gói English Maths |
| `esl-enl.mjs` | 4 gói ESL + 2 gói ENL |
| `patch-skill-map.mjs` | Ghi lại đúng những thay đổi bản đồ kỹ năng (mục 6) |
| `retire-count-tap-phonics.mjs` | Nghỉ hưu 23 bài đếm nằm nhầm gói (mục 5) |

### 2.1 Bốn chỗ đợt 1 vấp, đợt 2 chặn bằng cấu trúc dữ liệu

| Lỗi đợt 1 | Đợt 2 chặn thế nào |
|---|---|
| #2 "Tiếng nào có âm ư?" mà cả hai đáp án đều có ư | Mỗi tiếng trong bảng bắt buộc có trường `without` — một tiếng **thật** không chứa âm đang hỏi |
| #8 Nhiễu gắn sai mã (471 bài) | Toán: nhiễu **tính ra từ đáp án** (`answer-1` → `dem_thieu_1`, phép ngược → `nham_cong_tru`), sai mã là không thể. Tiếng Việt: mỗi từ trong bảng tự khai mã lỗi của riêng nó |
| #9 Nhiễu là tiếng không có nghĩa (`trè`, `trỉ`) | Mọi tiếng nhiễu đều là tiếng thật trong phạm vi bài đã học; bảng từ viết tay, không sinh máy móc |
| 214 bài dùng chung một câu lệnh | 6 biến thể câu lệnh và 4–6 biến thể gợi ý **mỗi dạng bài mỗi gói**; `checkPromptVariety` sạch |

### 2.2 Tiếng Việt: chỉ dùng chữ lớp đã học

Validator `tieng-viet-progression.ts` canh từng tiếng con phải **đọc** (ô lựa chọn, thẻ kéo, câu đọc
to). Nhờ nó, gói dấu huyền chỉ dùng a b c d đ e ê o ô ơ, gói bài 13 mới được dùng thêm i k h l u ư.
Câu đọc to vì thế là câu thật của sách: *"bà bế bé"*, *"bò ở bờ cỏ"*, *"bố có cá"*, *"hổ ở bờ hồ"*,
*"đu đủ"*, *"cá cờ"*.

---

## 3. Tự chấm rubric `docs/10` §6 — 20 bài chọn ngẫu nhiên

**Cách chọn (tái lập được):** lấy toàn bộ 1.463 bài của **đợt 2** (lọc theo đúng 34 gói), sắp theo
`sha256("pha-6a-dot-2" + stableId)`, lấy 20 bài đầu. Không chọn tay. QC chạy lại đúng bộ này:

```powershell
node scripts/sample-exercises.mjs pha-6a-dot-2 20 "" --only='^(esci/|emath/(NBT\.COMPARE_1_10|NBT\.NUMBER_LINE_TO_20|NBT\.ORDINAL_NUMBERS|OA\.ADD_WITHIN_5|OA\.SUB_WITHIN_5|OA\.SUB_WITHIN_10)|enl/RF\.(BLEND_PHONEMES|ISOLATE_SOUNDS)|esl/(VOC\.NUMBERS_1_20|VOC\.ANIMALS_FARM|PH\.SPELL_CVC|GR\.HOW_MANY)|viet/(HV\.DAU_(HUYEN|SAC|HOI|NANG|NGA)|HV\.AM_(OO|OW|I_K|H_L)|HV\.DANH_VAN_TIENG|DOC\.DOC_(TIENG|TU)))'
```

| # | `stableId` | Kỹ năng | Dạng | Khó | Đọc kỹ thấy gì | Đạt? |
|---|---|---|---|---|---|---|
| 1 | `esl-animal-0037` | ESL.VOC.ANIMALS_FARM | WRITE_PHOTO | 2 | "Draw and label: cow, pig." — 5 từ, rubric chấm nêu đủ 3 tiêu chí. | ✅ |
| 2 | `emath-ord-0025` | EMATH.NBT.ORDINAL_NUMBERS | DRAG_DROP | 2 | Đề cho **hai** vị trí (first, third), con suy ra con ở giữa. | ✅ |
| 3 | `esci-predict-0037` | ESCI.INQ.PREDICT | COUNT_TAP | 4 | "Count them all: drops that will fall." — đếm gắn với chính dự đoán. | ✅ |
| 4 | `viet-huyen-0044` | VIET.HV.DAU_HUYEN | WRITE_PHOTO | 3 | "Viết vào vở: bà, cà, cò." — cả ba tiếng trong phạm vi bài 9. | ✅ |
| 5 | `esci-vocmat-0007` | ESCI.VOC.MATERIALS | MCQ | 2 | "Tap an object, not a material." → `spoon` vs `wood`/`plastic`; đúng chỗ trẻ lẫn vật với vật liệu. | ✅ |
| 6 | `viet-amhl-0028` | VIET.HV.AM_H_L | LISTEN_CHOOSE | 3 | Nghe "hẹ"; `bẹ` mang `nham_am_dau` (cùng vần khác âm đầu), `hạ` mang `doc_nham_van`. | ✅ |
| 7 | `viet-doctieng-0016` | VIET.DOC.DOC_TIENG | LISTEN_CHOOSE | 1 | Nghe "cờ" giữa `cờ`/`cớ`/`cỏ` — ba tiếng thật, đề không in tiếng được đọc. | ✅ |
| 8 | `viet-nga-0014` | VIET.HV.DAU_NGA | MCQ | 5 | Bốn ô `đà`/`đã`/`đá`/`đả` — cùng con chữ, khác dấu, đều là tiếng thật. | ✅ |
| 9 | `esci-float-0021` | ESCI.PS.FLOAT_SINK | LISTEN_CHOOSE | 5 | Nghe **câu lệnh** "Tap something that floats." → chọn `bottle` giữa `coin`/`rock`. Đo nổi–chìm, không phải từ vựng. | ✅ |
| 10 | `enl-blend-0015` | ENL.RF.BLEND_PHONEMES | MCQ | 5 | "b - e - d" → `bed`; `red` là `nham_am_dau`, `bet` là `doc_nham_van`. | ✅ |
| 11 | `esl-animal-0035` | ESL.VOC.ANIMALS_FARM | READ_ALOUD | 5 | "Look at the tall giraffe." — câu của Unit 4 Global Stage. | ✅ |
| 12 | `viet-hoi-0043` | VIET.HV.DAU_HOI | WRITE_PHOTO | 5 | "Viết lại giúp {ban}: cả, để, ở." | ✅ |
| 13 | `viet-amik-0030` | VIET.HV.AM_I_K | DRAG_DROP | 3 | Tranh 🎃, kéo `bí`; thẻ nhiễu `bá` (`doc_nham_van`), `kí` (`nham_am_dau`); thẻ đúng không mang mã (ADR-15). | ✅ |
| 14 | `esci-living-0035` | ESCI.LS.LIVING_NONLIVING | DRAG_DROP | 2 | Bốn thẻ `flower`/`cup`/`butterfly`/`book` vào hai rổ Living / Not living. | ✅ |
| 15 | `enl-isolate-0017` | ENL.RF.ISOLATE_SOUNDS | LISTEN_CHOOSE | 3 | "Listen, then tap the first sound." nghe "cat" → `c`; hai ô sai là `t`, `a` — **âm có thật trong chính từ đó**. | ✅ |
| 16 | `viet-huyen-0042` | VIET.HV.DAU_HUYEN | READ_ALOUD | 3 | "bò ở bờ cỏ" — bốn tiếng, đủ dấu huyền và dấu hỏi. | ✅ |
| 17 | `viet-amoo-0044` | VIET.HV.AM_OO | WRITE_PHOTO | 3 | "Viết vào vở: cô, bố, ô." | ✅ |
| 18 | `emath-line-0009` | EMATH.NBT.NUMBER_LINE_TO_20 | MCQ | 4 | "Which number comes after 19?" → 20; `19` mang `dem_thieu_1`, `18` là ô nhiễu không gắn mã. | ✅ |
| 19 | `esl-cvc-0011` | ESL.PH.SPELL_CVC | MCQ | 1 | Tranh 🗺️ → `map`; `mapp` là `sai_chinh_ta_tu`, `mop` là `nham_nguyen_am_ngan`. | ✅ |
| 20 | `enl-isolate-0023` | ENL.RF.ISOLATE_SOUNDS | LISTEN_CHOOSE | 5 | Nghe "hen" → `h`, giữa `n` và `e`. | ✅ |

**Kết quả tự chấm: 20/20 đạt — sau một vòng sửa.** Vòng chấm đầu chỉ **16/20**; mục 4 ghi đúng
những gì đã hỏng.

---

## 4. Lỗi tự tìm ra khi chấm và đã sửa

| # | Lỗi | Vi phạm | Ảnh hưởng | Đã sửa thế nào |
|---|---|---|---|---|
| 1 | Câu hỏi tiếng Anh ghép máy móc từ một danh từ: **"Tap the a thing, not a material one."** | Rubric 3 (đề phải đọc được) | **~100 bài** — toàn bộ mục ① và ② của 10 gói ESCI | Mỗi nhóm khai hai cách gọi tên: `is` (đi sau *"Which one is"*) và `noun` (đi sau *"Find"*). Không còn ghép chuỗi mù |
| 2 | Bài đếm trong gói "vật sống" là **đếm hòn đá** | Rubric 1 (đúng kỹ năng) | 40 bài COUNT_TAP của 10 gói ESCI | Câu lệnh gọi tên nhóm đang học: *"Count the living things."*, *"Count the metal spoons."*, *"Count the things that float."* |
| 3 | Bài nghe của gói khoa học chỉ đo **từ vựng** ("nghe 'ball', chọn tranh quả bóng") | Rubric 1 | 70 bài LISTEN_CHOOSE của 10 gói ESCI | Thêm 3 bài mỗi gói nghe **câu lệnh phân loại** (*"Tap something that floats."*) với 1 ô đúng + 2 ô của nhóm kia; phần từ vựng giữ lại vì con vẫn đang học tiếng Anh |
| 4 | Nghe từ rồi chọn **âm đầu**, nhưng đề nói *"{ban} đọc một từ. Chạm vào nó!"* | Rubric 3 (một câu hỏi, một việc) | 8 bài `ENL.RF.ISOLATE_SOUNDS` | Bộ đề riêng: *"Listen, then tap the first sound."* |
| 5 | Xếp hàng số thứ tự nhưng đề **kể sẵn cả ba con theo đúng thứ tự** | Rubric 4 (đề in sẵn đáp án) | 6 bài `EMATH.NBT.ORDINAL_NUMBERS` | Đề chỉ cho vị trí thứ nhất và thứ ba; con phải suy ra con ở giữa |
| 6 | `thieu_s_so_nhieu` không khớp vì **dấu chấm cuối câu** ("There are five pens." vs "…pen.") | Rubric 11 | 8 bài `ESL.GR.HOW_MANY` | Bỏ dấu chấm trong ô lựa chọn; thẻ lỗi so khớp cả chuỗi nên một dấu chấm là hỏng |
| 7 | Gợi ý và lời giải thích bắt đầu bằng chữ thường (*"dấu huyền là…"*, *"quả cà đọc là…"*) | Rubric 6 (đọc to nghe tự nhiên) | ~200 bài | Hàm `cap()` trong `lib.mjs`; mascot đọc to nên câu phải là câu |
| 8 | `nham_chu_gan_giong` gắn cho cặp **ê / ơ** — không phải hai chữ nhìn giống nhau | Rubric 11 | 1 bài, validator bắt | Đổi `hế` (không phải tiếng chuẩn) thành `hẹ` (rau hẹ), cặp gần giống là `hẹ`/`hệ` |
| 9 | Bài nghe bị đề in mất đáp án khi tiếng được đọc là **"ô"** (đề: *"Nghe rồi chọn **ô** đúng nhé!"*) | ADR-14 | 12 bài, validator bắt | `listenPrompt()` bỏ qua mọi câu lệnh có chứa chính tiếng sắp đọc |
| 10 | Bài chọn dấu ở hai đầu tia số chỉ còn **hai** ô (20 không có "thừa 1") | Rubric 4 (nhiễu hợp lý) | 2 bài | Khi hết chỗ ở trên thì lấy `đáp án − 2` làm ô nhiễu thứ ba, không gắn mã |

Ba lỗi trong số đó (#1, #2, #3) là **cùng một gốc**: gói ESCI sinh từ một khuôn chung, nên một
quyết định sai nhân lên mười gói. Đó cũng chính là lý do bộ 20 bài mẫu phải chọn ngẫu nhiên —
đọc tay từng gói sẽ không bao giờ thấy.

---

## 5. Vòng phản hồi thật đầu tiên — `exercise-health.csv`

**Trước hết, một đính chính về số ngày.** Đề bài pha 6a ghi "đếm 10/14 ngày". Máy nói khác:
`pnpm db:trial` ngày 12/09 cho **1/14 ngày** cho cả hai bé — mỗi bé đúng **một phiên, 10 câu,
4–5 phút**, đều trong hôm nay. `exercise-health.csv` vì thế chỉ có **20 dòng, mỗi bài đúng một lượt
gặp**. Chưa đủ để nói bài nào "quá dễ" hay "ai cũng sai" theo ngưỡng §5 — một lượt không phải một
tỉ lệ. Sẽ đọc lại mỗi 2–3 ngày như đề bài yêu cầu.

Nhưng **một dòng trong đó đủ để lộ một lỗi thật**, và đây là thứ quý hơn mọi phán đoán của chúng ta:

> `viet-bd-0049` — *"Có bao nhiêu dế? Chạm để đếm."* — 5 con dế, **3 lần thử, 66 giây, vẫn chưa
> ra**. Đây là bài duy nhất trong 20 lượt bị làm sai.
>
> Bài đó nằm trong gói **`VIET.HV.NHAM_LAN_B_D` — phân biệt b và d.** Đếm dế không đo b/d chút nào.
> Con đếm hụt thì hệ thống ghi "yếu b/d" và hạ mastery của một kỹ năng con **không hề mắc lỗi**.

Rà lại thì đó không phải một bài lẻ: **cả 23 bài COUNT_TAP trong các gói ngữ âm** (10 gói tiếng Việt
+ 3 gói tiếng Anh của đợt 1) đều cùng kiểu "chạm từng con vật để đếm" — tức kỹ năng
`VMATH.SO.DEM_VAT`, không phải học vần. Tệ hơn, ba bài `enl-rhyme-*` ghi đề *"Tap the rhyming
pictures to count them"* nhưng dữ liệu chỉ vẽ **một** loại tranh lặp lại, nên không có gì để so vần
(rubric 10 — đủ dữ liệu để render).

**Vì sao không sửa mà nghỉ hưu:** `ExerciseSpec.countTarget` theo thiết kế chỉ vẽ *một* `ImageRef`
lặp `repeat` lần. Không có cách nào để một bài COUNT_TAP phân biệt b với d, hay /æ/ với /e/ — sửa câu
lệnh cũng không cứu được. Nên:

| Việc | Số bài |
|---|---|
| **RETIRE** bài COUNT_TAP trong gói ngữ âm (10 gói VIET, `ENL.RF.RHYME`, `ENL.RF.SIGHT_WORDS_PREPRIMER`, `ESL.PH.ALPHABET_SOUNDS`) | **23** |
| RETIRE một bài đọc to bị đổi mã khi dựng lại gói `ENL.RF.BLEND_PHONEMES` | 1 |
| Bỏ `COUNT_TAP` khỏi `exerciseTypes` của 16 kỹ năng ngữ âm, để không ai soạn lại | — |
| Bỏ luôn mục đếm khỏi ba gói **đợt 2** vừa soạn (`ESL.PH.SPELL_CVC`, `ENL.RF.BLEND_PHONEMES`, `ENL.RF.ISOLATE_SOUNDS`) vì mắc đúng lỗi ấy | 14 bài chưa từng phát hành |

Nghỉ hưu chứ không xoá: bản ghi vẫn còn, `Evidence` con đã tạo vẫn trỏ đúng chỗ (`10` §4.2).

**Còn tồn:** lượt làm sai của con trên `viet-bd-0049` **vẫn nằm trong mastery của `NHAM_LAN_B_D`**.
Đợt này không đụng `Evidence`/`SkillMastery` (`10` §11), nên ba mẹ tự quyết: mở dashboard, bấm vào
`VIET.HV.NHAM_LAN_B_D`, xem bằng chứng đó và ghi đè nếu thấy nên.

Hai quan sát khác, **chưa đủ dữ liệu để kết luận**, ghi lại để đọc tiếp:

- `viet-am-u-0041` (WRITE_PHOTO "viết chữ ư") — được mời 1 lần, **bị bỏ qua** (`skipRate` 1,0). Giả
  thuyết: bài viết cần ba mẹ cầm máy ảnh ngay lúc đó, con ngồi một mình thì bỏ. Khớp với `dot-1.md`
  §5 mục 5. Nếu sau vài ngày nữa WRITE_PHOTO vẫn có tỉ lệ bỏ cao thì phải xếp chúng vào cuối phiên.
- `emath-count20-0016` — đúng, nhưng **119 giây và 3 lần thử** cho một bài đếm tới 16. Có thể là bài
  khó thật ở mức 4, có thể là lần đầu con làm quen với dạng chạm-để-đếm.

---

## 6. Bản đồ kỹ năng: 47 kỹ năng được sửa hợp đồng

Một kỹ năng chỉ khai 3 dạng bài và biên độ khó `[1,3]` là đủ khi **chưa có bài nào**. Khi đã có 40
bài thì hợp đồng đổi: validator đòi cả năm mức khó và ≥ 4 trong sáu dạng của pha 3 — đúng cái làm
một tối học không nhàm. `scripts/content-gen/patch-skill-map.mjs` ghi lại toàn bộ, để `git diff` của
bản đồ kỹ năng đọc được chứ không phải sửa tay rải rác:

- **34 kỹ năng** nới `difficultyRange` lên `[1,5]` và thêm dạng bài (chủ yếu `WRITE_PHOTO`,
  `LISTEN_CHOOSE`, `COUNT_TAP`, `READ_ALOUD`).
- **16 kỹ năng ngữ âm** bỏ `COUNT_TAP` (mục 5).
- **Năm gói dấu thanh** thêm bài 9 vào `lessonRef` — đúng quy ước `VIET.HV.DAU_THANH` của đợt 1:
  một dấu được luyện lại tới khi đủ sáu dấu, nên phạm vi chữ in ra tính tới bài 9. Không có bài 9
  thì gói dấu huyền chỉ còn hai tiếng dùng được (`ba`, `bà`) — không đủ để soạn 40 bài không trùng.
  `VIET.HV.DANH_VAN_TIENG` từ `lessonRef: null` thành bài 13, để validator tiến trình **có** hiệu lực
  (trước đó nó bỏ qua gói này hoàn toàn).

Bảng `Skill` trong DB được đồng bộ **theo đúng 47 mã đó**, chỉ ba trường `exerciseTypes`,
`difficultyMin`, `difficultyMax`. **Không** chạy `importSkillMaps` của seed: hàm đó đặt
`isActive: true` cho mọi kỹ năng trong file, mà `ESL.VOC.WEATHER`, `ESL.VOC.DAYS_OF_WEEK`,
`ESL.VOC.TRANSPORT` đang cố ý tắt (`docs/09` §4b.3) và vẫn còn trong file — chạy cả hàm sẽ bật chúng
sống lại.

---

## 7. Bảo vệ 14 ngày chạy thật — đã giữ được gì

| Luật (đề bài §0) | Đã làm |
|---|---|
| Không sửa code của app | Chỉ thêm `scripts/content-gen/` (bộ sinh nội dung, không vào app) và một cờ `--only` cho `scripts/sample-exercises.mjs`. `apps/` và `packages/` **không đổi một dòng** |
| Không dựng lại Docker trong giờ học 18:00–21:00 | **Không dựng lại lần nào.** `content:import` chạy khi web đang sống; không restart container nào |
| Nạp theo lô nhỏ, `--dry-run` trước | 5 lô nội dung + 3 lô sửa sau QC. Lô đầu chạy `--dry-run` (517 mới, 0 nghỉ hưu) trước khi nạp thật |
| Không đụng `Evidence`/`SkillMastery`/`Session`/`Attempt` | Không. Chỉ `Exercise`, `ExerciseSkill`, `ContentBatch`, `Skill`, `AuditLog` |
| Không ngày nào bị gián đoạn | ~~Mọi lệnh chạy 08:30–10:30 giờ VN.~~ **Đính chính 14/09:** đó là giờ UTC đọc nhầm. Giờ VN thật: nạp 15:29–15:55, nghỉ hưu 24 bài lúc **19:39** (trong giờ học). Không có phiên nào mở lúc đó, nên không ai bị gián đoạn — xem mục 10 |

**Phát hành:** 1.464 bài nạp ở trạng thái `DRAFT` theo đúng `10` §5 bước ⑤. Chủ dự án quyết định
trong phiên này là **phát hành hết ngay**, nên 10 lô được bật `PUBLISHED` từ dòng lệnh bằng đúng
`updateMany` + dòng `CONTENT_PUBLISH` mà nút "phát hành" của `/admin/content` ghi (tài khoản
`admin@medifa.vn`). Hoàn tác được bằng nút **"gỡ phát hành"** theo lô.

---

## 8. Bài tự thấy còn yếu

1. **Ngân hàng mới chưa ai làm.** 1.463 bài này chưa có một lượt gặp nào. Mọi đánh giá ở mục 3 là
   *tự chấm*; con số thật phải đợi `exercise-health.csv` vài ngày nữa.
2. **Tiêu chí xong số 1 chưa đạt, và không thể đạt trong một đợt** — xem mục 9.
3. **ESCI dựng theo NGSS, không theo sách của trường.** 442 bài đã ghi rõ `sourceRef`, nhưng thứ tự
   chủ đề và từ vựng có thể lệch với giáo trình lớp đang dạy. Đây là rủi ro lớn nhất của đợt này:
   nếu trường dạy "Materials" ở học kỳ 2 thì con gặp bài trước khi học.
4. **ESL/ENL vẫn dựng từ bảng chương trình, chưa có trang sách** (`docs/09` §4b.4 vẫn còn nguyên).
   Từ vựng Unit 4 (`ANIMALS_FARM`) lấy đúng danh sách của scope and sequence, nhưng mẫu câu và tranh
   thì đoán.
5. **Mười gói ESCI không có thẻ lỗi nào.** Khi con sai một bài khoa học, hệ thống chỉ biết "chưa
   đúng" — không lái được thang ôn tập. Nếu muốn sửa thì phải bổ sung bộ mã lỗi ở `04` §11 (ví dụ
   `nham_chuyen_dong_voi_song`, `coi_mat_trang_la_nguon_sang`), tức đụng hợp đồng dữ liệu → cần ADR.
6. **`ENL.RF.RHYME` còn 38 bài** sau khi nghỉ hưu 3 bài hỏng. Trên sàn 35 nhưng dưới mốc 40; thêm
   bài chỉ để đủ số sẽ tệ hơn là để nguyên.
7. **`lessonRef` mới của năm gói dấu thanh chưa được nối lại vào `LessonUnitSkill` trong DB.** Ảnh
   hưởng duy nhất: mục "tuần này học bài nào" trên dashboard chưa thấy dấu huyền gắn với bài 9.
8. **Hình vẫn là emoji.** `content/art/objects/manifest.json` vẫn chưa có nên validator bỏ qua kiểm
   tra vật thể — y như đợt 1 §5 mục 3. 442 bài ESCI phụ thuộc nặng vào emoji (🪨 🧽 🫧 🪺), khi làm
   thư viện SVG phải rà lại cả bộ.

---

## 9. Tiêu chí xong — đối chiếu thẳng

| # | Tiêu chí (đề bài §6) | Kết quả |
|---|---|---|
| 1 | Không kỹ năng nào thuộc tuần 1–12 của VIET, VMATH, EMATH, ENL, ESL còn 0 bài | ❌ **Chưa đạt** — xem bên dưới |
| 1b | ESCI có ít nhất 8 kỹ năng ≥ 35 bài `PUBLISHED` | ✅ **10 kỹ năng**, 40–46 bài mỗi kỹ năng |
| 2 | 20 bài chọn ngẫu nhiên, tự chấm theo rubric, kèm `stableId` | ✅ mục 3 |
| 3 | `content:import --dry-run` báo 0 thay đổi | ✅ `0 new, 0 updated, 0 revived, 2676 unchanged, 0 retired` |
| 4 | Không ngày nào bị gián đoạn vì việc nạp nội dung | ✅ mục 7 |
| 5 | Báo cáo số bài sửa/RETIRE nhờ `exercise-health.csv` | ✅ mục 5 — 24 bài nghỉ hưu, kèm ví dụ cụ thể |

### Vì sao tiêu chí 1 không thể đạt trong đợt này

Đề bài đặt **hai con số không khớp nhau**:

- §3 — *"Mục tiêu đợt 2: **30–35 kỹ năng**, 40 bài mỗi kỹ năng."*
- §6.1 — không kỹ năng nào thuộc tuần 1–12 của 5 môn còn 0 bài.

Đếm thật: 5 môn đó có **190 kỹ năng** thuộc tuần 1–12. Trước đợt 2 mới **27** kỹ năng có bài, nay là
**51**. Phủ nốt tức là soạn thêm **139 kỹ năng × 35 bài ≈ 4.900 bài** — gấp **3,6 lần** mục tiêu §3,
và nhiều hơn cả đợt 1 lẫn đợt 2 cộng lại (2.699 bài).

Cháu làm đúng con số §3 (**34 kỹ năng**) theo **đúng thứ tự ưu tiên §3**, vì luật cũ vẫn đúng: *"thà
30 kỹ năng có bài tốt còn hơn 100 kỹ năng bài hời hợt"*. Hiện trạng tuần 1–12 sau đợt 2:

| Môn | Kỹ năng tuần 1–12 | Có bài | Còn trắng |
|---|---|---|---|
| VIET | 75 | 22 | 53 |
| ESL | 45 | 9 | 36 |
| ENL | 30 | 4 | 26 |
| VMATH | 20 | 8 | 12 |
| EMATH | 20 | 8 | 12 |
| **ESCI** | 17 | **10** | 7 |
| | **207** | **61** | **146** |

**Đề nghị cho đợt 3:** chọn một trong hai —

- **(a)** Giữ tiêu chí phủ hết tuần 1–12 và chia thành **4–5 đợt nữa**, mỗi đợt 30–35 kỹ năng theo
  đúng nhịp lớp học (VIET học vần bài 16–30 là ưu tiên rõ ràng nhất — lớp sẽ tới đó trong 3 tuần).
- **(b)** Đổi tiêu chí thành *"mọi kỹ năng **lớp đã dạy tính tới hôm nay** đều có bài"*. Đây mới là
  thứ ảnh hưởng tới con thật: tính theo nhật ký lớp, lớp 1B3 đang ở bài 13–14, tức tuần 3. Đo như
  vậy thì đợt 2 phủ gần trọn phần con đã học, và các tuần 8–12 để dành đúng lúc.

Cháu nghiêng về **(b)**, và đề nghị đợt 3 nhắm vào VIET bài 16–24 (âm m, n, g, gi, gh, nh, ng, ngh,
r, s, t, tr, th, vần ia/ua/ưa) — đó là thứ hai con gặp trong ba tuần tới.

---

## 10. Lô 5–7 — 14/09/2026

### 10.1 Sự cố trước khi soạn: web chết từ sáng 13/09

Máy chủ khởi động lại lúc **07:02 ngày 13/09** nhưng Docker Desktop không tự bật, nên web, worker và
Postgres tắt suốt **~36 giờ**. Bảng `Session` xác nhận: **không có phiên học nào kể từ 13/09** (mỗi bé
vẫn 1/14 ngày). Kéo theo: `ops:export` 04:30 và `planner.daily` không chạy.

Cháu bật lại Docker Desktop lúc **19:36 ngày 14/09** và nạp nội dung 19:56–20:06 — **trong giờ học**.
Cháu đọc nhầm giờ: `TZ=Asia/Ho_Chi_Minh date` trong Git Bash không nhận múi giờ nên in giờ UTC (12:35),
cháu tưởng là giờ VN. Không có phiên nào đang mở khi đó, và web vốn đã chết từ trước, nên việc bật lại
chỉ *khôi phục* chứ không cắt ngang buổi học nào — nhưng vẫn sai luật §0, và cháu đã báo sai với chú
lúc làm. Cùng lỗi đọc giờ ấy làm sai câu "08:30–10:30" trong báo cáo ngày 12/09 (đã đính chính ở mục 7).

**Lần khởi động đó lộ thêm một lỗi vận hành:** `docker/entrypoint-web.sh` chạy `prisma/seed.ts` mỗi lần
container web khởi động, bằng `content/skill-map/` **nằm trong image** — image dựng trước 12/09. Seed
ghi đè `exerciseTypes` và biên độ khó của 47 kỹ năng đã mở rộng hôm 12/09 (ví dụ `ESCI.PS.FLOAT_SINK`
về lại `[MCQ, DRAG_DROP]`, mức 1–2), và bật lại `isActive` cho ba kỹ năng ESL đã cố ý tắt
(`VOC.WEATHER`, `VOC.DAYS_OF_WEEK`, `VOC.TRANSPORT`). Cháu đã đồng bộ lại 47 kỹ năng. Chừng nào image
chưa dựng lại thì **mỗi lần restart sẽ ghi đè lần nữa** (mục 10.6).

### 10.2 Lỗi thật tìm ra trong nội dung đã phát hành hôm 12/09

Khi tách khuôn gói "âm" để dùng lại cho bài 16–24, cháu viết `scripts/content-gen/audit-has-letter.mjs`
soát câu *"Tiếng nào có âm X?"*. Kết quả: **31 bài có hai (hoặc ba) đáp án đúng**, tất cả trong 4 gói
âm của đợt 2 (`AM_H_L` 15, `AM_I_K` 7, `AM_OO` 5, `AM_OW` 4). Ví dụ `viet-amhl-0001`: *"Tiếng nào có âm
h?"* với `hồ` / `hò` / `cá` — cả `hồ` lẫn `hò` đều có h.

Nguyên nhân: ô nhiễu "gần giống" (`hò`, `bô` cho `cô`) được chọn vì nhìn giống — nhưng nhìn giống thì
thường **cũng chứa âm đang hỏi**. Gói hai âm còn lỗi thứ hai: giỏ "có âm i" nhận cả `kẻ`. Bộ 20 bài mẫu
hôm 12/09 không bốc trúng bài nào như vậy.

Sửa ở khuôn (`lib-viet-letters.mjs`): câu "có âm X" chỉ dùng ô nhiễu **không chứa X** (soát theo âm,
không theo con chữ — `vn-units.mjs`: `giò` có âm gi chứ không có âm g); giỏ kéo-thả tính theo âm thật
của từng thẻ. Bộ soát nay báo **0** trên toàn ngân hàng.

Soát thêm "hai ô cùng chữ" tìm ra **7 bài**, gồm 3 bài của **đợt 1** viết tay:

| Bài | Lỗi | Sửa |
|---|---|---|
| `viet-am-b-0036` | thẻ `b`, `à`, `à` — kéo thẻ `à` thứ hai vào ô vần bị chấm chưa đúng | thẻ thứ ba thành `a` (`thieu_dau_thanh`) |
| `viet-am-u-0036` | thẻ `c`, `ũ`, `ũ` | thẻ thứ ba thành `ú` (`sai_dau_thanh`) |
| `viet-bd-0035` | "Tìm chữ b" với thẻ `b`, `d`, `b` — chỉ một thẻ `b` được tính | đề thành "Tìm các chữ b", nhận cả hai thẻ |
| `viet-doctu-0023`, `0026`, `0027` | thẻ nhiễu trùng thẻ đúng (`cờ` / `cờ`) vì từ nhiễu lệch ở tiếng đầu | lấy tiếng thứ hai **khác** tiếng đúng, tính lại mã lỗi |
| `viet-amik-0003` | `đa` / `đa` | sửa dữ liệu vần thành `đo` |

`lib.mjs → choicesOf` nay tự bỏ ô trùng, nên không bộ sinh nào mắc lại được.

### 10.3 Đã soạn

**17 kỹ năng · 753 bài · đã `PUBLISHED`.** Ngân hàng: **3.433 bài / 79 kỹ năng**, 27 bài nghỉ hưu.

Tiếng Việt đọc từ **ảnh trang SGK thật** (trang sách = ảnh PDF − 1; ghi chú "+3" của đợt 1 không đúng
với cách tách ảnh này). Toán đọc tr.24–49. ESL dựng từ bảng scope and sequence Unit 2.

| Kỹ năng | Bài | Mức 1/2/3/4/5 | MCQ/LISTEN/DRAG/COUNT/READ/WRITE | Nhiễu có mã | `targetsError` |
|---|---|---|---|---|---|
| `VIET.HV.AM_M_N` (bài 16) | 47 | 6/12/13/10/6 | 19/13/7/0/5/3 | 39 | 39 |
| `VIET.HV.AM_G_GI` (bài 17) | 48 | 6/12/13/11/6 | 20/13/7/0/5/3 | 40 | 40 |
| `VIET.HV.AM_GH_NH` (bài 18) | 43 | 6/12/11/9/5 | 18/10/7/0/5/3 | 35 | 35 |
| `VIET.HV.AM_NG_NGH` (bài 19) | 44 | 6/11/11/10/6 | 17/11/7/0/6/3 | 35 | 35 |
| `VIET.HV.AM_R_S` (bài 21) | 42 | 6/12/10/9/5 | 18/9/7/0/5/3 | 34 | 34 |
| `VIET.HV.AM_T_TR` (bài 22) | 47 | 6/12/13/10/6 | 19/13/7/0/5/3 | 39 | 39 |
| `VIET.HV.AM_TH` (bài 23) | 42 | 6/11/11/9/5 | 17/10/7/0/5/3 | 34 | 34 |
| `VIET.HV.VAN_IA` (bài 23) | 41 | 6/11/10/9/5 | 17/9/7/0/5/3 | 33 | 33 |
| `VIET.HV.VAN_UA_UWA` (bài 24) | 50 | 6/13/14/11/6 | 22/13/7/0/5/3 | 42 | 42 |
| `VIET.HV.NHAM_LAN_CH_TR` | 52 | 4/9/14/14/11 | 21/20/4/0/4/3 | 45 | 45 |
| `VIET.HV.NHAM_LAN_NG_NGH_G_GH` | 46 | 4/12/14/9/7 | 19/14/5/0/5/3 | 38 | 38 |
| `VMATH.SO.THU_TU_SO` | 43 | 5/11/12/10/5 | 24/6/6/0/4/3 | 30 | 30 |
| `VMATH.SO.DOC_VIET_SO_0_10` | 42 | 6/12/11/8/5 | 16/8/6/5/4/3 | 24 | 24 |
| `VMATH.SO.SO_1_10` | 45 | 5/10/11/11/8 | 24/6/4/4/4/3 | 30 | 30 |
| `ESL.VOC.FOOD` | 40 | 5/11/10/7/7 | 18/8/6/0/5/3 | 0 | 0 |
| `ESL.VOC.FRUITS` | 41 | 7/11/10/7/6 | 24/8/0/4/5/0 | 6 | 6 |
| `ESL.GR.LIKE_DONT_LIKE` | 40 | 5/6/11/10/8 | 20/8/4/0/5/3 | 6 | 6 |

Hai gói phân biệt khác nhau về nhiễu, có chủ ý: gói **ch/tr** chỉ dùng cặp tiếng **thật** (`tre`/`che`,
`chợ`/`trợ`); gói **ng/ngh, g/gh** là luật chính tả, nên ô sai là **lỗi chính tả thật** (`ngé`, `gế`,
`ghà`) — đó chính là thứ gói dạy con nhận ra.

**Chưa soạn được `VMATH.HH.HINH_VUONG_TRON_TAM_GIAC_CN` (bài 7).** Toán bắt mọi câu trắc nghiệm có ô
nhiễu mang mã lỗi, mà 44 mã không có mã nào cho "gọi nhầm tên hình". Gắn tạm một mã khác là đúng lỗi #8
của đợt 1. Cần bổ sung mã (ví dụ `nham_ten_hinh`) — đụng `04` §11, cần ADR.

### 10.4 Tự chấm 20 bài — lô 5–7

Chọn ngẫu nhiên trong 753 bài của 17 gói, seed `pha-6a-lo-5-7`:

```powershell
node scripts/sample-exercises.mjs pha-6a-lo-5-7 20 "" --only='^(viet/HV\.(AM_M_N|AM_G_GI|AM_GH_NH|AM_NG_NGH|AM_R_S|AM_T_TR|AM_TH|VAN_IA|VAN_UA_UWA|NHAM_LAN_CH_TR|NHAM_LAN_NG_NGH_G_GH)|vmath/SO\.(THU_TU_SO|DOC_VIET_SO_0_10|SO_1_10)|esl/(VOC\.FOOD|VOC\.FRUITS|GR\.LIKE_DONT_LIKE))\.pack'
```

| # | `stableId` | Dạng | Khó | Đọc kỹ thấy gì | Đạt? |
|---|---|---|---|---|---|
| 1 | `viet-amngngh-0009` | MCQ | 3 | "Ô nào chứa âm ngh?" → `nghĩ`; `kĩ` (`nham_am_dau`), `cá` | ✅ |
| 2 | `viet-amggi-0001` | MCQ | 1 | "Tiếng nào có âm g?" → `gà`; `già` có âm gi chứ không phải g — đúng cặp g/gi | ✅ |
| 3 | `viet-amttr-0014` | MCQ | 2 | Tranh 🗄️ → `tủ`; `tá` (`doc_nham_van`), `củ` (`nham_am_dau`) | ✅ |
| 4 | `viet-ngngh-0014` | MCQ | 2 | "Ô nào viết đúng luật chính tả?" → `ngủ` / `nghủ` | ✅ |
| 5 | `vmath-docviet-0040` | WRITE_PHOTO | 3 | Viết các số 0–5; rubric có "chữ số không ngược" | ✅ |
| 6 | `esl-like-0035` | READ_ALOUD | 3 | "Do you like pasta?" | ✅ |
| 7 | `viet-amrs-0015` | MCQ | 4 | "Ô nào có âm r?" → `rổ` giữa `cổ`, `cá`, `bé` — không ô nhiễu nào có r | ✅ |
| 8 | `viet-amrs-0031` | DRAG_DROP | 2 | Giỏ "có âm s": `số`, `sò`; giỏ kia `hè`, `cò` | ✅ |
| 9 | `esl-food-0010` | MCQ | 5 | Tranh 🍝 → `pasta` | ✅ |
| 10 | `viet-amngngh-0033` | DRAG_DROP | 2 | Tranh 🐃 → `nghé`; thẻ nhiễu `nghe`, `ghé` | ✅ |
| 11 | `esl-fruit-0030` | MCQ | 5 | 5 🍊 → `five oranges`; `five orange` mang `thieu_s_so_nhieu` | ✅ |
| 12 | `esl-like-0036` | READ_ALOUD | 4 | "Yes, I do." | ✅ |
| 13 | `esl-fruit-0028` | MCQ | 3 | 2 🍐 → `two pears` | ✅ |
| 14 | `vmath-so110-0002` | MCQ | 2 | 5 🍎 → 5; `4` `dem_thieu_1`, `6` `dem_thua_1` | ✅ |
| 15 | `viet-amrs-0008` | MCQ | 2 | "Chọn tiếng có âm s" → `sả`; `cả`, `lê` | ✅ |
| 16 | `viet-ngngh-0040` | READ_ALOUD | 3 | "Mẹ nhờ Hà bê ghế nhỏ" — câu bài 18 tr.49 | ✅ |
| 17 | `viet-ngngh-0006` | MCQ | 3 | `ghế` / `gế` (`nham_g_gh`); giải thích nêu luật e, ê, i | ✅ |
| 18 | `viet-ammn-0006` | MCQ | 3 | "Ô nào có âm n?" → `nề`; `lề`, `lá` | ✅ |
| 19 | `viet-vanua-0038` | DRAG_DROP | 4 | Giỏ "có vần ua": `rùa`, `lúa`; `lứa` là cặp u/ư | ✅ |
| 20 | `viet-vanua-0015` | MCQ | 3 | Tranh 🚪 "cái cửa" → `cửa`; `của`, `sửa` | ✅ |

**20/20 — sau một vòng sửa; vòng đầu 17/20.** Ba lỗi cùng một loại *tranh không khớp tên*: 🚪 ghi
"cửa sổ" (là cái cửa), 👂 dùng cho "nghe" (con thấy cái tai), 🥒 dùng cho "su su" (con thấy dưa chuột).
Đã bỏ hai tranh, sửa một tên. Kèm một lỗi lời: giải thích giỏ kéo-thả của gói vần ghi "có âm đang học"
— nay ghi đúng "có vần ua".

### 10.5 Dữ liệu thật

Không có gì mới: máy tắt từ sáng 13/09, `exercise-health.csv` vẫn 20 dòng của 12/09.

### 10.6 Tồn đọng — việc cần chủ dự án

1. **Bật Docker Desktop tự khởi động cùng Windows** (Settings → General → *Start Docker Desktop when
   you sign in*) — cháu không đổi cài đặt hệ thống. Không có nó, mỗi lần máy khởi động lại là mất một
   buổi học.
2. **Dựng lại image vào buổi sáng** (`docker compose -f docker/compose.yml up -d --build`, ngoài
   18:00–21:00) để seed lúc khởi động mang bản đồ kỹ năng mới. Trước khi dựng, mỗi lần restart sẽ ghi đè
   47 kỹ năng về bản cũ và bật lại ba kỹ năng ESL đã tắt.
3. **Sao lưu hằng đêm chưa chạy**: bản gần nhất ở `E:\SAO-LUU-MTCT` là 12/09 10:43 (việc số 7 trong
   `docs/nhat-ky-chay-that.md`).
4. **Bộ mã lỗi còn thiếu** cho hình phẳng và cho khoa học — cần ADR trước khi soạn bài 7 Toán.
5. Nên đưa `audit-has-letter.mjs` vào `content:validate` sau đợt dùng thật (đụng code package, nên chưa
   làm trong pha 8c).
