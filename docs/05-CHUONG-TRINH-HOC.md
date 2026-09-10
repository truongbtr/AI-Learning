# 05 — BẢN ĐỒ CHƯƠNG TRÌNH HỌC LỚP 1 (HỆ SONG NGỮ EDISON)

> Nguồn seed cho bảng `Skill`. Tài liệu này định nghĩa **cấu trúc, mã, mạch và các kỹ năng đại diện**; dev sinh file `content/skill-map/<subject>.json` đầy đủ (mục tiêu ≥ 250 kỹ năng) theo khung này, và phụ huynh tinh chỉnh trong admin khi nạp giáo trình thực tế của trường. Chuẩn tham chiếu: Common Core State Standards (CCSS) lớp 1, NGSS lớp 1, Chương trình GDPT 2018 lớp 1.

---

## 1. Quy ước mã kỹ năng

`<MÔN>.<MẠCH>.<TÊN>` — ví dụ `EMATH.OA.ADD_WITHIN_10`, `ESL.PH.CVC_SHORT_A`, `VIET.HV.VAN_AN_AT`.

| Môn (enum) | Nghĩa | Mạch (strand) |
|---|---|---|
| `ESL` | Tiếng Anh ESL (giáo trình + NAVIO) | `VOC` từ vựng theo chủ đề · `PH` phonics · `LIS` nghe · `SPK` nói · `GR` cấu trúc câu |
| `ENL` | Tiếng Anh bản ngữ / đọc (Kids A-Z) | `RF` reading foundations · `RL` đọc hiểu truyện · `RI` đọc hiểu thông tin · `W` viết · `SL` nghe–nói · `L` ngôn ngữ |
| `EMATH` | Toán Hoa Kỳ | `OA` phép tính & tư duy đại số · `NBT` số & hệ thập phân · `MD` đo lường & dữ liệu · `G` hình học · `MP` giải toán có lời văn |
| `ESCI` | Khoa học tiếng Anh | `PS` vật chất/ánh sáng/âm thanh · `LS` sinh vật · `ES` trái đất/không gian · `INQ` kỹ năng khoa học · `VOC` từ vựng khoa học |
| `VIET` | Tiếng Việt (CT 2018) | `HV` học vần · `DOC` đọc · `VIET` viết/tập viết · `NN` nói–nghe · `TV` từ và câu |
| `VMATH` | Toán (CT 2018) | `SO` số & phép tính · `HH` hình học · `DL` đo lường · `GT` giải toán |

`gradeLevel`: `K` (nền tảng dưới lớp 1, để lùi khi yếu), `1`, `2` (mở rộng khi vượt).

## 2. Thời khoá biểu lớp 1B3 (seed `content/timetable/1B3-2026.json`; ảnh gốc của trường: `docs/TKB-1B3-2026.png`)

| Tiết | Giờ | Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 |
|---|---|---|---|---|---|---|
| 1–2 | 08:00–09:00 | Life+ (PTCN) | **Toán** (VMATH) | **Tiếng Việt cơ bản** (VIET) | CNTT&KHMT | Nghệ thuật |
| 3–4 | 09:05–10:05 | **ESL&ENL** | **ESL&ENL (native)** | GDTC | **ESL&ENL (native)** | **English Maths** (EMATH) |
| 5–6 | 10:20–11:20 | Sinh hoạt lớp | TN&XH | **Toán – tích hợp** (VMATH) | STEAM & Robotics | **TV tăng cường** (VIET) |
| 7–8 | 13:00–14:00 | **ESL&ENL (native)** | **Tiếng Việt cơ bản** | Câu lạc bộ | **English Maths** | **ESL&ENL (native)** |
| DATN | 14:05–14:35 | **TV (Tập viết + Luyện TV)** | **TV (Tập viết)** | **TV (Tập viết)** | **TV (Tập viết)** | **Toán tăng cường** (VMATH) |
| 9–10 | 14:55–15:55 | **Tiếng Việt cơ bản** | **English Science** (ESCI) | **ESL&ENL (native)** | **Tiếng Việt cơ bản** | Câu lạc bộ |

Nghỉ: 09:00–09:05, 10:05–10:20, ăn trưa 11:20–11:50, ngủ 11:50–13:00, 14:00–14:05, ăn nhẹ 14:35–14:55; tan 16:00.

