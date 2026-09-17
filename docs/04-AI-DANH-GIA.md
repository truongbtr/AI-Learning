# 04 — BỘ MÁY AI & ĐÁNH GIÁ NĂNG LỰC

> Tài liệu quan trọng nhất về "trí tuệ" của hệ thống. Dev triển khai trong `packages/core` (thuật toán thuần) và `packages/ai` (gọi model). QC kiểm thử theo các ví dụ số ở đây.

---

## 1. Tổng quan các tác vụ AI

> **Hai nơi dùng AI, tách hẳn nhau (ADR-9, xem `10-NAP-NOI-DUNG.md`):** nội dung học được **Claude Code soạn ngoại tuyến** trong repo rồi nạp DB; app lúc chạy chỉ dùng AI cho vài việc mỏng và vẫn chạy được khi không có khoá AI.

**A. Ngoại tuyến — Claude Code làm trong repo, không phải code của app**

| Việc | Mục đích | Đầu vào | Đầu ra |
|---|---|---|---|
| Đọc sách | Rút bài học từ SGV/SGK quét | ảnh trang PDF trong `sach giao khoa/` | `content/lessons/**.json` |
| Soạn bài luyện | Ngân hàng bài cho từng kỹ năng | bản đồ kỹ năng + bài học + rubric `10` §6 | `content/exercises/**.pack.json` |
| Tự kiểm định | Bắt lỗi trước khi tới con | file vừa soạn + `content:validate` | `content/_reports/*.md` |

**B. Theo lô — cũng do Claude Code làm, qua hàng chờ (ADR-10, `13-HANG-CHO-AI.md`)**

> Các "task" dưới đây **không còn là lời gọi API trong app**. App chỉ gom việc vào `InboxItem`; Ba chạy Claude Code "Xử lý hàng chờ AI" vài lần một tuần; kết quả nạp về theo đúng schema rồi ba mẹ duyệt. Cột "Model gợi ý" chỉ còn ý nghĩa tham khảo — Claude Code dùng model của chính nó.

| Task | Mục đích | Đầu vào | Đầu ra (schema Zod) | Model gợi ý |
|---|---|---|---|---|
| `INTAKE_EXTRACT` | Đọc ảnh bài vở/bài KT/nhận xét/báo cáo app | ảnh (1–20), gợi ý môn/bé/ngày | `IntakeExtraction` | Sonnet (vision) |
| `INTAKE_MAP` | Gắn kỹ năng cho từng item | items + top-k skill ứng viên (full-text `searchSkills`) + few-shot sửa của phụ huynh | `SkillMapping[]` | Haiku (Sonnet nếu confidence thấp) |
| `GRADE` | Chấm bài mở (đọc to, nói, viết chụp) | spec + đáp án + transcript/ảnh | `GradeResult` | Haiku (đọc to, nói) / Sonnet (ảnh viết) |
| `PLAN` | Đề xuất kế hoạch 1–2 tuần | snapshot mastery, TKB, unit đang học, lịch sử plan | `PlanProposal` | Sonnet |
| `REPORT` | Viết báo cáo tuần | số liệu tổng hợp (JSON) | Markdown + `ReportHighlights` | Sonnet |
| `ASSIST_PARENT` | Trợ lý phụ huynh | câu hỏi + tool (truy vấn DB) | text stream có trích dẫn | Sonnet |
| `ASSIST_KID` | Gia sư giọng nói cho con | transcript + ngữ cảnh phiên học | text ≤ 2 câu + `safety` | Haiku (+ bộ lọc) |
| `EMBED` | Vector cho skill/unit (phục vụ gắn kỹ năng khi đọc ảnh) | text | vector | Voyage AI (`voyage-3`) hoặc provider tương đương qua adapter |
| `DIARY_PARSE` | Đọc nhật ký lớp hằng ngày (Edi Parent) | văn bản hoặc ảnh + ngày + bản đồ kỹ năng | `ClassDiaryExtraction` (`11` §4) | Haiku (văn bản) / Sonnet (ảnh) |
| `EXERCISE_GEN` *(mặc định TẮT)* | Sinh bù khi ngân hàng cạn cho một kỹ năng | slot + bài học + bài đã dùng | `ExerciseSpec[]` | Sonnet |

