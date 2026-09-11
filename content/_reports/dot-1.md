# Đợt 1 — báo cáo soạn nội dung (pha 2)

**Ngày:** 11/09/2026 · **Người soạn:** Claude Code · **Phạm vi:** `docs/10` §9 đợt 1 — các kỹ năng lớp đang học từ nay tới tuần 12.

## 1. Nguồn

| Môn | Sách / tài liệu đã đọc | Cách đọc |
|---|---|---|
| Toán | `sach giao khoa/01-sgk-toan-1-tap-mot.pdf` — Bài 1 (tr.8), Bài 2 (tr.14), Bài 3 (tr.20), Bài 4 (tr.24), Bài 5 (tr.32), Bài 10 (tr.56), Bài 11 (tr.68) | PDF quét, không có lớp chữ → tách ảnh từng trang rồi đọc bằng mắt. **Ảnh trang = trang sách + 3** ở file này (2 ảnh bìa lặp ở đầu), khác quy đổi "+1" ghi ở `docs/09` §1 — xem mục 5. |
| Tiếng Việt | `01-sgk-tieng-viet-1-tap-mot.pdf` — Bài 1 (tr.14), 2 (tr.16), 3 (tr.18), 4 (tr.20), 6 (tr.24), 8 (tr.28), 13 (tr.38), 14 (tr.40) | như trên |
| ESL | **Chưa có SGK Global Success 1.** Dựng theo phiếu bài tập `GS1 – UNIT 1 – REVIEW UNIT 1` và nhật ký lớp, ghi trong `docs/09` §1 | `sourceRef` của mọi bài ESL ghi rõ "phiếu bài tập GS1 – Unit 1; chưa có SGK" |
| ENL / EMATH | CCSS lớp 1 theo `docs/05` §3.3–3.4 | `sourceRef` ghi rõ chưa có giáo trình của trường |

Câu nhận biết, bảng ghép âm, từ khoá có tranh và cách diễn đạt đều chép từ sách: *"Gộp lại thì bằng mấy?"* · *"Bớt đi còn lại mấy?"* · *"3 và 2 được 5"* · *"Bốn lớn hơn ba."* · *"Bà cho bé búp bê."* · *"Đu đủ chín ngọt lù."* · *"Mấy chú khỉ ăn chuối."* Nhân vật dùng đúng nhân vật của sách: Nam, Mai, Việt, Mi, Rô-bốt, bà, bé.

## 2. Số liệu

- **28 kỹ năng · 1236 bài · tất cả đã `PUBLISHED`** (0 nháp, 0 nghỉ hưu).
- Theo môn: Tiếng Việt 453 · Toán 385 · ESL 218 · ENL 91 · English Maths 89.
- Theo dạng: MCQ 527 · LISTEN_CHOOSE 214 · DRAG_DROP 185 · READ_ALOUD 125 · COUNT_TAP 100 · WRITE_PHOTO 85.
- Theo mức khó: 1 → 204 · 2 → 300 · 3 → 291 · 4 → 271 · 5 → 170.
- **741 bài có ít nhất một đáp án nhiễu mang `errorTag`**; **190 bài `scaffold: model`**; **588 bài mang `targetsError`**.
- Biến thể chủ đề: 66 bài `robot`, 80 bài `garden`, còn lại `neutral` (bài có ngữ cảnh vật thể mới gắn chủ đề; bài chữ/số thuần thì không).