**Ứng dụng vào Daily Quest:** buổi tối thứ 2 ưu tiên ESL/VIET; thứ 3: VMATH/ESCI; thứ 4: VIET/VMATH/ENL; thứ 5: ENL/EMATH; thứ 6: EMATH/VIET; cuối tuần: ôn tổng hợp + English Science (chỉ 1 tiết/tuần nên cần bổ trợ).

## 3. Bản đồ kỹ năng theo môn (kỹ năng đại diện — dev mở rộng)

### 3.1 ESL — Tiếng Anh (NAVIO / giáo trình Macmillan)

NAVIO đi kèm giáo trình Macmillan theo unit chủ đề; phụ huynh sẽ nạp tên giáo trình + unit thực tế (FR-INT-03). Bản đồ nền:

| Mã | Tên | Chuẩn/ghi chú |
|---|---|---|
| `ESL.VOC.GREETINGS` | Chào hỏi, giới thiệu tên, tuổi | Hello/What's your name/How old |
| `ESL.VOC.COLORS` · `NUMBERS_1_20` · `SCHOOL_OBJECTS` · `FAMILY` · `BODY` · `ANIMALS_PETS` · `ANIMALS_FARM` · `FOOD` · `TOYS` · `CLOTHES` · `WEATHER` · `HOUSE_ROOMS` · `ACTIONS_VERBS` · `SHAPES` | Từ vựng theo chủ đề (mỗi chủ đề 8–12 từ) | Unit NAVIO tương ứng gắn sau khi nạp |
| `ESL.PH.ALPHABET_NAMES` / `ALPHABET_SOUNDS` | Tên chữ / âm chữ cái | RF.K.1d, RF.1.3 |
| `ESL.PH.CVC_SHORT_A` · `_E` · `_I` · `_O` · `_U` | Đọc/ghép từ CVC theo nguyên âm ngắn | RF.1.3b |
| `ESL.PH.BLENDS_INITIAL` · `DIGRAPHS_SH_CH_TH` · `MAGIC_E` | Phụ âm kép, digraph, nguyên âm dài | RF.1.3a/c |
| `ESL.LIS.WORD_PICTURE` · `LIS.SHORT_INSTRUCTION` · `LIS.SHORT_DIALOGUE` | Nghe từ chọn tranh / làm theo lệnh / nghe hội thoại ngắn | |
| `ESL.SPK.ANSWER_YES_NO` · `SPK.ANSWER_WH` · `SPK.DESCRIBE_PICTURE` | Trả lời câu hỏi, mô tả tranh 1 câu | SL.1.4 |
| `ESL.GR.THIS_THAT` · `GR.IS_ARE` · `GR.HAVE_HAS` · `GR.CAN_CANT` · `GR.PLURAL_S` · `GR.PREPOSITIONS_IN_ON_UNDER` · `GR.LIKE_DONT_LIKE` | Cấu trúc câu cơ bản | L.1.1 |

### 3.2 ENL — Tiếng Anh bản ngữ / đọc (Kids A-Z: Raz-Kids)

