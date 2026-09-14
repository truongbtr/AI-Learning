# ADR-19 — Đợt 3: dạng bài bắt buộc, phạm vi chữ và chữ p

Ngày: 14/09/2026 · Pha 6b · Trạng thái: **đề xuất, đã áp dụng cho nội dung** (chờ chủ dự án gật)

## Bối cảnh

Đề bài pha 6b yêu cầu mỗi kỹ năng mới "đủ 6 dạng và 5 mức khó" và "không dùng chữ/vần/dấu chưa học
tính tới `lessonRef`". Khi soạn 129 kỹ năng, ba chỗ va nhau:

1. **COUNT_TAP ở kỹ năng không đo đếm.** COUNT_TAP chấm "con chạm đủ số vật trên màn hình". Ở kỹ năng
   ngữ pháp (is/are), ngữ âm (CVC, âm tiết), đọc hiểu, khoa học, bài đếm đo **kỹ năng đếm**, không đo
   kỹ năng của gói — đợt 2 đã có bằng chứng (`viet-bd-0049`, gói b/d: con đếm đúng số tranh nhưng
   bằng chứng lại ghi vào "phân biệt b/d") và đã bỏ COUNT_TAP khỏi 16 kỹ năng ngữ âm.
2. **`lessonRef` quá hẹp để có câu hỏi thật.** `VIET.HV.NHAM_LAN_DAU_HOI_NGA` ghi bài 6, 9 (lúc đó lớp
   mới biết 11 chữ, không đủ cặp tiếng thật chỉ khác dấu hỏi/ngã); `VIET.NN.NOI_THEO_TRANH` ghi bài 1
   (không in được một câu nào); `VIET.NN.KE_LAI` ghi bài 5–20 (truyện của bài 30–40 dùng vần sau đó).
3. **Chữ p.** Bảng `tieng-viet-progression.ts` ghi bài 26 dạy `ph`, `qu`. SGK tr.64 in "p – ph". Không
   có "p" trong bảng thì mọi tiếng vần ap/op/ep/ip/up (bài 53–56) bị validator chặn — không kỹ năng nào
   trong ba kỹ năng đó soạn được.

## Quyết định

1. **"Đủ 6 dạng" hiểu là đủ các dạng đo được kỹ năng đó.** 26/130 gói có đủ 6 dạng (những gói mà đếm
   là một phần kỹ năng: Toán, số lượng, "how many", hình). 103 gói thiếu đúng COUNT_TAP, 1 gói (viết
   chữ số) thiếu COUNT_TAP và READ_ALOUD. Bỏ COUNT_TAP khỏi bản đồ kỹ năng của 3 kỹ năng ENL
   (PRINT_CONCEPTS, SYLLABLES, SEGMENT_PHONEMES) — cùng lý do với 16 kỹ năng đợt 2. Mọi gói vẫn ≥ 4 trong
   6 dạng (luật của validator) và đủ 5 mức khó.
2. **Mở `lessonRef` trong `content/skill-map/viet.json`** cho ba kỹ năng trên (hỏi/ngã tới bài 19,
   nói theo tranh tới bài 31, kể lại tới bài 40), ghi rõ trong `note` từng gói. Không đổi `expectedWeek`.
3. **Thêm "p" vào bài 26** trong `packages/content/src/tieng-viet-progression.ts`, có test. Đây là bảng
   dữ liệu của validator nội dung; web và worker không dùng bảng này nên không cần dựng lại image.

## Hệ quả

- Validator vẫn chặn đúng những gì nó chặn trước đây, trừ tiếng có p cuối từ bài 26 trở đi.
- Ba kỹ năng mở `lessonRef` in chữ đi trước lớp vài tuần (lớp đang ở bài 14–19): con có thể gặp tiếng
  chưa học ở ba kỹ năng này. Nếu chủ dự án muốn giữ chặt, cách lùi là đặt `isActive=false` cho ba kỹ
  năng đó tới khi lớp học tới bài tương ứng.
- Bản đồ kỹ năng trong DB chỉ đồng bộ `exerciseTypes` và biên độ khó (`sync-skill-types`), không đồng bộ
  `lessonRef` — lần seed tới (khi dựng lại image) mới mang `lessonRef` mới vào DB.
