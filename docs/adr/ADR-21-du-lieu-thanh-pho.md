# ADR-21 — Nối dữ liệu học vào thành phố

Ngày: 15/09/2026 · Pha 10 việc 3 · Trạng thái: **áp dụng**

## Bối cảnh

Pha 10 §3 nêu cách dữ liệu đã có biến thành thành phố, và yêu cầu "không thêm bảng mới nếu tránh được".
Khi đọc mã và schema thì có năm chỗ đề bài không khớp thẳng với dữ liệu hiện có:

1. **"MASTERED và giữ ≥ 30 ngày"**: `SkillMastery` không lưu lúc nào kỹ năng đạt MASTERED;
   `MasteryHistory` chỉ lưu con số, không lưu trạng thái.
2. **"Ô đất tốn N sao"** trái với quyết định 4 của pha (không tiền tệ, không mua bán). Hơn nữa sao
   được tính chung cho cả bé, không theo môn.
3. **Thứ tự lô**: nếu suy từ ngày có bằng chứng đầu tiên thì một ảnh vở cũ nạp muộn (ngày quan sát lùi về
   trước) sẽ chen vào giữa, đẩy các công trình khác đi chỗ khác. Lựa chọn xây của con cũng phải lưu ở
   đâu đó.
4. **"ErrorStat cao"**: ErrorStat tính theo mã lỗi, không theo kỹ năng.
5. **Chạm giàn giáo → phiên TARGETED**: `POST /api/sessions/targeted` cố ý chặn CHILD, với lý do "trẻ
   không được tự chọn kỹ năng dễ nhất để luyện".

## Quyết định

1. **Thêm cột `SkillMastery.masteredSince`** (không phải bảng). Cột được đặt khi trạng thái chuyển
   sang MASTERED, giữ nguyên khi vẫn MASTERED, xoá khi rời MASTERED, ở cả 4 chỗ ghi mastery (cập nhật
   theo bằng chứng, suy giảm, và hai nhánh tính lại khi hoàn tác lô). Mốc tính là **thời điểm ghi**,
   không phải ngày quan sát, để ảnh vở cũ không "tặng" toà chọc trời sớm. Migration điền sẵn cho các
   dòng đang MASTERED từ `MasteryHistory`; không có lịch sử thì lấy `updatedAt`.
2. **Đất mở theo sao ĐÃ KIẾM, không trừ sao.** Mỗi môn có tổng sao riêng:
   - sao của một bài tính cho môn của bài đó;
   - +3 cuối phiên tính cho môn chiếm nhiều trạm nhất trong phiên;
   - sao của một lượt bài cô giao tính cho môn của bài đó;
   - sao giải lao và lời khen của ba mẹ không thuộc thành phố nào;
   - chỉ cộng các dòng dương.

   Ô thứ k cần 20 + 5k sao, tính từ ngưỡng của ô trước (20, 25, 30 …). Đất đã mở thì mở mãi. Cửa hàng
   đồ sưu tầm hiện vẫn trừ sao; khi chạy ở chế độ thành phố (việc 4, cờ `KID_UI=city`) cửa hàng sẽ bị ẩn.
3. **Thêm một bảng `StudentCity`** (bé × môn). Bảng chỉ giữ ba thứ không tính lại được một cách ổn định:
   - `skillOrder`: thứ tự lô, chỉ nối thêm;
   - `plotBuilds`: lựa chọn xây của con;
   - `seen`: ảnh chụp thành phố lần cuối con xem, để mỗi màn ăn mừng chỉ chạy một lần.

   Không dùng `Student.settings` vì ba mẹ sửa JSON đó qua trang cài đặt, dễ ghi đè mất. Không dùng
   `Setting` vì đó là cấu hình vận hành chung, không phải dữ liệu của con. Mọi thứ khác (mức nhà, đất,
   công trình công cộng, mảnh kỳ quan, mức nhộn nhịp, vật trang trí, thú cưng, đơn toà thị chính) đều
   **tính lại mỗi lần đọc** từ dữ liệu học.