| Mã | Tên | Chuẩn |
|---|---|---|
| `ENL.RF.PRINT_CONCEPTS` | Khái niệm chữ in: câu, chữ đầu viết hoa, dấu chấm | RF.1.1 |
| `ENL.RF.RHYME` · `RF.SYLLABLES` · `RF.BLEND_PHONEMES` · `RF.SEGMENT_PHONEMES` · `RF.ISOLATE_SOUNDS` | Nhận thức âm vị | RF.1.2 |
| `ENL.RF.SIGHT_WORDS_PREPRIMER` · `_PRIMER` · `_GRADE1` (Dolch) | Từ nhìn (sight words) theo bậc | RF.1.3g |
| `ENL.RF.VOWEL_TEAMS` · `RF.R_CONTROLLED` · `RF.INFLECTIONS_S_ED_ING` · `RF.TWO_SYLLABLE` | Phonics nâng cao | RF.1.3 |
| `ENL.RF.FLUENCY_LEVEL_aa` … `FLUENCY_LEVEL_J` (theo cấp Raz aa, A, B, C, D, E, F, G, H, I, J) | Đọc trôi chảy theo cấp độ Raz-Kids | RF.1.4; ánh xạ `ExternalProgress.raz_level` |
| `ENL.RL.KEY_DETAILS` · `RL.RETELL` · `RL.CHARACTERS_SETTING` · `RL.WHO_SAYS` | Đọc hiểu truyện | RL.1.1–1.6 |
| `ENL.RI.MAIN_TOPIC` · `RI.TEXT_FEATURES` · `RI.PICTURE_INFO` | Đọc hiểu văn bản thông tin | RI.1.2, 1.5, 1.7 |
| `ENL.W.SENTENCE` · `W.OPINION` · `W.NARRATIVE_3_EVENTS` · `W.INFORMATIVE` | Viết câu, đoạn ngắn | W.1.1–1.3 |
| `ENL.SL.ASK_ANSWER` · `SL.DESCRIBE_DETAILS` · `SL.COMPLETE_SENTENCES` | Nghe nói | SL.1.1–1.6 |
| `ENL.L.CAPITALIZATION` · `L.END_PUNCTUATION` · `L.NOUNS_VERBS` · `L.ADJECTIVES` · `L.CONTEXT_CLUES` · `L.CATEGORIES` | Ngôn ngữ | L.1.1–1.5 |

### 3.3 EMATH — Toán Hoa Kỳ (CCSS lớp 1)

| Mã | Tên | CCSS |
|---|---|---|
| `EMATH.OA.ADD_WITHIN_10` · `SUB_WITHIN_10` | Cộng/trừ trong 10 (thành thạo) | 1.OA.C.6 |
| `EMATH.OA.ADD_WITHIN_20` · `SUB_WITHIN_20` | Cộng/trừ trong 20 (chiến lược: make ten, counting on) | 1.OA.C.6 |
| `EMATH.OA.WORD_PROBLEMS_ADD_SUB` | Bài toán có lời văn cộng/trừ trong 20 | 1.OA.A.1 |
| `EMATH.OA.THREE_ADDENDS` | Cộng 3 số | 1.OA.A.2 |
| `EMATH.OA.PROPERTIES_COMMUTATIVE` · `RELATE_ADD_SUB` | Tính chất, quan hệ cộng–trừ | 1.OA.B.3–4 |
| `EMATH.OA.COUNT_ON` · `EQUAL_SIGN_MEANING` · `UNKNOWN_IN_EQUATION` | Đếm tiếp, dấu bằng, số chưa biết | 1.OA.C.5, D.7–8 |
| `EMATH.NBT.COUNT_TO_120` · `READ_WRITE_NUMERALS_120` | Đếm, đọc, viết đến 120 | 1.NBT.A.1 |
| `EMATH.NBT.TENS_ONES` · `COMPARE_TWO_DIGIT` | Hàng chục–đơn vị; so sánh <, >, = | 1.NBT.B.2–3 |
| `EMATH.NBT.ADD_WITHIN_100` · `TEN_MORE_LESS` · `SUB_MULTIPLES_10` | Cộng trong 100, thêm/bớt 10, trừ tròn chục | 1.NBT.C.4–6 |
| `EMATH.MD.ORDER_LENGTH` · `MEASURE_NONSTANDARD` | So sánh, đo bằng đơn vị không chuẩn | 1.MD.A.1–2 |
| `EMATH.MD.TELL_TIME_HOUR_HALF` | Xem giờ đúng, giờ rưỡi | 1.MD.B.3 |
| `EMATH.MD.DATA_3_CATEGORIES` | Đọc/tổ chức dữ liệu 3 nhóm (tally, bar) | 1.MD.C.4 |
| `EMATH.G.SHAPE_ATTRIBUTES` · `COMPOSE_SHAPES` · `HALVES_QUARTERS` | Hình học | 1.G.A.1–3 |
| `EMATH.MP.MATH_VOCAB_EN` | Từ vựng toán tiếng Anh (sum, difference, more than, fewer…) | hỗ trợ đọc đề |

Kỹ năng `K`: `EMATH.OA.ADD_WITHIN_5`, `NBT.COUNT_TO_20`, `NBT.COMPARE_1_10`, `G.NAME_2D_SHAPES`.

### 3.4 ESCI — Khoa học tiếng Anh (NGSS lớp 1 + chủ đề chương trình quốc tế)