| Kỹ năng | Số bài | Mức khó 1/2/3/4/5 | MCQ/LISTEN/DRAG/COUNT/READ/WRITE | Bài có nhiễu chẩn đoán | `scaffold: model` | `targetsError` | robot/garden |
|---|---|---|---|---|---|---|---|
| `EMATH.NBT.COUNT_TO_20` | 49 | 12/12/6/9/10 | 20/5/5/10/5/4 | 25 | 6 | 7 | 7/7 |
| `EMATH.OA.ADD_WITHIN_10` | 40 | 9/9/9/8/5 | 18/5/5/5/4/3 | 23 | 6 | 9 | 6/6 |
| `ENL.RF.RHYME` | 41 | 7/10/10/7/7 | 12/12/6/3/5/3 | 24 | 6 | 24 | 4/4 |
| `ENL.RF.SIGHT_WORDS_PREPRIMER` | 50 | 7/12/12/10/9 | 16/16/6/3/5/4 | 32 | 6 | 38 | 0/0 |
| `ESL.GR.AM_IS_ARE` | 45 | 5/15/13/8/4 | 17/10/8/2/5/3 | 27 | 6 | 38 | 0/0 |
| `ESL.GR.HAVE_HAS` | 45 | 5/15/13/8/4 | 17/10/8/2/5/3 | 27 | 6 | 38 | 0/0 |
| `ESL.PH.ALPHABET_SOUNDS` | 45 | 8/11/11/7/8 | 14/14/6/3/5/3 | 28 | 6 | 28 | 5/4 |
| `ESL.VOC.ADJECTIVES` | 41 | 6/10/11/7/7 | 16/8/6/3/5/3 | 24 | 7 | 20 | 3/2 |
| `ESL.VOC.FAMILY` | 42 | 6/13/12/7/4 | 14/10/6/4/5/3 | 24 | 7 | 18 | 3/3 |
| `VIET.HV.AM_A` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.AM_B` | 45 | 5/10/10/12/8 | 18/8/10/1/5/3 | 26 | 8 | 25 | 0/0 |
| `VIET.HV.AM_C` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.AM_CH_KH` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.AM_D_DD` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.AM_E_EE` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.AM_O` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.AM_U_UW` | 43 | 5/10/10/11/7 | 17/8/9/1/5/3 | 25 | 8 | 23 | 0/0 |
| `VIET.HV.DAU_THANH` | 58 | 7/16/16/15/4 | 35/6/5/3/5/4 | 41 | 7 | 50 | 0/0 |
| `VIET.HV.NHAM_LAN_B_D` | 49 | 7/15/14/10/3 | 22/10/6/3/4/4 | 32 | 7 | 46 | 0/0 |
| `VMATH.GT.BAI_TOAN_TRANH` | 41 | 7/9/9/7/9 | 20/4/8/4/3/2 | 24 | 6 | 11 | 8/8 |
| `VMATH.SO.CONG_PV_10` | 50 | 12/9/10/14/5 | 27/5/5/5/4/4 | 32 | 6 | 8 | 6/6 |
| `VMATH.SO.DEM_VAT` | 40 | 10/9/11/8/2 | 12/5/3/15/3/2 | 17 | 6 | 6 | 4/7 |
| `VMATH.SO.NHIEU_HON_IT_HON` | 40 | 9/9/8/9/5 | 21/5/5/4/3/2 | 26 | 6 | 12 | 5/8 |
| `VMATH.SO.SO_0_5` | 41 | 8/9/8/8/8 | 20/5/4/5/4/3 | 25 | 7 | 10 | 7/5 |
| `VMATH.SO.SO_6_10` | 41 | 8/9/8/8/8 | 20/5/4/5/4/3 | 25 | 7 | 10 | 0/12 |
| `VMATH.SO.SO_SANH_1_10` | 40 | 9/9/10/9/3 | 20/5/5/4/4/2 | 25 | 6 | 12 | 0/0 |
| `VMATH.SO.TACH_GOP_10` | 42 | 11/9/10/9/3 | 22/5/6/4/3/2 | 27 | 6 | 9 | 2/2 |
| `VMATH.SO.TRU_PV_10` | 50 | 11/10/10/14/5 | 27/5/5/5/4/4 | 32 | 6 | 8 | 6/6 |

## 3. Tự chấm rubric `docs/10` §6 — 20 bài chọn ngẫu nhiên

**Cách chọn (tái lập được):** lấy toàn bộ 1236 bài trong `content/exercises/`, sắp theo `sha256("pha-2-dot-1" + stableId)`, lấy 20 bài đầu. Không chọn tay, không loại bài nào. QC chạy lại đúng bộ này bằng script ghi ở cuối mục.

