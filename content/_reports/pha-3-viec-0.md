# Pha 3 · Việc 0 — dọn tồn đọng của ngân hàng bài đợt 1

> QC đọc 20 bài mẫu và quét cả 1236 bài sau pha 2: cấu trúc sạch, nhưng bốn nhóm nội dung cần sửa.
> Báo cáo này ghi lại đã sửa gì, sửa bằng cách nào, và ba kiểm định mới ngăn lỗi quay lại.

**Số liệu tổng:** 1236 bài (không đổi) · **1021 bài được viết lại hoặc sửa** · 471 bài đổi mã lỗi
(590 lượt đổi trên từng phương án) · 616 bài đổi câu lệnh · 604 bài đổi gợi ý.
`content:validate` **0 lỗi**; `content:stats` **1236 PUBLISHED**, mọi kỹ năng ≥ 35 bài.

---

## 1. Mã lỗi gắn sai nghĩa

**Lỗi QC chỉ ra:** bài "2 và mấy thì được 8?" gắn phương án **8** là `quen_so_0`. Trẻ chọn đúng bằng
tổng là **lặp lại con số đã cho**, không phải quên số 0 — hai lỗi này cần hai cách rèn khác nhau.

**Đã làm**

1. **Thêm 2 mã vào `content/error-taxonomy.json`** (42 → 44):
   - `lap_lai_tong` — "Lặp lại số có trong đề": chọn ngay một số đã in trong đề (thường là tổng hoặc
     số đầu tiên) thay vì tính. Rèn bằng mô hình tách–gộp có hình (`VMATH.SO.TACH_GOP_10`,
     `CONG_PV_10`, `TRU_PV_10`).
   - `nham_chu_gan_giong` — "Nhầm chữ gần giống": a–ă–â, o–ô–ơ, e–ê, u–ư, d–đ, và cặp tròn a–o.
     Trước đây chỗ này bị gắn bừa vào `thieu_dau_thanh` (mũ của ă và râu của ư **không phải** dấu
     thanh) hoặc `nham_b_d`.
2. **Nới nghĩa hai mã cũ** (ghi vào `description`, không đổi mã): `doc_nham_van` nay tính cả bài
   tiếng Anh hỏi *rhyme*; `sai_chinh_ta_tu` tính cả cặp đảo chữ (was/saw, our/are).
3. **Rà lại toàn bộ**: mã của từng phương án được **suy lại từ chính đáp án** — so đáp án đúng, đáp
   án sai và đề bài rồi mới đặt tên cho lỗi. Mã nào không có nghĩa nào khớp thì **bỏ trống** (một mã
   sai còn tệ hơn không có mã, vì thang rèn sẽ rèn nhầm chỗ).

**Những chỗ đổi nhiều nhất**

| Số lượt | Đổi | Vì sao |
|---|---|---|
| 32 | `quen_so_0` → `lap_lai_tong` | đúng ca QC chỉ ra, ở `TACH_GOP_10`, `SO_0_5`, `SO_6_10`, `BAI_TOAN_TRANH` |
| 24 | `nham_nguyen_am_ngan` → `doc_nham_van` | bài *rhyme* của `ENL.RF.RHYME`: "dog" vs "hat" không phải lỗi nguyên âm ngắn |
| 24 | `khong_hieu_de_loi_van` → `nham_cong_tru` | phương án đúng bằng kết quả phép ngược → gọi tên đúng là cộng/trừ ngược |
| 42 | `nham_dau_lon_be` → (bỏ) | phương án "bằng nhau"/"=" không phải chọn ngược dấu |
| 39 | `sai_chinh_ta_tu` → (bỏ) | `ESL.VOC.*`: "short" thay cho "tall" là chưa thuộc từ, không phải sai chính tả |
| 24 | `nham_b_d` → (bỏ) | `VIET.HV.AM_A`: "o" thay cho "a" không phải lỗi b/d (nay là `nham_chu_gan_giong`) |
| 14 | `doc_bo_tu_tieng_anh` → `sai_chinh_ta_tu` | sight word she/the, your/you: nhìn nhầm mặt chữ, không phải bỏ từ khi đọc |

Ngoài ra **`targetsError` được chỉnh cho khớp**: bài trắc nghiệm khai "nhắm lỗi X" mà không phương án
nào mang X thì attempt không bao giờ ghi được X — nay validator cảnh báo và các bài đó đã sửa.

## 2. Lệch tiến độ bài học

**Lỗi QC chỉ ra:** `VIET.HV.AM_A` (bài 1, lớp mới học đúng một chữ *a*) có bài phân biệt "Nam"/"Nem"
và thẻ kéo "cà" mang dấu huyền — dấu thanh tới bài 2–9 mới dạy.

