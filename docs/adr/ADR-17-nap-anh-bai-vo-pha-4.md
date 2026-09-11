# ADR-17 — Nạp ảnh bài vở & nhật ký lớp: năm chỗ lệch tài liệu ở pha 4

- **Ngày:** 12/09/2026 (cuối pha 4)
- **Trạng thái:** đã làm, chờ chủ dự án đọc
- **Liên quan:** ADR-9 (nội dung soạn ngoại tuyến), **ADR-10** (app không gọi LLM), ADR-16 (sao/trứng)

Pha 4 nối ảnh bài vở với bảng năng lực của con. Năm chỗ dưới đây khác tài liệu; chỗ nào cũng do
ADR-10 kéo theo, hoặc do tài liệu viết trước khi có ADR-10.

---

## 1. "5 ảnh vở → ≤ 90 giây **có kết quả**" nghĩa là gì sau ADR-10

`docs/08` pha 4 tiêu chí 3 viết khi app còn được phép gọi Vision lúc chạy. ADR-10 bỏ điều đó, và
`13` §3b đã **nói thẳng cái giá phải trả**: "kết quả đọc ảnh vở trễ 1–3 ngày thay vì 90 giây".

Hai câu này không thể cùng đúng. Cách đọc đã chọn: **90 giây là thời gian app phải làm xong phần
việc của máy** — nhận ảnh, lưu ảnh gốc, xoay, nén, tăng tương phản, tách trang, băm chống trùng, và
xuất `context.json` sẵn sàng cho người đọc. Phần "đọc hiểu" nằm ngoài đồng hồ đó vì nó nằm ngoài app.

Đo thật trên máy này (e2e pha 4): **12 giây** cho 5 ảnh, trong đó tiền xử lý 450 ms.

Nếu chủ dự án muốn đúng 90 giây kể cả phần đọc thì chỉ còn cách bật worker AI của `13` §6 — một
quyết định về tiền và về dữ liệu của con, không phải quyết định kỹ thuật, nên tôi không tự làm.

## 2. FR-INT-04: "AI gắn kỹ năng" → tìm kiếm gợi ý, ba mẹ chạm một cái

FR-INT-04 nói ghi chú nhanh của ba mẹ được "AI gắn kỹ năng". App không có AI (ADR-10). Thay bằng:
full-text `searchSkills` của pha 1 gợi ý tối đa 6 kỹ năng, ba mẹ chạm chọn, rồi mới lưu thành
`Evidence(PARENT_NOTE, w=0.5)`.

Vẫn đạt "≤ 30 giây" của AC, và được thêm một thứ bản AI không có: **ba mẹ nhìn thấy câu mình vừa gõ
sẽ làm kỹ năng nào động đậy** trước khi nó động đậy.

## 3. Bài cô giao là một loại trạm mới trong phiên học

`04` §4 và `PickedSlot` của pha 3 giả định mọi trạm đều là một `Exercise` trong ngân hàng.
"Bài cô giao" (FR-LRN-07) không phải: nó là *việc của cô*, không có đáp án, không chấm đúng sai.

Thêm `PickedSlot.homework` và `KidItem.homework`; trạm loại này đứng **trước** mọi trạm luyện, không
bao giờ là trạm "chọn 1 trong 2", và "xong" được đọc từ bảng `Homework` chứ không từ một `Attempt`.
Mỗi lượt đọc là **một sao** (`docs/11` §6.2) — hợp với ADR-16 vì mỗi lượt là một việc con thật sự làm.

Chỉ hai loại việc lên bản đồ: `READ_ALOUD` (đếm lượt) và `VIDEO_SUBMIT` (quay rồi lưu file cho ba mẹ
nộp Teams). Phiếu giấy, mang đồ… ở lại dạng checklist của ba mẹ: đưa lên bản đồ thì con sẽ thấy một
trạm mình không thể hoàn thành trong app.

## 4. `weightFactor` — cách `07` §2.2 vào được mô hình mastery

`07` §2.2 yêu cầu bằng chứng từ ô trống tính **weight × 0,3** (chưa làm xong) hoặc **× 0,6** (chưa
biết làm). `04` §3.1 chỉ có bảng trọng số theo *nguồn*, không có chỗ cho hệ số một lần.

Thêm `MasteryEvidence.weightFactor` (0–1, mặc định 1) vào hàm thuần `updateMastery` và vào
`commitEvidence`. Không nguồn nào đổi trọng số mặc định; chỉ ô trống dùng hệ số này. Nhờ vậy một
trang con làm dở **được ghi lại** (ba mẹ nhìn thấy) mà gần như **không kéo mastery**.

## 5. Ảnh Raz-Kids **đặt** mastery, không nhích

`05` §5 cho bảng: cấp đạt = 70, cấp dưới liền kề = 85, dưới nữa = 95, trên liền kề = 30. Đó là
những con số **đặt thẳng**, không phải kết quả của công thức Bayes-lite ở `04` §3.1.

Vì vậy ảnh màn hình Kids A-Z ghi `Evidence(source=PARENT_OVERRIDE)` — nguồn duy nhất `04` §3.1 cho
phép đặt giá trị — cho từng cấp `ENL.RF.FLUENCY_LEVEL_*`, kèm `ExternalProgress` giữ nguyên con số
gốc. Ghi chú trên bằng chứng nói rõ "Kids A-Z: con đang đọc ở mức D" nên ba mẹ bấm vào là thấy vì
sao mastery nhảy.

## Hai lỗi cũ sửa luôn trong pha này

- **`INBOX_ROOT` giải theo thư mục chạy lệnh.** Các lệnh `inbox:*` chạy từ `packages/inbox`, nên
  `./inbox` thành `packages/inbox/inbox/` — không phải chỗ `CLAUDE.md` bảo nhìn, cũng không nằm trong
  `.gitignore` (`/inbox/`). Nay đường dẫn tương đối luôn giải theo **gốc repo**. Cùng cách cho
  `content:import-intake` và `eval:intake`.
- **`weeklyEvent()` / `pictureForWeek()` trả `undefined`** với mọi ngày trước tuần mốc 07/09/2026
  (JS giữ dấu âm khi chia lấy dư). Một phiên có ngày lùi lại làm hỏng cả bước trao huy hiệu. Đã sửa
  trong ADR-16 kèm test.

## Hệ quả

- `docs/08` pha 4 tiêu chí 3 nên đọc theo mục 1 ở trên.
- Ai bật worker AI của `13` §6 sau này: `context.json`/`result.json` không đổi một dòng — đó chính là
  điều kiện thiết kế của `13` §6, và pha 4 đã đi qua nó bằng đúng bộ lệnh đó.