| Mã | Tên | Tham chiếu |
|---|---|---|
| `ESCI.PS.LIGHT_SEE` · `PS.LIGHT_MATERIALS` · `PS.SOUND_VIBRATION` · `PS.COMMUNICATE_LIGHT_SOUND` | Ánh sáng & âm thanh | 1-PS4-1…4 |
| `ESCI.LS.PLANT_PARTS` · `LS.ANIMAL_BODY_PARTS_SURVIVE` · `LS.PARENTS_OFFSPRING` · `LS.LIVING_NONLIVING` · `LS.NEEDS_OF_LIVING_THINGS` | Sinh vật | 1-LS1-1, 1-LS1-2, 1-LS3-1 |
| `ESCI.ES.SUN_MOON_STARS_PATTERNS` · `ES.SEASONS_DAYLIGHT` · `ES.WEATHER_TYPES` | Trái đất & không gian | 1-ESS1-1…2 |
| `ESCI.VOC.MATERIALS` · `VOC.SENSES` · `VOC.HABITATS` | Từ vựng khoa học theo chủ đề | |
| `ESCI.INQ.OBSERVE_DESCRIBE` · `INQ.PREDICT` · `INQ.SORT_CLASSIFY` · `INQ.RECORD_DRAW` | Kỹ năng khoa học | SEP |

> **Bộ sách trường dùng: "Kết nối tri thức với cuộc sống" (NXB GDVN).** Cấu trúc bài học thực tế của Toán 1 (cả năm) và Tiếng Việt 1 tập hai, cùng ánh xạ bài ↔ kỹ năng ↔ tuần, ở `09-GIAO-TRINH-TRUONG.md`. Hai mục 3.5–3.6 dưới đây là bản đồ nền; seed pha 1 phải gộp thêm kỹ năng và `lessonRef`/`expectedWeek` từ `09`.

### 3.5 VIET — Tiếng Việt (CT GDPT 2018, lớp 1)

| Mã | Tên | Ghi chú |
|---|---|---|
| `VIET.HV.CHU_CAI_29` · `HV.DAU_THANH` | Bảng chữ cái, 6 dấu thanh | học kỳ 1 |
| `VIET.HV.AM_DON` (a, o, ô, ơ, e, ê, i, u, ư…) · `HV.PHU_AM` (b, c, d, đ, g, h, k, l, m, n, p, q, r, s, t, v, x) · `HV.PHU_AM_GHEP` (ch, gh, kh, ng, ngh, nh, ph, th, tr, gi, qu) | Âm, chữ | mỗi nhóm âm 1 kỹ năng con (dev tách ~20 kỹ năng) |
| `VIET.HV.VAN_2_AM` (an, at, am, ap, ang, ac, ai, ao, au, ay…) · `HV.VAN_3_AM` (oan, uôn, ươn, iêng, uông…) | Vần | tách theo nhóm SGK (~25 kỹ năng), có `expectedWeek` |
| `VIET.HV.NHAM_LAN_B_D` · `NHAM_LAN_P_Q` · `NHAM_LAN_S_X` · `NHAM_LAN_CH_TR` · `NHAM_LAN_DAU_HOI_NGA` | Lỗi thường gặp (kỹ năng "âm") | dùng cho `errorType` |
| `VIET.DOC.DOC_TIENG` · `DOC_TU` · `DOC_CAU` · `DOC_DOAN_NGAN` · `DOC_HIEU_TRA_LOI` | Đọc thành tiếng → hiểu | học kỳ 2 nặng hơn |
| `VIET.VIET.TO_CHU_THUONG` · `VIET_CHU_HOA` · `VIET_CHU_SO` · `VIET_TU_VAN` · `VIET_CAU_CHINH_TA_NHIN` · `CHINH_TA_NGHE_VIET` | Tập viết, chính tả | DATN mỗi ngày |
| `VIET.NN.KE_LAI` · `NN.TRA_LOI_CAU_HOI` · `NN.NOI_THEO_TRANH` · `NN.CHAO_HOI_LE_PHEP` | Nói và nghe | |
| `VIET.TV.TU_CHI_SU_VAT` · `TV.DAU_CHAM_HOI` · `TV.VIET_HOA_DAU_CAU` | Từ và câu | học kỳ 2 |