Mọi kết quả nhóm B phải **đúng schema Zod** (`pnpm inbox:validate` chặn), có `sourceRef`, và vào DB ở trạng thái **chờ duyệt**. Riêng: `ASSIST_KID` **bỏ khỏi v1**; `ASSIST_PARENT` = Ba hỏi Claude Code trong repo sau `pnpm export:student`; `EMBED` bỏ (Claude Code gắn kỹ năng trực tiếp); `EXERCISE_GEN` bỏ hẳn; `GRADE` cho đọc to **không cần AI** (STT + so khớp từ + ba mẹ chấm tay khi máy không chắc), chỉ ảnh viết tay và nói đáp mới vào hàng chờ.

## 2. Bản đồ kỹ năng — cách AI dùng

- Mỗi `Skill` có `description` viết cho AI: phạm vi, ví dụ đúng, ví dụ *không* thuộc kỹ năng này, lỗi thường gặp của trẻ 6 tuổi.
- Gắn kỹ năng 2 bước: (1) full-text `searchSkills` văn bản item → top-8 skill ứng viên cùng môn (ADR-12, không embedding); (2) model chọn 1–2 skill + confidence, kèm few-shot từ bảng "phụ huynh đã sửa" (`IntakeItem.skillCodes` ≠ `skillCodesFinal`).
- Kỹ năng tiên quyết dùng để: (a) khi kỹ năng B yếu, kiểm tra A trước; (b) không luyện B khi A < 40.

## 3. Mô hình năng lực (mastery) — thuật toán bắt buộc

Chọn mô hình **giải thích được**, ổn định với ít dữ liệu (ADR-7). Kết hợp: *Bayesian Knowledge Tracing đơn giản hoá* cho `mastery` + *trọng số nguồn* + *decay theo thời gian* + *SM-2 rút gọn* cho lịch ôn.

### 3.1 Cập nhật khi có bằng chứng

Ký hiệu: `m` = mastery hiện tại (0–100), `s` = score bằng chứng (0–1), `w` = trọng số nguồn, `d` = độ khó (1–5), `c` = confidence hiện tại (0–1).

```
k_base = 18                                 # bước học cơ bản
k = k_base * w * (1 + 0.15 * (d - 3))       # bài khó đúng → tăng nhiều hơn
if hintsUsed > 0: s = s * 0.6                # dùng gợi ý giảm giá trị
if tries > 1:     s = s * (0.7 ** (tries-1))
target = s * 100
m_new = m + (target - m) * (k / 100) * (1.4 - c*0.6)   # confidence thấp → nhảy nhanh hơn
m_new = clamp(m_new, 0, 100)
c_new = min(1, c + 0.08 * w)                # mỗi bằng chứng tăng tin cậy
```

Trọng số `w` theo nguồn: `EXERCISE` 1.0 · `INTAKE_PHOTO` 0.8 · `INTAKE_TEACHER_NOTE` 0.9 · `HOMEWORK` 0.8 (ADR-13) · `EXTERNAL_REPORT` 0.7 · `PARENT_NOTE` 0.5 · `VOICE_TUTOR` 0.3 · `PARENT_OVERRIDE` = đặt thẳng giá trị, `c = 0.9`.

**Ví dụ kiểm thử (QC):** m=50, c=0.5, bằng chứng EXERCISE đúng (s=1), d=3, không gợi ý → k=18; m_new = 50 + 50×0.18×1.1 = **59.9**; c_new=0.58. Sai (s=0): m_new = 50 − 50×0.18×1.1 = **40.1**.

### 3.2 Decay (job hằng đêm)

Sau 21 ngày không có bằng chứng: mỗi ngày `c -= 0.01` (tối thiểu 0.2); `m` giảm 0.3/ngày nếu `m > 60` (kiến thức quên dần), tối thiểu 60 với kỹ năng đã từng `MASTERED`. Ghi `MasteryHistory(cause=DECAY)` theo tuần (không ghi từng ngày).

### 3.3 Trạng thái

| status | Điều kiện |
|---|---|
| `NOT_STARTED` | evidenceCount = 0 |
| `LEARNING` | có bằng chứng, m < 60 hoặc c < 0.4 |
| `NEEDS_PRACTICE` | m < 60 và c ≥ 0.4 **hoặc** trend14d ≤ −8 |
| `SOLID` | 60 ≤ m < 85, c ≥ 0.4 |
| `MASTERED` | m ≥ 85, c ≥ 0.6, ≥ 3 bằng chứng đúng trong 3 ngày khác nhau (giờ Việt Nam) |

"Bằng chứng **đúng**" = `outcome = CORRECT`, hoặc `score ≥ 0.8` khi bằng chứng chỉ có điểm liên tục; `PARENT_OVERRIDE` không tính (ADR-13 §3).