**Quy ước đã chốt** (kiểm định mới, mục 5 dưới đây): thứ chữ trẻ **phải đọc để trả lời** —
`choices[].text`, `dragItems[].text`, `readTarget` — chỉ được dùng chữ cái, vần và dấu thanh đã dạy
tính tới `lessonRef` của kỹ năng. **Không** áp cho `prompt.text`, nhãn ô thả, gợi ý, giải thích và
`listenTarget`: những thứ đó mascot **đọc lên**, trẻ nghe chứ không giải mã — đúng như câu nhận biết
trong SGK. **Một chữ đứng một mình** ("o", "ă", "ngh") luôn được phép: nhặt chữ *a* giữa những chữ
chưa học chính là việc của bài 1.

**Kết quả quét:** **156/453 bài Tiếng Việt vi phạm**. Vì lỗi nằm ở chính ngữ liệu, cả **10 gói Tiếng
Việt được viết lại** theo danh sách từ khoá có kiểm chứng cho từng bài (giữ nguyên `id` để bản ghi
trong DB cập nhật tại chỗ, `Evidence` cũ không mất):

| Kỹ năng | Bài | Chữ đọc được | Cách bù |
|---|---|---|---|
| `AM_A` | 1 | chỉ "a" | phương án là **tranh** (cá/cỏ, bà/bò, lá/lò…), trẻ nghe tên tranh; chữ chỉ xuất hiện đơn lẻ |
| `AM_B` | 2 | ba, bà | tranh + hai tiếng đó |
| `AM_C` | 3 | + ca, cà, cá | bắt đầu có bài đọc chữ |
| `AM_E_EE` | 4 | + be, bè, bé, bê, bế | |
| `AM_O` | 6 | + bò, bó, bỏ, cò, có, cỏ, cả | |
| `AM_D_DD` | 8 | + da, dê, dế, dò, đa, đá, đò, đỏ, cô, bố, ô | |
| `AM_U_UW` | 13 | + cú, cũ, dù, đủ, hổ, hồ, lá, li, bí… | bài lớp đang học |
| `AM_CH_KH` | 14 | + chó, chè, chì, chú, khỉ, khô, khó, kho | |
| `DAU_THANH` | tới 9 | bộ thanh đầy đủ: ba/bà/bá/bả/bã, co/cò/có/cỏ/cọ… | mỗi bài luyện ghi đúng bài dạy thanh đó |
| `NHAM_LAN_B_D` | tới 8 | ba/da, bê/dê, bế/dế, bò/dò | chỉ cặp tối thiểu **có thật** |

Nhân tiện sửa luôn trong lần viết lại này:

- **Bỏ nhiễu không phải tiếng Việt** — mọi tiếng in ra bây giờ đều là **từ có thật** (hết "trè",
  "dà", "dúp", "bo", "dừ"…). Cặp tối thiểu chọn theo quan hệ có tên: cùng vần khác âm đầu
  (`nham_am_dau`), cùng âm đầu khác vần (`doc_nham_van`), cùng chữ khác dấu (`sai_dau_thanh`).
- **Câu lệnh phủ định thành khẳng định**: "Tiếng nào **không** có dấu thanh?" → "Tiếng nào mang
  **thanh ngang**?"; "Kéo thẻ **không** mang dấu nào" → "Kéo tiếng mang thanh ngang vào ô"; "Chữ nào
  **không** đội mũ?" → hỏi thẳng chữ o. (Ba câu còn chữ "không" là **nội dung Toán** về phép + 0 /
  − 0, giữ nguyên.)
- **Ô thả chỉ nhận thứ thuộc về nó**: trước đây `accepts` liệt kê cả thẻ sai, nên ô nào cũng nhận mọi thẻ.
- **`countTarget.objects` không còn `repeat`** — vẽ sẵn đúng số lượng là lộ đáp án của bài đếm (ADR-14).

## 3. Lặp khuôn câu lệnh

**Lỗi QC chỉ ra:** cả 214 bài `LISTEN_CHOOSE` dùng chung một câu lệnh và một gợi ý.

Nay mỗi dạng bài (theo từng ngôn ngữ) có **≥ 6 câu lệnh** và **≥ 4 gợi ý**, chia đều theo chỉ số:

| Dạng | Số bài | Câu lệnh khác nhau | Gợi ý khác nhau |
|---|---|---|---|
| LISTEN_CHOOSE vi | 124 | 7 | 9 |
| LISTEN_CHOOSE en | 90 | 22 | 7 |
| READ_ALOUD vi | 81 | 11 | 10 |
| READ_ALOUD en | 44 | 8 | 7 |
| MCQ vi | 383 | 323 | 179 |
| MCQ en | 144 | 112 | 93 |
| DRAG_DROP vi / en | 129 / 56 | 126 / 40 | 37 / 42 |
| COUNT_TAP vi / en | 65 / 35 | 60 / 19 | 19 / 7 |
| WRITE_PHOTO vi / en | 56 / 29 | 54 / 29 | 22 / 14 |