### 3.6 VMATH — Toán (CT GDPT 2018, lớp 1)

| Mã | Tên |
|---|---|
| `VMATH.SO.SO_1_10` · `SO_SANH_1_10` · `TACH_GOP_10` · `CONG_PV_10` · `TRU_PV_10` | Học kỳ 1 |
| `VMATH.SO.SO_11_20` · `SO_DEN_100` · `CHUC_DON_VI` · `SO_SANH_100` · `CONG_KHONG_NHO_100` · `TRU_KHONG_NHO_100` · `CONG_TRU_TRON_CHUC` | Học kỳ 2 |
| `VMATH.HH.HINH_VUONG_TRON_TAM_GIAC_CN` · `HH.KHOI_HOP_KHOI_LAP_PHUONG` · `HH.VI_TRI_TREN_DUOI_TRAI_PHAI` · `HH.DIEM_DOAN_THANG` | Hình học |
| `VMATH.DL.DAI_HON_NGAN_HON` · `DL.DO_CM` · `DL.XEM_GIO_DUNG` · `DL.NGAY_TUAN` | Đo lường |
| `VMATH.GT.BAI_TOAN_THEM` · `GT.BAI_TOAN_BOT` · `GT.DOC_HIEU_DE_TOAN` | Giải toán có lời văn |

Liên kết chéo: `VMATH.SO.CONG_PV_10` ↔ `EMATH.OA.ADD_WITHIN_10` (cùng năng lực, khác ngôn ngữ) — dùng trường `relatedSkillCodes` để bằng chứng ở môn này tăng nhẹ confidence môn kia (hệ số 0.3), không tăng mastery.

## 4. Ánh xạ nền tảng bên ngoài

| Nền tảng | Dữ liệu phụ huynh chụp | `ExternalProgress.metric` | Kỹ năng bị ảnh hưởng |
|---|---|---|---|
| **Kids A-Z / Raz-Kids** | Màn hình cấp độ hiện tại (aa–Z), sách đã đọc, điểm quiz, sao | `raz_level`, `books_read`, `quiz_score`, `stars` | `ENL.RF.FLUENCY_LEVEL_*` (cấp đạt → mastery ≥ 70 cho cấp đó và các cấp dưới), `ENL.RL.*`/`RI.*` theo điểm quiz |
| **NAVIO** | Màn hình tiến độ unit, điểm hoạt động, sao | `unit_completed`, `activity_score`, `stars` | kỹ năng gắn với `LessonUnit` NAVIO tương ứng (`ESL.VOC.*`, `ESL.GR.*`) |
| Sổ liên lạc / nhận xét cô | Ảnh nhận xét | — (thành `Evidence` loại `INTAKE_TEACHER_NOTE`) | theo nội dung |

Bảng ánh xạ cấp Raz → mastery gợi ý: cấp đạt hiện tại = 70, cấp dưới liền kề = 85, cấp dưới nữa = 95; cấp trên liền kề = 30 (`LEARNING`).

## 5. Lịch năm học (seed `SchoolWeek`)

Năm học 2026–2027, tuần 1 giả định bắt đầu **08/09/2026** (thứ Ba — vì 2/9 nghỉ lễ và khai giảng 5/9; phụ huynh chỉnh trong admin). HK1 ≈ 18 tuần, HK2 ≈ 17 tuần, nghỉ Tết theo lịch trường. `Skill.expectedWeek` dùng để vẽ "lộ trình mong đợi" trên dashboard (FR-PAR-02).

## 6. Yêu cầu với file seed

- Định dạng JSON mảng, mỗi phần tử đúng các trường của `Skill` (§`03-MO-HINH-DU-LIEU.md` 2.2) + `prerequisites: string[]` + `relatedSkillCodes: string[]`.
- `description` ≥ 2 câu, có "Ví dụ:" và "Lỗi thường gặp:".
- `exerciseTypes` phải thuộc 9 dạng; kỹ năng đọc to bắt buộc có `READ_ALOUD`; kỹ năng viết có `WRITE_PHOTO`/`TRACE`.
- Kiểm thử seed: không mã trùng, tiên quyết tồn tại, không vòng lặp tiên quyết, mỗi môn ≥ 35 kỹ năng.
