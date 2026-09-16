# ADR-25 — Không giao bài "viết vào vở rồi chụp ảnh" trong phiên học

**Ngày:** 16/09/2026 · **Trạng thái:** đã chốt (chủ dự án)

## Bối cảnh

Dạng bài `WRITE_PHOTO` (docs/04 §5, màn K9 ở docs/06 §1.2) bắt con viết hoặc vẽ ra giấy, rồi gọi
ba mẹ cầm điện thoại chụp; ảnh vào hàng chờ AI để chấm sau (docs/13, `WRITE_PHOTO_GRADE`). Trong
ngân hàng có **797 bài** loại này (7,4% của 10.732 bài), rải ở 254 kỹ năng của cả sáu môn — riêng
Tiếng Việt 326 bài. 14 ngày tính tới 16/09, hai bé gặp 15 bài như vậy trên máy thật.

Chủ dự án, 16/09/2026: *"Bỏ các câu viết rồi chụp ảnh nhé."*

## Quyết định

- **Không phiên nào giao bài `WRITE_PHOTO` nữa**: Daily Quest, trạm trong thành phố, "Chơi thêm",
  thang khắc phục. Chỉ có một chỗ chọn bài cho mọi phiên (`pickExercises` trong
  `packages/db/src/session/plan.ts`); loại trừ nằm ở đó (`EXCLUDED_TYPES`), kể cả khi một bước của
  thang xin đúng dạng ấy theo tên.
- **Ngân hàng giữ nguyên.** Bài không bị xoá, không đổi trạng thái; bật lại chỉ là bỏ một dòng.
- Màn chụp ảnh (`write-photo.tsx`) và đường chấm ảnh trong hàng chờ **vẫn giữ**, cho những phiên đã
  lập trước khi đổi và cho ảnh vở ba mẹ gửi qua cửa `CHAT_INTAKE` (docs/13 §7) — đường đó không
  liên quan tới quyết định này.
- Luật kiểm skill map "kỹ năng viết phải liệt kê `WRITE_PHOTO` hoặc `TRACE`" (docs/05 §6) **giữ
  nguyên**: nó mô tả kỹ năng, không mô tả phiên học.

## Hệ quả

- **Không kỹ năng nào hết bài**: mỗi kỹ năng có bài chụp ảnh vẫn còn ít nhất 12 bài dạng khác
  (đếm trên `content/exercises`, 16/09).
- **Trong app không còn bài tập viết tay nào.** Ngân hàng có 0 bài `TRACE` (tô chữ trên màn hình),
  nên các kỹ năng tập viết (`VIET.VIET.*`, `ENL.W.*`) giờ chỉ luyện bằng bài chạm/chọn (độ cao chữ,
  nét, chữ ngược…). Chữ viết thật của con chỉ còn đến hệ thống qua ảnh vở ba mẹ gửi. Muốn luyện viết
  tay trong app thì phải soạn bài `TRACE`.
- Mastery của kỹ năng viết từ nay chỉ nhận bằng chứng từ các dạng còn lại và từ ảnh vở.
- Test: `packages/db/src/session/no-photo.test.ts` — một kỹ năng tạm có đúng hai bài (một chụp ảnh,
  một trắc nghiệm): chọn mười hai lần luôn ra bài trắc nghiệm; hành vi cũ ra bài chụp ảnh khoảng một
  nửa số lần.