### 3.4 Lịch ôn (spaced repetition)

Khi kỹ năng đạt `SOLID` trở lên: `interval = 2 → 4 → 8 → 16 → 30 ngày` mỗi lần ôn đúng; ôn sai → về 2 ngày và giảm mastery theo §3.1. `nextReviewAt` dùng trong lập phiên.

### 3.5 "Điểm yếu" — định nghĩa để AI và dashboard nhất quán

Kỹ năng là *điểm yếu* nếu: `NEEDS_PRACTICE`, hoặc `LEARNING` với ≥ 3 bằng chứng mà m < 50, hoặc có ≥ 2 lỗi cùng `errorType` trong 14 ngày. Điểm yếu **có tiên quyết yếu hơn** thì tiên quyết được ưu tiên trước (tìm gốc rễ).

## 4. Lập phiên học (planner) — thuật toán

Đầu vào: bé, ngày, `dailyMinutes`, kế hoạch đã duyệt (nếu có), TKB, unit đang học, mastery, `nextReviewAt`, lịch sử 7 ngày.

1. **Số bài** `n = round(dailyMinutes / 1.3)` (≈ 1.3 phút/bài; 15 phút → 11–12 bài), min 8, max 15.
2. **Bài cô giao trước tiên:** `Homework` còn `PENDING` gắn được dạng bài → đưa lên đầu phiên, không tính vào `n` (xem `11` §6.2).
3. **Phân bổ slot:** 50% "trọng tâm" — ưu tiên kỹ năng của **bài lớp học trong 3 ngày gần nhất** (`DiaryLesson`, `11` §6.1), rồi tới điểm yếu §3.5 ∩ kế hoạch; 30% "ôn" (`nextReviewAt ≤ hôm nay`, ưu tiên quá hạn lâu); 20% "mới" (kỹ năng của bài hôm nay chưa có bằng chứng, hoặc `NOT_STARTED` có tiên quyết ≥ 60). Không có nhật ký → rơi về TKB + `expectedWeek` như cũ, không bao giờ chặn phiên học.
4. **Đa dạng:** không quá 3 bài liên tiếp cùng môn; ≥ 3 dạng bài khác nhau; bài 1 luôn là bài dễ đã vững (khởi động), bài cuối là bài "chắc chắn làm được" (kết thúc vui).
5. **Độ khó:** `d = round(1 + 4 * m/100)` ± bias của bé; nếu 2 bài sai liên tiếp trong phiên → bài kế giảm 1 mức (adaptive trong phiên).
6. **Chọn bài:** truy vấn `Exercise` đã phát hành (đúng kỹ năng, độ khó ±1, chưa dùng cho bé này 7 ngày, `qualityFlag ≠ BAD`), ưu tiên `assetTheme` hợp thế giới của bé và `targetsError` trùng lỗi gần đây (`10` §7). Không gọi AI. Nếu một kỹ năng còn < 10 bài khả dụng → ghi cảnh báo cho `content:stats`, tạm lấy bài kỹ năng tiên quyết; chỉ khi bật `EXERCISE_GEN` trong admin mới sinh bù.
7. **Ghi `Session.slots` kèm `reason`** ("ôn quá hạn 3 ngày", "yếu: nhầm b/d", "unit 3 tuần này") — phụ huynh xem được vì sao có bài này.

## 5. `ExerciseSpec` — hợp đồng dữ liệu bài luyện

> Đây là hình dạng dữ liệu **trong DB và gửi cho client**. Nguồn của nó là file `content/exercises/**.pack.json` do Claude Code soạn (`10` §4.2); trình nạp dựng `ExerciseSpec` từ file đó.

