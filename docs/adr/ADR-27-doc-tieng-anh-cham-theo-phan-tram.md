# ADR-27 — Đọc tiếng Anh chấm theo phần trăm khớp, qua ở 60%, không chờ ba mẹ

**Ngày:** 18/09/2026 · **Trạng thái:** đã chốt (chủ dự án)

## Bối cảnh

`READ_ALOUD` được chấm bằng `matchReadAloud` (docs/04 §7): ghép từng từ con đọc với `readTarget.words`,
ra `accuracy`. Cùng một ngưỡng cho cả hai thứ tiếng: **≥ 0,85 là qua**, **0,5–0,85 chờ người lớn nghe**
(`pending`), dưới 0,5 đọc lại.

Với tiếng Việt, ngưỡng đó đúng: đọc trôi từng tiếng chính là thứ đang luyện, bỏ tiếng là lỗi cần thấy.

Với tiếng Anh thì không. Máy nhận giọng của trình duyệt nghe một bé sáu tuổi người Việt và viết ra
"forteen", "for teen", "grater" — không phải lỗi của con. Hệ quả: rất nhiều lần đọc rơi vào khoảng
0,5–0,85, bài bị treo `pending` chờ ba mẹ bấm xác nhận, con không qua được và không thấy mình tiến bộ
tới đâu.

Chủ dự án, 18/09/2026: *"Các câu phát âm tiếng anh chấm điểm theo % trùng khớp với nội dung chứ không
cần đúng 100%, mỗi lần phát âm sẽ hiển thị nội dung phát âm và % trùng khớp. Không trùng 100% vẫn cho
qua được."*

## Quyết định

- **Ngưỡng qua theo từng thứ tiếng** (`PASS_ACCURACY` trong `packages/core/src/speech/read-aloud.ts`):
  tiếng Việt **0,85** như cũ, tiếng Anh **0,60**.
- **Điểm là phần trăm khớp.** `score` = `accuracy` (vốn đã vậy); bài đọc tiếng Anh dưới ngưỡng vẫn được
  ghi nhận với đúng số điểm ấy thay vì bị treo.
- **Bài đọc tiếng Anh không bao giờ `pending`.** Không còn chờ ba mẹ xác nhận; con đọc, thấy điểm, gửi,
  đi tiếp. Tiếng Việt giữ nguyên đường "vùng xám → ba mẹ" của docs/04 §7.
- **Khớp gần đúng cho tiếng Anh**: hai từ lệch nhau 1 chữ cái (từ ≤ 5 chữ) hoặc 2 chữ cái (từ dài hơn)
  tính là một từ — "grater" ≈ "greater". Bảng cách nhau đủ xa vẫn phân biệt được: four ≠ five,
  fourteen ≠ thirteen, eighteen ≠ eighty. Máy tách một từ thành hai ("four teen") thì ghép lại trước
  khi so.
- **Màn của con hiện sau mỗi lần đọc**: câu máy nghe được, thanh phần trăm và con số (ví dụ 80%), cùng
  một câu động viên. Dưới ngưỡng thì nút vẫn gửi được, ghi rõ phần trăm; không có chữ "sai", không màu
  đỏ. Phần trăm hiện cho cả hai thứ tiếng — chỉ ngưỡng qua là khác nhau.
- Đường "con đọc cho ba mẹ nghe rồi" vẫn còn cho máy không có micro hoặc phòng ồn.

## Hệ quả

- Bằng chứng của bài đọc tiếng Anh giờ vào thẳng mastery với trọng số bằng chính phần trăm khớp; không
  còn hàng chờ ba mẹ cho môn tiếng Anh, nên `/admin/inbox` và dashboard nhẹ đi.
- Một bé đọc đúng 3/5 từ (60%) được tính là qua. Đây là lựa chọn có chủ ý: mục tiêu của dạng bài này là
  dám mở miệng đọc tiếng Anh, không phải phát âm chuẩn như người bản xứ.
- Ngưỡng nằm một chỗ (`PASS_ACCURACY`), đổi lại chỉ sửa một con số.
