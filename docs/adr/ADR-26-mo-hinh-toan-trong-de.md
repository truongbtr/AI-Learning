# ADR-26 — Mô hình toán của sách là hình trong đề; thẻ kéo giống hệt nhau đổi chỗ được

**Ngày:** 17/09/2026 · **Trạng thái:** đề xuất trong pha 13, chờ chủ dự án xác nhận khi QC

## Bối cảnh

MATH NOTES Grade 1 (EDI-MN1, docs/09 §1c) dạy mọi bài bằng mô hình trực quan: ten-frame, thanh chục
và khối rời, chuỗi hạt, tia số có vòng nhảy, sơ đồ number bond, thẻ chấm, bảng số 20. `ExerciseSpec`
(docs/04 §5) chỉ có tranh `emoji | icon | asset | generated`, nên câu "Which ten-frame shows 17?" hay
"How can you show 13?" không vẽ được như sách. Đề pha 13 yêu cầu: chỉ là hình trong đề, không thêm
`ExerciseType`, không migration; bài "vẽ N chấm vào ten-frame" thành kéo đủ N chấm vào khung.

Kéo N chấm lại đụng một giới hạn của cách chấm DRAG_DROP (docs/04 §7): khoá đáp án ghi **id** thẻ.
Mười chấm giống hệt nhau, khoá ghi `c1…c7`; con kéo `c8` vào khung thì bị tính sai dù màn hình không
có cách nào phân biệt `c8` với `c3`.

## Quyết định

1. **`ImageRef.kind = "model"`** kèm trường `model` — dữ liệu của một mô hình
   (`packages/content/src/math-model.ts`: `tenFrame`, `tensOnes`, `numberLine`, `numberBond`,
   `dotCards`, `numberChart`, `counter`). Mỗi mô hình tự kiểm số của nó (chấm không quá số ô, hai
   phần cộng đúng tổng, vòng nhảy không ra ngoài tia số). Dùng được ở mọi chỗ đã nhận `ImageRef`: tranh
   đề, ô đáp án, thẻ kéo, giỏ. Không có `ExerciseType` mới, không migration (spec là JSON).
2. **Vẽ bằng SVG từ dữ liệu** (`apps/web/components/kid/exercise/math-model.tsx`), qua `Picture`, nên
   con, màn xem trước của admin và test dựng HTML thấy cùng một hình. Thẻ đáp án vẽ ten-frame đứng như
   trang sách (2 cột × 5 hàng) để ba đáp án vừa một hàng.
3. **Giỏ là ten-frame**: chấm con kéo vào rơi đúng vào ô, sau các chấm in sẵn; nhãn giỏ có "○"
   (`15 ○ 12`) đặt thẻ vào giữa hai số.
4. **Thẻ trông giống hệt nhau thì đổi chỗ được khi chấm** (`twinsOf`/`resolveTwins` trong
   `packages/core/src/grading/mark.ts`). "Giống hệt" đọc từ chính spec con đã thấy (chữ + hình), nên áp
   cho cả bài cũ mà không cần nạp lại; thẻ thừa vẫn bị tính (đổi thành thẻ nhiễu cùng mặt, mang mã lỗi
   của nó) và thẻ bay về đúng là thẻ con đã kéo. Bài có mọi thẻ khác nhau chấm y như trước.

## Hệ quả

- `content:validate` so trùng đề bằng dữ liệu mô hình, không bằng khoá tên hình.
- Một bài cũ có hai thẻ giống hệt nằm ở hai giỏ khác nhau giờ chấm đúng dù con đổi chỗ hai thẻ đó —
  đúng với những gì con nhìn thấy.
- Chữ trong mô hình giữ ≥ 22 px ở cỡ khung đề (test dựng HTML), không dùng màu đỏ.