```ts
type ExerciseSpec = {
  type: 'MCQ'|'LISTEN_CHOOSE'|'DRAG_DROP'|'READ_ALOUD'|'COUNT_TAP'|'WRITE_PHOTO'|'SPEAK_ANSWER'|'TRACE'|'MINI_STORY';
  language: 'en'|'vi';
  subject: 'ESL'|'ENL'|'EMATH'|'ESCI'|'VIET'|'VMATH';
  skillCodes: string[];                 // 1–2
  difficulty: 1|2|3|4|5;
  prompt: { text: string; tts?: boolean; audioKey?: string; image?: ImageRef };  // đề bài, ngắn ≤ 15 từ
  // theo type:
  choices?: { id: string; text?: string; image?: ImageRef; audio?: string; errorTag?: string }[];   // MCQ, LISTEN_CHOOSE (2–4); errorTag = mã lỗi §11.2
  scaffold?: 'none'|'model'|'guided';    // 'model': mascot làm mẫu bài sinh đôi trước (§11.4 bậc 3)
  dragItems?: { id: string; text?: string; image?: ImageRef }[];
  dropZones?: { id: string; label?: string; image?: ImageRef; accepts: string[] }[];  // DRAG_DROP
  readTarget?: { text: string; words: string[]; modelAudioKey?: string };        // READ_ALOUD
  listenTarget?: { text: string; audioKey?: string };   // LISTEN_CHOOSE — tiếng ĐƯỢC ĐỌC, KHÔNG BAO GIỜ in ra (ADR-14)
  countTarget?: { objects: ImageRef; layout: 'grid'|'line' };   // COUNT_TAP — correctCount nằm trong answerKey, không gửi client
  traceTarget?: { glyph: string; strokes?: Path[] };                              // TRACE
  story?: { sentences: { text: string; image?: ImageRef }[]; questions: MCQ[] };  // MINI_STORY
  rubric?: { criteria: string[]; sampleAnswers: string[] };                       // SPEAK_ANSWER, WRITE_PHOTO
  hints: string[];                       // 1–2 gợi ý, ngắn, đọc được
  explanation: string;                   // giải thích khi sai, ≤ 20 từ, giọng thân thiện
  answerKey: unknown;                    // KHÔNG nằm trong spec gửi client — xem gói answerKey bên dưới
  meta: { theme?: string; personalizedFor?: string; lessonUnitCode?: string; estSeconds: number };
};
```

- `ImageRef` = `{ kind: 'emoji'|'icon'|'asset'|'generated', value: string, labelVi?, labelEn?, repeat? }` — v1 ưu tiên **emoji và bộ icon SVG có sẵn** (không sinh ảnh AI), bài cần ảnh thật dùng thư viện ảnh nội bộ do phụ huynh nạp hoặc `generated` ở P2. `repeat` = vẽ hình mấy lần, bắt buộc với câu hỏi đếm (ADR-14).
- Client **không nhận `answerKey`** với dạng đóng; chấm ở server (`POST attempt`). Ngoại lệ: cho phép chấm cục bộ offline với chữ ký HMAC của đáp án — dev chọn 1 cách và ghi ADR.
- **Cột `Exercise.answerKey` lưu một gói, chỉ máy chủ đọc** (ADR-14): `{ value, errorTags?: { <choiceId>: <mã lỗi> }, correctCount?: number }`. `choices[].errorTag` và `countTarget.correctCount` bị cắt khỏi `spec` trước khi gửi client — cái đầu làm lộ chẩn đoán, cái sau làm lộ đáp án.
- **Bài `LISTEN_CHOOSE`:** đề bài chỉ là câu hướng dẫn trung tính; tiếng phải nghe nằm ở `listenTarget` và **bộ render không bao giờ được hiển thị nó** — in ra là bé biết đọc chỉ cần nhìn, bài không còn đo kỹ năng nghe (ADR-14).

## 6. Prompt — nguyên tắc & khung

> Các nguyên tắc dưới đây áp dụng cho **cả hai nơi**: Claude Code tuân theo khi soạn nội dung ngoại tuyến, và prompt của app tuân theo khi chấm/viết báo cáo/trò chuyện.

Mỗi prompt của app là file `content/prompts/<task>.v<n>.md` với frontmatter (model, temperature, schema name). Quy tắc chung cho mọi prompt:

- Nêu rõ: học sinh 6 tuổi, lớp 1, hệ song ngữ Việt–Anh, chương trình Common Core lớp 1 + CT GDPT 2018; **không** dùng tên thật của bé (dùng nickname), không dùng ngày sinh.
- Ngôn ngữ đề bài: môn tiếng Anh → tiếng Anh đơn giản (CEFR pre-A1), câu ≤ 8 từ; môn Việt → tiếng Việt lớp 1, từ trong SGK.
- Giọng điệu: vui, tích cực, không phán xét; giải thích dùng "mình", "bạn nhỏ".
- Nội dung an toàn: không bạo lực, không quảng cáo, không đường link, không chủ đề người lớn; không so sánh giữa hai bé.
- Cá nhân hoá: đưa 1–2 sở thích của bé vào ngữ cảnh (robot, công chúa, mèo…), nhưng giữ đúng kỹ năng.
- Bám giáo trình: nếu có `LessonUnit`, ưu tiên từ vựng/khái niệm/dạng bài trong unit; nếu không, theo mô tả kỹ năng.
- Tránh trùng: nhận danh sách `contentHash`/đề bài 30 bài gần nhất của kỹ năng, phải khác.
- Đầu ra: **chỉ** gọi tool `emit_<schema>` với JSON hợp lệ.