| # | `stableId` | Kỹ năng | Dạng | Khó | Rubric 1–11 | Đạt? |
|---|---|---|---|---|---|---|
| 1 | `viet-am-ch-0012` | VIET.HV.AM_CH_KH | LISTEN_CHOOSE | 2 | Nghe "chè", chọn giữa `chè`/`trè`; nhiễu mang `nham_ch_tr`. Đề không in tiếng được đọc. | ✅ |
| 2 | `vmath-cong10-0044` | VMATH.SO.CONG_PV_10 | WRITE_PHOTO | 3 | 5 + 3; rubric chấm nêu đủ 3 tiêu chí; hợp bài 10 tr.56. | ✅ |
| 3 | `enl-sight-0043` | ENL.RF.SIGHT_WORDS_PREPRIMER | DRAG_DROP | 5 | Đọc câu, kéo từ còn thiếu (`you` / `was`) — đo đúng đọc từ nhìn-là-biết. | ✅ |
| 4 | `vmath-cong10-0030` | VMATH.SO.CONG_PV_10 | DRAG_DROP | 3 | 3 + 4; ba thẻ số, hai thẻ nhiễu. Nhiễu ở dạng kéo-thả không mang `errorTag` (schema chưa hỗ trợ) — **ghi nhận, không tính là lỗi**. | ✅ |
| 5 | `viet-am-d-0008` | VIET.HV.AM_D_DD | MCQ | 3 | "Tiếng nào có âm đ?" → `đò` / `cò`; nhiễu **không** chứa âm đ nên đáp án duy nhất. | ✅ |
| 6 | `viet-am-a-0017` | VIET.HV.AM_A | LISTEN_CHOOSE | 4 | Nghe "Nam", chọn `Nam`/`Nem`, nhiễu `doc_nham_van`. | ✅ |
| 7 | `viet-am-a-0041` | VIET.HV.AM_A | DRAG_DROP | 5 | "Kéo thẻ không mang dấu nào" → `ba`/`bà`; hỏi theo **quy tắc**, không in đáp án. | ✅ |
| 8 | `vmath-tachgop-0015` | VMATH.SO.TACH_GOP_10 | MCQ | 3 | "2 và mấy thì được 8?"; nhiễu `8`→`quen_so_0`, `5`→`dem_thieu_1` — đúng hai lỗi thật. | ✅ |
| 9 | `enl-sight-0019` | ENL.RF.SIGHT_WORDS_PREPRIMER | LISTEN_CHOOSE | 2 | Nghe "a", chọn `a`/`at`. Đề tiếng Anh 5 từ. | ✅ |
| 10 | `viet-am-u-0009` | VIET.HV.AM_U_UW | MCQ | 3 | "Tiếng nào có âm ư?" → `lữ`/`lá`; nhiễu không chứa ư. | ✅ |
| 11 | `esl-havehas-0039` | ESL.GR.HAVE_HAS | MCQ | 4 | "The twins ___ three balls." — đếm rồi mới chọn được động từ, đo đúng have/has. | ✅ |
| 12 | `vmath-so610-0033` | VMATH.SO.SO_6_10 | READ_ALOUD | 4 | Đọc ngược 10→6; từng tiếng chấm được bằng STT. | ✅ |
| 13 | `viet-dauthanh-0043` | VIET.HV.DAU_THANH | DRAG_DROP | 2 | Tranh 🐟, ô hiện tiếng trần `ca`, kéo `dấu sắc`. Không in sẵn tiếng có dấu. | ✅ |
| 14 | `vmath-nhieuit-0014` | VMATH.SO.NHIEU_HON_IT_HON | MCQ | 3 | 7 cá vs 3 chim; nhiễu `ít hơn`→`so_sanh_nguoc`, `bằng nhau`→`nham_dau_lon_be`. | ✅ |
| 15 | `viet-am-o-0015` | VIET.HV.AM_O | LISTEN_CHOOSE | 3 | Nghe "cò", chọn `cò`/`cồ`. | ✅ |
| 16 | `viet-am-a-0043` | VIET.HV.AM_A | DRAG_DROP | 5 | "Kéo thẻ mang dấu huyền" → `cà`/`ca`. | ✅ |
| 17 | `vmath-so610-0021` | VMATH.SO.SO_6_10 | LISTEN_CHOOSE | 1 | Nghe "Số sáu" → `6`/`5`/`7` với `dem_thieu_1`/`dem_thua_1`. | ✅ |
| 18 | `vmath-demvat-0013` | VMATH.SO.DEM_VAT | COUNT_TAP | 3 | Đếm 7 con bướm; `correctCount` không gửi ra máy của con. | ✅ |
| 19 | `vmath-so05-0002` | VMATH.SO.SO_0_5 | MCQ | 2 | Tranh vẽ đúng 1 bông hoa (`image.repeat`); nhiễu `0`→`dem_thieu_1`, `2`→`dem_thua_1`. | ✅ |
| 20 | `vmath-tachgop-0020` | VMATH.SO.TACH_GOP_10 | MCQ | 4 | "4 và mấy thì được 10?"; nhiễu `5`→`dem_thieu_1`, `10`→`quen_so_0`. | ✅ |