4. **"Cần giúp" (giàn giáo và thợ)** khi thoả một trong ba điều:
   - số lỗi 7 ngày cao nhất trong các mã lỗi có kỹ năng đó trong `remediationSkills` đạt ≥ 2 (cùng
     ngưỡng `ACTIVE_ERROR_COUNT_7D` của thang khắc phục);
   - kỹ năng đang có thang khắc phục ACTIVE;
   - trạng thái NEEDS_PRACTICE.
5. **Cửa riêng cho con: `POST /api/kid/city/practice`.** Route cũ vẫn chặn CHILD. Cửa mới không nhận
   tên kỹ năng tự do: máy chủ tự tính lại thành phố và chỉ mở phiên cho **công trình mà chính thành phố
   đang hiện là chưa vững** (mức 0 hoặc cần giúp). Mỗi kỹ năng chỉ một phiên mỗi ngày, chạm lại thì mở lại
   phiên cũ. Nhờ vậy con không tự chọn được kỹ năng dễ, đúng tinh thần của route cũ.
6. **Các quy tắc còn lại** (`packages/core/src/city/rules.ts`, có test):
   - **Mức công trình**: 0–39 / 40–59 / 60–84 / 85+; MASTERED từ 30 ngày trở lên thì là toà chọc trời.
   - **Huy hiệu**: mỗi huy hiệu đã đạt thêm một công trình công cộng, theo thứ tự riêng từng thành phố
     (đủ 15 loại). Công trình đầu tiên hợp với thành phố: Bến Cảng Từ có thuỷ cung, Vườn Sách có thư viện.
   - **Kỳ quan**: tuần có ≥ 4 ngày học (phiên COMPLETED, tính mọi môn) thêm 1 mảnh, **tính ngay khi đạt
     ngày thứ tư**, không reset. Quy tắc này độc lập với tranh ghép 6 mảnh cũ (`WeeklyPicture`, mỗi ngày
     một mảnh); thế giới cũ vẫn dùng tranh ghép.
   - **Nhộn nhịp**: `Streak.current` là số ngày đã học và không bao giờ giảm. 1, 3, 7, 14 ngày ứng với
     mức 1–4.
   - **Vật trang trí, thú cưng**: bảng ánh xạ mã đồ sưu tầm → vật trang trí, mã thú cưng → con vật mà
     engine vẽ được. Test hợp đồng ở `packages/city` bảo đảm mọi mã đều vẽ được.
   - **Đơn toà thị chính**: bài cô giao của môn đó còn mở → `open`; đã xong hết trong hôm nay → `done`
     (phố sáng đèn); không có bài → `none`.
   - **Nhãn biển nhà**: chữ/âm của bài Tiếng Việt, dấu phép tính hoặc số của Toán, từ tiếng Anh ngắn cho
     ba môn tiếng Anh.
   - **Ăn mừng**: chỉ báo thay đổi đi lên (nhà mới, lên mức, mở đất, công trình công cộng, mảnh kỳ quan,
     vật trang trí). Mastery giảm không bao giờ thành một "sự kiện".
   - **Hoàn tác lô bằng chứng**: kỹ năng mất hết bằng chứng vẫn giữ lô, hiện giàn giáo; không có gì biến mất.

## Hệ quả

- Migration `20260915114558_phase10_city` phải chạy trên máy chủ Ubuntu khi triển khai
  (`pnpm db:deploy`). Migration đã **gỡ dòng xoá chỉ mục** `Skill_searchVector_idx` mà Prisma tự đề xuất.
- `kidHome` giờ chỉ đọc phiên `DAILY_QUEST` của hôm nay. Trước đây nếu một phiên TARGETED tạo trong
  ngày thì nó sẽ bị coi là "nhiệm vụ hôm nay".
- `StudentCity` nằm trong công cụ xoá dữ liệu học và trong file xuất dữ liệu một bé.
- Mỗi lần đọc thành phố tốn khoảng 12 truy vấn; bản đồ thế giới đọc chung phần dùng chung một lần rồi tính
  6 thành phố. Nếu sau này chậm thì cache theo `(bé, ngày, updatedAt lớn nhất)`.
- Còn mở cho việc 4: khi ẩn cửa hàng, con nhận vật trang trí bằng cách nào. Đề xuất: mỗi ô đất mở tặng
  một vật trang trí, cộng quà trong thư của ba mẹ như hiện nay.