Khung soạn bài luyện — Claude Code dùng khi soạn nội dung ngoại tuyến, và cũng là prompt của `EXERCISE_GEN` nếu bật sinh bù (tóm tắt):
```
SYSTEM: Bạn là giáo viên tiểu học song ngữ, thiết kế bài luyện 1 phút cho trẻ 6 tuổi…(nguyên tắc trên)
USER:
  <student> nickname, interests, recentErrors[] </student>
  <slot> skill{code,nameEn,description,commonErrors}, type, difficulty, language </slot>
  <lessonUnit> title, vocabulary, concepts, sampleTasks </lessonUnit>   (nếu có)
  <avoid> 30 đề bài gần đây </avoid>
  Sinh N=6 bài, tăng dần độ khó trong ±1. Gọi emit_exercises.
```

Khung `INTAKE_EXTRACT`: mô tả rõ các loại tài liệu (vở bài tập, bài KT có điểm, phiếu, nhận xét, ảnh màn hình NAVIO/Kids A-Z), yêu cầu trích **từng câu** với đáp án của con, đúng/sai theo dấu của cô (✓, ✗, khoanh, gạch), điểm/nhận xét nếu có, `errorType` ngắn gọn, `confidence`; ảnh không phải bài học → `docType=OTHER`, giải thích.

Khung `ASSIST_KID`: system khoá chủ đề (5 môn, bài đang làm), trả lời ≤ 2 câu, ngôn ngữ theo câu hỏi, luôn kết bằng câu động viên; câu ngoài chủ đề → trả `{"safe":false,"reply":"Mình hỏi ba mẹ nhé!"}`. Output còn qua bộ lọc từ khoá + Haiku classifier.

## 7. Chấm bài

| Dạng | Cách chấm | Điểm |
|---|---|---|
| MCQ, LISTEN_CHOOSE, COUNT_TAP, DRAG_DROP, MINI_STORY | So khớp cục bộ với answerKey | 1 / 0 (DRAG_DROP: tỉ lệ vị trí đúng) |
| READ_ALOUD | STT → so khớp từng từ với `readTarget.words` (chuẩn hoá, cho phép sai âm nhẹ theo bảng đồng âm), tính `accuracy`, `wordsPerMinute`; nếu accuracy 0.5–0.85 → gọi GRADE (Haiku) để phân biệt lỗi phát âm/bỏ từ | accuracy |
| SPEAK_ANSWER | STT → GRADE với rubric → `score`, `feedback`, `keyIdeasHit[]` | 0–1 |
| WRITE_PHOTO | Ảnh → GRADE (Sonnet vision) với rubric → `score`, `feedback`, `issues[]` (ví dụ "chữ b viết ngược") | 0–1, trạng thái `PENDING` cho tới khi chấm xong; phụ huynh có thể sửa điểm |
| TRACE | So khớp nét vẽ với đường chuẩn (DTW đơn giản, ngưỡng rộng); v1 chỉ *khuyến khích*, trọng số bằng chứng 0.3 | 0–1 |

Phản hồi cho con luôn qua mẫu tích cực: đúng → "Tuyệt!", sai lần 1 → gợi ý 1, sai lần 2 → gợi ý 2, sai lần 3 → hiện đáp án + `explanation` (đọc to), ghi `tries=3, score=0`.

## 8. Chi phí & ngân sách

**Sản xuất nội dung (ngoại tuyến, trả một lần):** ~4.500–5.000 bài cho cả năm, soạn theo đợt (`10` §9). Chi phí nằm ở phiên Claude Code, không tính vào ngân sách chạy hằng ngày của app; sinh xong dùng lại cho cả hai bé và các năm sau.

**App lúc chạy:** chỉ còn intake ảnh (~8k token cho 3 ảnh, 2–4 lần/tuần), chấm bài mở (~3k token/bé/ngày), báo cáo tuần (~0.2 USD/tuần), trợ lý khi ba mẹ hỏi. Ước tính **≤ 1 USD/tháng cho cả hai bé** — thấp hơn nhiều so với thiết kế sinh bài lúc chạy, và đạt NFR-09 dư sức.