Câu lệnh cao nhất hiện chiếm **< 25 %** số bài cùng dạng. Một lưu ý đã thành quy tắc: **không nhắc
tên mascot trong câu lệnh bài nghe** — "Bạn **Cú** đọc một tiếng…" trùng với chính tiếng phải nghe
("cú"), làm bài mất tác dụng.

## 4. Vặt

- `sourceRef` của Toán: **385 bài** đổi từ dải 11–12 trang ("tr.56–67") sang **đúng trang của bài**
  theo `docs/09` §2 — Bài 1 tr.8 · Bài 2 tr.14 · Bài 3 tr.20 · Bài 4 tr.24 · Bài 5 tr.32 ·
  Bài 10 tr.56 · Bài 11 tr.68. Bài toán tranh tách theo câu hỏi: "có tất cả" → Bài 10, "còn lại" → Bài 11.
  `DEM_VAT` tách theo số lượng đếm (≤ 5 → Bài 1, còn lại → Bài 2). `lessonUnitCode` chỉnh theo.
- `VIET.HV.DAU_THANH` trước ghi mọi bài về Bài 9; nay mỗi bài trỏ đúng bài dạy thanh đó
  (huyền → Bài 2, sắc → Bài 3, hỏi → Bài 6, nặng → Bài 7, ngã → Bài 9).

## 5. Ba kiểm định mới trong `content:validate`

| Kiểm định | File | Bắt được gì |
|---|---|---|
| **Mã lỗi hợp nghĩa** | `packages/content/src/error-semantics.ts` | 30 luật, mỗi mã một luật: `dem_thieu_1` phải đúng bằng đáp án − 1; `lap_lai_tong` phải là số có trong đề; `nham_b_d` phải là đúng phép đổi b↔d; `thieu_dau_thanh` phải là cùng chữ **bỏ** dấu; mã hành vi (`doan_bua`, `bo_trong`…) không bao giờ được gắn cho phương án; mã chữ viết chỉ hợp với bài viết/tô hoặc phương án một chữ. Luật chỉ lên tiếng khi **chắc chắn** — phương án bằng tranh thì im lặng. |
| **Không dùng chữ chưa học** | `packages/content/src/tieng-viet-progression.ts` | Bảng "chữ/vần/dấu đã học tới bài N" dựng từ 83 bài của `docs/09` §3; kiểm chữ cái, **vần** (vần "ay" chỉ hợp lệ từ bài 38 dù a và y đã học) và dấu thanh. |
| **Cảnh báo lặp câu lệnh** | `checkPromptVariety` trong `exercise-validate.ts` | Cảnh báo khi một câu lệnh chiếm > 25 % số bài cùng dạng, hoặc một cặp (dạng, ngôn ngữ) có < 6 câu lệnh / < 4 gợi ý. Là **cảnh báo**, không phải lỗi: lặp là vấn đề chất lượng, không phải file hỏng. |

Ba kiểm định này có **20 test đơn vị** (`error-semantics.test.ts`, `tieng-viet-progression.test.ts`,
`prompt-variety.test.ts`), trong đó có đúng hai ca QC nêu: phương án "8" của bài "2 và mấy thì được
8?" và tiếng "Nem" trong bài 1.

## 6. Một chỗ nới luật, có chủ ý

`MIN_TARGETED_ERROR` (≥ 6 bài có `targetsError` mỗi gói) hạ từ **lỗi** xuống **cảnh báo** với những
gói mà bộ mã không có mã nào hợp: `ESL.VOC.ADJECTIVES` và `ESL.VOC.FAMILY` là học từ vựng — chọn
"short" thay cho "tall" không phải một lỗi chẩn đoán được, và bịa ra một mã cho nó sẽ khiến thang rèn
đi rèn nhầm thứ. Gói Toán và gói học vần vẫn là **lỗi** như cũ.

## 7. Còn lại cho các việc sau của pha 3

- `dragItems[].errorTag` (185 bài kéo-thả vẫn chỉ biết "chưa đúng") — **việc 3** của pha 3.
- Hình trong bài vẫn là emoji; khi `content/art/objects/manifest.json` có rồi (việc 1) thì rà lại để
  chuyển dần sang `ImageRef.kind = "asset"`.
- `ESL/ENL/EMATH` vẫn chưa bám sách của trường (chờ *Global Success 1*) — tồn đọng từ pha 2.