**Kết quả tự chấm: 20/20 đạt** — nhưng chỉ **sau hai vòng sửa**. Lần chấm đầu chỉ 14/20; mục 4 ghi đúng những gì đã hỏng.

## 4. Lỗi tự tìm ra khi chấm và đã sửa

Đây là phần quan trọng nhất của báo cáo: bộ 20 bài lộ ra **9 lỗi hệ thống**, mỗi lỗi ảnh hưởng hàng chục tới hàng trăm bài.

| # | Lỗi | Vi phạm | Ảnh hưởng | Đã sửa thế nào |
|---|---|---|---|---|
| 1 | Đề bài nghe **in sẵn tiếng được đọc** (`Nghe rồi chọn tiếng: chè`) → bé biết đọc chỉ cần nhìn là chọn đúng, không cần nghe | Rubric 4 (đáp án phải do làm bài mà ra) | **214 bài** LISTEN_CHOOSE | Thêm trường `listenTarget` vào `ExerciseSpec`: tiếng được đọc nằm riêng, **không bao giờ in ra**. Đề chỉ còn "Nghe rồi chọn ô đúng nhé!". Validator chặn đề nào in lại tiếng đó. |
| 2 | "Tiếng nào có âm ư?" với hai đáp án `lữ` / `lử` — **cả hai đều có âm ư**, chỉ khác dấu | Rubric 4 (đáp án không duy nhất) | 64 bài, 8 gói học vần | Mỗi tiếng có thêm `without` — một tiếng thật **không chứa** âm đó, lấy từ chính bài học. |
| 3 | Bài đối chiếu hỏi "Tiếng nào là **"ba"**?" — in luôn đáp án trong đề | Rubric 4 | 25 bài đối chiếu | Hỏi theo **quy tắc**: "Tiếng nào không có dấu thanh?", "Chữ nào có bụng quay sang phải?"… |
| 4 | Kéo dấu thanh: ô hiện sẵn `cá`, chỉ cần chép dấu | Rubric 4 | 5 bài | Ô hiện tiếng trần `ca`, thêm tranh 🐟 để bé biết cần tiếng nào. |
| 5 | "Trong tranh có mấy bông hoa?" nhưng `ImageRef` **không nói vẽ mấy bông** → không render được | Rubric 10 (đủ dữ liệu để render) | 90 bài đếm | `ImageRef.repeat` — số lần vẽ hình; `/dev/kit` và `/admin/content` vẽ đúng số đó. |
| 6 | Gói `ESL.GR.HAVE_HAS` có bài "How many? Tap to count" — đếm chó thì **không đo have/has** | Rubric 1 (đúng kỹ năng) | 6 bài, 2 gói ngữ pháp | Đổi thành "Count the cats. Then say: she has …" và "The twins ___ three balls." — đếm xong mới chọn được động từ. |
| 7 | Gói sight-words có bài xếp từ theo **số chữ cái** — đo đếm, không đo đọc | Rubric 1 | 6 bài | Đổi thành đọc câu rồi kéo từ còn thiếu vào chỗ trống. |
| 8 | Nhiễu gắn sai mã: `bằng nhau` gắn `dem_thieu_1` (lỗi đếm) trong bài **so sánh**; `3` gắn `dem_thua_1` khi đáp án là `1` | Rubric 11 (nhiễu phải có chẩn đoán **đúng**) | ~40 bài | `nham_dau_lon_be` cho so sánh; `dem_lai_tu_dau` chỉ dùng khi số đủ lớn để lạc chỗ (≥ 4). |
| 9 | Tiếng Anh viết "1 apples"; nhiễu ch/tr là tiếng không có nghĩa (`trè`, `trỉ`) | Rubric 3 và 9 (đúng tiếng, an toàn) | 4 bài + 3 cặp | Có bảng số ít/số nhiều; thay bằng từ thật: `tre`, `trí`, `trợ`, `khó`/`chó`. |