**Cơ chế kiểm soát vẫn giữ:** `AiConfig.dailyBudgetUsd`; vượt ngân sách → hoãn report/embed, intake vẫn chạy kèm cảnh báo. **Daily Quest không phụ thuộc AI** nên mất mạng hay hết ngân sách con vẫn học bình thường. Cache: TTS theo hash text+voice (sinh sẵn lúc nạp nội dung nếu dùng cloud TTS); prompt caching cho phần system + mô tả kỹ năng.

## 9. Đánh giá chất lượng AI (bắt buộc trong pha AI)

- **Bộ đánh giá offline** `eval/`: 40 ảnh bài vở mẫu có nhãn (docType, số câu, đúng/sai, kỹ năng) → đo độ chính xác trích xuất & gắn kỹ năng; mục tiêu ≥ 85% câu đúng nhãn đúng/sai, ≥ 80% gắn kỹ năng đúng top-1.
- 60 bài sinh mẫu (12 kỹ năng × 5) → checklist tự động: Zod hợp lệ, độ dài đề, có đáp án, không trùng; + phụ huynh chấm tay 20 bài "phù hợp lớp 1?".
- 30 câu ngoài chủ đề cho ASSIST_KID → 100% bị chặn.
- Kết quả eval ghi vào `docs/eval/` mỗi khi đổi prompt version.

## 10. Chẩn đoán đầu vào (Assessment ban đầu)

Khi bé mới bắt đầu (mọi kỹ năng `NOT_STARTED`): hệ thống chạy **3 phiên chẩn đoán** (mỗi môn ~10 bài, adaptive: đúng → nhảy lên kỹ năng sau trong mạch, sai → lùi về tiên quyết) trong 3 ngày đầu, bằng chứng loại `EXERCISE` với `w=0.8`. Kết hợp ảnh vở/bài kiểm tra phụ huynh nạp trong tuần đầu. Sau 7 ngày AI đề xuất `Plan` đầu tiên.

---

## 11. Chẩn đoán lỗi & rèn đúng chỗ (bổ sung 10/09/2026)

> Mục 3–4 trả lời "kỹ năng nào yếu". Mục này trả lời câu hỏi khó hơn và quan trọng hơn: **con sai *vì sao*, và rèn *cách nào* cho hết**. Không có phần này, "thông minh" chỉ dừng ở "cho làm thêm bài cùng loại".

### 11.1 Bộ mã lỗi chuẩn (`content/error-taxonomy.json`)

Mọi chỗ ghi lỗi trong hệ thống (`IntakeItem.errorType`, `Exercise.targetsError`, `choices[].errorTag`, `ErrorStat.errorCode`) **chỉ được dùng mã trong bộ này** — validator chặn mã lạ. Mỗi mã có: `code`, `subject`, `nameVi`, `moTa`, `phatHien` (cách hệ thống nhận ra), `cachRen` (kiểu bài rèn), `sachThamChieu` (bài SGK liên quan).

