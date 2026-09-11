# ADR-14 — Bốn bổ sung vào hợp đồng bài luyện khi hiện thực hoá pha 2

- **Trạng thái:** ĐÃ ÁP DỤNG 11/09/2026 (pha 2)
- **Liên quan:** `docs/04` §5 (`ExerciseSpec`), §11.2 (nhiễu có chẩn đoán); `docs/10` §4.2 và §6 (rubric); `docs/08` pha 2.

## Bối cảnh

`docs/04` §5 chốt hình dạng `ExerciseSpec`. Khi soạn 1236 bài thật và tự chấm 20 bài theo rubric `docs/10` §6, bốn chỗ trong hợp đồng đó **không đủ để viết bài đúng**. Sửa ở tầng dữ liệu (thay vì dặn nhau nhớ) vì đây là những lỗi mà pha 3 rất dễ mắc lại.

## Quyết định

### 1. `answerKey` trong DB là một **gói**, không phải giá trị trần

`docs/04` §5 ghi `answerKey: unknown`. Cột `Exercise.answerKey` lưu:

```jsonc
{ "value": "b",                                   // đáp án đúng, đúng theo từng `type`
  "errorTags": { "a": "dem_thieu_1", "c": "nham_cong_tru" },  // chẩn đoán từng phương án sai
  "correctCount": 6 }                             // chỉ với COUNT_TAP
```

**Vì sao:** `choices[].errorTag` và `countTarget.correctCount` **không được** gửi ra máy của con — cái đầu làm lộ chẩn đoán, cái sau làm lộ đáp án. `toExerciseSpec()` cắt cả hai khỏi `spec`; chúng phải nằm ở một chỗ chỉ máy chủ đọc, và `answerKey` là chỗ đó. Pha 3 chấm bài đọc `answerKey.value`, rồi tra `answerKey.errorTags[<phương án con chọn>]` để ghi `Evidence.errorCode`.

### 2. `listenTarget` — tiếng được đọc, **không bao giờ in ra**

Bài `LISTEN_CHOOSE` ban đầu viết đề là *"Nghe rồi chọn tiếng: chè"*. Bé **biết đọc** chỉ cần nhìn đề là chọn đúng, không cần nghe — bài đo sai kỹ năng (rubric 4). Thêm vào `ExerciseSpec`:

```ts
listenTarget?: { text: string; audioKey?: string }
```

Đề (`prompt.text`) chỉ còn câu hướng dẫn trung tính; tiếng phải nghe nằm ở `listenTarget`. **Hợp đồng với mọi bộ render (kể cả pha 3): phát `listenTarget`, tuyệt đối không hiển thị.** Validator chặn mọi bài mà `prompt.text` in lại đúng tiếng đó, và `content:import` sinh mp3 cho `listenTarget` như cho đề bài.

### 3. `ImageRef.repeat` — vẽ hình mấy lần

Câu "Trong tranh có mấy bông hoa?" **không render được** nếu `ImageRef` không nói vẽ bao nhiêu bông (rubric 10). Thêm `repeat?: number` (1–20). Với `COUNT_TAP` thì số lượng đã nằm trong `countTarget.correctCount` (chỉ máy chủ biết) nên `repeat` không dùng ở đó.

### 4. Mức khó và dạng bài của kỹ năng đợt 1 được mở rộng trong `content/skill-map/`

Pha 1 đặt `difficultyRange` và `exerciseTypes` **trước khi có bài nào**, nên khá hẹp (ví dụ `VIET.HV.AM_A` chỉ 1–3 và không có `DRAG_DROP`). Tiêu chí pha 2 đòi **đủ 5 mức khó** và đủ dạng bài pha 3. Đã mở rộng **đúng 28 kỹ năng của đợt 1** cho khớp với bài đã soạn thật (`difficultyRange` → `[1,5]`, thêm các dạng thực sự có bài). Không đụng 331 kỹ năng còn lại.

**Validator giữ hai phía khớp nhau:** một bài dùng dạng mà kỹ năng không khai báo → lỗi; mọi dạng pha 3 mà kỹ năng khai báo đều phải có bài.

## Hệ quả

- Pha 3 khi dựng `components/kid/*` phải: đọc `answerKey` **chỉ ở server**, phát chứ không in `listenTarget`, và vẽ `ImageRef.repeat` lần.
- `docs/04` §5 đã cập nhật cho khớp ba trường mới.
- Nếu sau này muốn chẩn đoán cả thao tác kéo-thả thì cần thêm `dragItems[].errorTag` — **chưa làm ở pha 2**, ghi trong `content/_reports/dot-1.md` §5 mục 1.

## Hai chỗ lệch tài liệu, không cần ADR riêng

- **Lệnh `content:import` / `content:stats` / `content:export` đặt trong `packages/db`**, không phải `packages/content` như `docs/10` §10 phác thảo. Lý do kỹ thuật: `packages/db` đã phụ thuộc `@mtct/content`; cho chiều ngược lại sẽ tạo **vòng phụ thuộc** khiến Turborepo từ chối chạy (`Cyclic dependency detected`). `packages/content` giữ schema, loader và validator; mọi lời gọi Prisma ở `packages/db`. Lệnh `pnpm content:*` mà người dùng gõ **không đổi**.
- **Quy đổi trang PDF của SGK:** `docs/09` §1 ghi "trang PDF = trang sách + 1". Hai file trong `sach giao khoa/` thực tế lệch **+3** (hai ảnh bìa lặp ở đầu). `sourceRef` của mọi bài ghi **số trang sách**, nên không ảnh hưởng nội dung; đã ghi lại trong `content/_reports/dot-1.md` §5 mục 4.