Hai lỗi trong số đó (#1 và #5) **sửa được ở tầng hợp đồng dữ liệu**, nên pha 3 không thể vô tình mắc lại: `listenTarget` bị validator canh, `ImageRef.repeat` là trường bắt buộc phải đọc khi render.

## 5. Bài tự thấy còn yếu

1. **Nhiễu của `DRAG_DROP` chưa mang mã lỗi.** `ExerciseSpec` chỉ cho `errorTag` trên `choices`. Khi bé kéo nhầm thẻ, hệ thống biết "chưa đúng" nhưng **không biết vì sao**. 185 bài kéo-thả đang mất khả năng chẩn đoán. Đề nghị pha 3 thêm `dragItems[].errorTag`.
2. **Toàn bộ ESL/ENL/EMATH (398 bài) chưa bám sách của trường.** Nội dung dựng theo phiếu bài tập Unit 1 và CCSS; `sourceRef` ghi rõ. Khi có SGK Global Success 1 phải rà lại từ vựng và thứ tự unit.
3. **Hình minh hoạ đang là emoji.** Đúng `docs/04` §5 ("v1 ưu tiên emoji"), nhưng `content/art/objects/manifest.json` chưa có nên validator bỏ qua kiểm tra vật thể. Pha 3 làm thư viện SVG rồi phải rà lại.
4. **Quy đổi trang PDF.** `docs/09` §1 ghi "trang PDF = trang sách + 1"; hai file SGK trong repo thực tế lệch **+3** (có 2 ảnh lặp ở đầu). Không ảnh hưởng `sourceRef` (đều ghi số trang **sách**), nhưng nên sửa `docs/09` để lần sau khỏi mò.
5. **`WRITE_PHOTO` (85 bài) phải chờ ba mẹ chụp** rồi qua hàng chờ AI mới có kết quả — bé nhận sao ngay nhưng phản hồi thật trễ 1–3 ngày (đúng `docs/13` §3b, nhưng cần nhớ khi xếp phiên ở pha 3).
6. **Bài mức 5 của kỹ năng nhận biết** (ví dụ `VIET.HV.AM_A` mức 5) là bài đối chiếu dấu thanh — khó hơn thật, nhưng hơi chạm sang kỹ năng dấu thanh. Chấp nhận được vì có `skillCodes` phụ, nhưng pha 5 nên theo dõi xem mastery có bị nhiễu không.

## 6. Chạy lại bộ 20 bài mẫu

```powershell
node scripts/sample-exercises.mjs pha-2-dot-1 20
```

Script đọc thẳng `content/exercises/`, không cần database, và luôn cho ra đúng 20 mã ở mục 3.