| Nhóm | Mã | Con làm gì | Cách phát hiện |
|---|---|---|---|
| **Tiếng Việt — âm/chữ** | `nham_b_d` · `nham_p_q` · `nham_s_x` · `nham_ch_tr` · `nham_ng_ngh` · `nham_g_gh` · `nham_c_k_q` · `nham_am_dau_viet` (âm đầu khác, 17/09) | lẫn cặp chữ giống nhau về hình hoặc âm; sai âm đầu mà vần, thanh vẫn đúng | đáp án nhiễu trong MCQ; STT đọc to; ảnh vở |
| **Tiếng Việt — dấu thanh** | `nham_hoi_nga` · `thieu_dau_thanh` · `sai_dau_thanh` · `dat_dau_sai_cho` | đọc/viết sai dấu | STT; ảnh vở; MCQ dấu |
| **Tiếng Việt — đọc** | `doc_bo_tieng` · `doc_nham_van` · `doc_danh_van_cham` · `doc_them_tieng` | bỏ tiếng, sai vần, đánh vần quá lâu | STT so khớp từng tiếng + thời gian |
| **Tiếng Việt — viết** | `viet_nguoc_chu` · `viet_thieu_net` · `viet_sai_do_cao` · `viet_khong_noi_net` | chữ gương, thiếu nét, sai cỡ | ảnh vở (Vision), TRACE |
| **Toán — đếm & số** | `dem_thieu_1` · `dem_thua_1` · `dem_lai_tu_dau` · `nham_thu_tu_so` (13↔31) · `viet_nguoc_so` | đếm lệch 1, không đếm tiếp, đảo hàng | đáp án nhiễu ±1; COUNT_TAP; ảnh vở |
| **Toán — phép tính** | `nham_cong_tru` · `quen_so_0` · `sai_hang_chuc_don_vi` · `khong_hieu_de_loi_van` | làm dấu ngược, cộng với 0 sai, cộng nhầm hàng | nhiễu = kết quả của phép ngược; bài lời văn |
| **Toán — so sánh** | `so_sanh_nguoc` · `nham_dau_lon_be` | chọn ngược < > | MCQ nhiễu ngược |
| **Tiếng Anh — ngữ pháp** | `nham_have_has` · `nham_am_is_are` · `thieu_s_so_nhieu` · `nham_this_that` | chọn sai dạng | nhiễu = dạng còn lại |
| **Tiếng Anh — âm & chữ** | `nham_am_dau` (chỉ tiếng Anh) · `nham_nguyen_am_ngan` (a/e/i/o/u) · `sai_chinh_ta_tu` · `doc_bo_tu_tieng_anh` | phonics, spelling, đọc bỏ từ | LISTEN_CHOOSE; unscramble; STT |
| **Chung — hành vi** | `doan_bua` (trả lời < 2 s) · `bo_trong` · `chua_nghe_het_de` · `met_cuoi_phien` (sai dồn ở 3 bài cuối) | không phải lỗi kiến thức | thời gian, vị trí trong phiên |

Bộ này seed ở pha 1 (~40 mã), mở rộng khi ảnh vở cho thấy lỗi mới; admin thêm mã trong `/admin/skills`.

### 11.2 Đáp án nhiễu có chẩn đoán

Trong `ExerciseSpec`, mỗi phương án sai của `MCQ`/`LISTEN_CHOOSE` có thể mang `errorTag`:

```jsonc
"choices": [
  { "id": "a", "text": "4", "errorTag": "dem_thieu_1" },
  { "id": "b", "text": "5" },                              // đúng
  { "id": "c", "text": "1", "errorTag": "nham_cong_tru" }  // 3 − 2
]
```

Con chọn "4" → hệ thống không chỉ ghi "sai" mà ghi **"đếm thiếu 1"**. Đây là cách rẻ nhất để bài trắc nghiệm trở thành bài chẩn đoán. Rubric soạn bài (`10` §6) bổ sung: **≥ 1 phương án nhiễu phải có `errorTag`** với mọi bài Toán và bài âm/vần Tiếng Việt.

### 11.3 Thống kê lỗi theo bé — `ErrorStat`

Bảng `ErrorStat(studentId, errorCode, count7d, count30d, lastAt, lastEvidenceId)` cập nhật mỗi khi có bằng chứng mang mã lỗi (từ bài luyện, STT, ảnh vở). Đây là thứ planner và dashboard dùng để nói "**Mai Thy hay nhầm b/d — 4 lần trong tuần**", thay vì chỉ "kỹ năng học vần 52/100".

Quy tắc: `count7d ≥ 2` cùng một mã → mã đó là **lỗi đang hoạt động** của bé → kích hoạt thang rèn (§11.4) và đưa vào "3 điều cần chú ý" của ba mẹ.

### 11.4 Thang rèn khi con yếu (remediation ladder)

Khi một kỹ năng vào `NEEDS_PRACTICE` hoặc có lỗi đang hoạt động, planner **không** đơn giản là "thêm bài cùng loại". Nó đi từng bậc, mỗi bậc 1–2 phiên, đạt thì thoát, không đạt thì xuống bậc kế:

| Bậc | Làm gì | Ví dụ với lỗi `nham_b_d` |
|---|---|---|
| 1 · Đổi kênh | Cùng kỹ năng nhưng dùng dạng bài **nhận biết** trước dạng **tái tạo**: nghe-chọn → nhìn-chọn → kéo-thả → rồi mới đọc to / viết | Nghe "bố" → chọn tranh; nhìn chữ *b* → chọn tranh *bố* hay *dê* |
| 2 · Hạ độ khó | Xuống 1 bậc, phạm vi nhỏ hơn, ít phương án hơn (2 thay vì 4) | Chỉ còn 2 lựa chọn b / d |
| 3 · Bài mẫu có dẫn | Mascot **làm mẫu** một bài y hệt (nói to cách nghĩ), rồi con làm bài đổi số/đổi từ. `ExerciseSpec.scaffold = "model"` | Cú: "b có bụng quay sang phải, như chữ bố… còn d bụng quay trái" → con làm |
| 4 · Về tiên quyết | Tiên quyết < 60 → luyện tiên quyết trước, tạm dừng kỹ năng này | Nếu chưa vững "nhận mặt chữ đơn" thì quay về bài 1–4 |
| 5 · Nhắm lỗi đối chiếu | Bài `targetsError` đặt hai thứ dễ nhầm **cạnh nhau** để con phân biệt chủ động | 6 bài liên tiếp chỉ b vs d, có tranh gợi nhớ |
| 6 · Kiểm tra lại | Sau 2 ngày: 3 bài độc lập, không gợi ý. 3/3 → thoát thang, ghi "đã vượt qua"; < 3 → **nhờ ba mẹ**: gợi ý hoạt động 5 phút ngoài màn hình (viết b/d lên cát, tìm chữ trong sách) và ghi vào báo cáo tuần |

Giới hạn để không chán: một kỹ năng đang rèn **không quá 4 bài/phiên**; hai kỹ năng đang rèn cùng lúc tối đa; luôn xen bài con làm được giữa các bài rèn (tỉ lệ đúng trong phiên mục tiêu ≥ 70%).

### 11.4b Theo dõi theo từng tiếng — Xưởng Tiếng *(pha 12, ADR-24, ADR-22 bổ sung)*

Mạch học vần có **hai sổ song song**, không trộn:

- **`LexemeProgress` (`kind = syllable`)** — trí nhớ của bé với **từng tiếng** (707 tiếng trong
  `content/lexicon/viet.json`), cùng thang Leitner 1-3-7-14-30 ngày của từ tiếng Anh (§ pha 11): làm đúng
  → lên một bậc (một tối chỉ lên một bậc), chưa đúng → về bậc 1, gặp lại ngày mai. Tiếng ở **bậc ≥ 3**
  là một viên gạch ở Phố Chữ và hiện trong Sổ tiếng.
- **`SkillMastery` của `VIET.HV.*`** — vẫn cập nhật qua `Evidence` như §3.1: mỗi lần gặp một tiếng trong
  trò chơi là **một** bằng chứng `EXERCISE` cho kỹ năng của tiếng đó (kỹ năng của phần muộn nhất trong
  âm đầu/vần/thanh), với trọng số nhân theo trò: Lắp/Tách 0,6 · Bánh xe 0,5 · Đọc to 0,5 · Cặp 0,4 · Tàu
  0,4. Đúng/sai do máy chủ so **từng mảnh** với tiếng trong DB, không lấy theo thiết bị.

Mỗi tối planner lấy cho một trạm **5 tiếng đến hạn + 3 tiếng mới** (bé mới: tiếng hằng ngày trước; sau
đó kỹ năng của trạm, rồi bài gần nhất lớp đã học). Câu hỏi ôn (`review`), thang rèn và bài cô giao vẫn là
bài trắc nghiệm cũ.

Mã lỗi khi con lắp khác tiếng mẫu — dùng mã trong §11.1 (`nham_am_dau_viet` tách khỏi mã tiếng Anh ngày 17/09), mỗi lần gặp một mã
(khe âm đầu trước, rồi vần, rồi thanh):

| Khe | Mã |
|---|---|
| âm đầu thuộc một cặp dễ lẫn | `nham_b_d`, `nham_ch_tr`, `nham_s_x`, `nham_ng_ngh`, `nham_c_k_q` |
| âm đầu khác | `nham_am_dau_viet` |
| vần | `doc_nham_van` |
| thanh hỏi ↔ ngã | `nham_hoi_nga` |
| bỏ dấu (chọn thanh ngang) | `thieu_dau_thanh` |
| thanh khác | `sai_dau_thanh` |

Trò *Cặp dễ lẫn* ghi mã của cặp đang hỏi; *Tàu chở vần* chỉ ghi tiếng con tìm được (không có lỗi);
*Đọc to* chỉ ghi khi máy hoặc ba mẹ xác nhận con đã đọc.

### 11.5 Nhìn thấy trên dashboard ba mẹ

Thẻ "3 điều cần chú ý" của mỗi bé hiển thị theo mẫu: **lỗi gì · bao nhiêu lần · đang ở bậc mấy của thang rèn · ba mẹ có thể làm gì 5 phút tối nay**. Bấm vào thấy đúng những câu con đã sai (ảnh vở hoặc bài luyện).
