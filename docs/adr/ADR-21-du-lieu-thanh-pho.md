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

   *Pha 10b:* tối đa `MAX_SCAFFOLDS = 3` công trình hiện giàn giáo cùng lúc (lỗi nhiều nhất trước,
   rồi thang khắc phục, rồi mastery thấp). Mức 0 không cần giúp vẽ thành "mầm nhà".
5. ~~**Cửa riêng cho con: `POST /api/kid/city/practice`.**~~ *(bỏ ngày 15/09 — xem "Bổ sung" bên dưới)* Route cũ vẫn chặn CHILD. Cửa mới không nhận
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

## Bổ sung 15/09/2026 — cách chơi trong thành phố (chủ dự án: "giờ làm cho nó CHƠI được")

1. **Trạm thay cho bong bóng.** Trong thành phố chỉ có **3–4 ngôi sao**. Phiên của thành phố (12 bài của
   môn, cùng planner với Daily Quest, `planCitySession`) được gom theo kỹ năng thành trạm bằng hàm thuần
   `planStations` (`packages/core/src/city/stations.ts`, có test): số trạm = 12/3 làm tròn, tối đa 4;
   nhóm kỹ năng lớn nhất làm trạm, nhóm nhỏ nhập vào trạm ít bài nhất; một kỹ năng quá nhiều bài thì tách
   làm hai trạm cùng công trình. Bài cô giao không thành trạm mà nằm ở toà thị chính. `CityView.skills[].mission`
   giờ nghĩa là "còn trạm chưa xong ở công trình này". Kỹ năng của trạm mà con chưa từng làm vẫn có công
   trình (giàn giáo) ngay tối đó.
   - **Vì sao không lấy nguyên 12 bài của Daily Quest**: Daily Quest trộn môn (hôm 15/09 của Mai Thy: 5
     ESL + 5 ENL), nên một thành phố chỉ còn 0–2 sao, không thành "4 trạm → mở đất". Thành phố dùng phiên
     riêng của môn đó nhưng **cùng thuật toán planner**; bản đồ thế giới lấy các môn của Daily Quest tối
     nay (cộng bài cô giao, cộng thành phố đang làm dở) để quyết đảo nào lấp lánh.
2. **Bỏ cửa `POST /api/kid/city/practice`** và hàm `startCityPractice`. Luật mới: mọi công trình không có
   sao **không bấm được** (chạm chỉ hiện tên kỹ năng + mức, đọc to). Giàn giáo và thợ vẫn hiện để con
   thấy chỗ đang xây; kỹ năng yếu vẫn vào phiên qua planner (thang khắc phục, sàn ôn 30%).
3. **Bậc trong mức** (`stepFor`): mỗi phần ba của dải mastery thêm một tầng (engine kéo cao công trình
   14%/bậc, không thêm tam giác). Nhờ vậy xong một trạm thường thấy nhà cao lên dù chưa sang mức. Ngay
   sau trạm, màn hình không cho công trình vừa làm hiện nhỏ đi.
4. **Chơi thêm**: `POST /api/kid/city/again` → `planCitySession(..., { again: true })` lập phiên mới cùng
   môn khi phiên hôm nay đã xong; còn phiên đang mở thì trả lại phiên đó.
5. **Thành phố bắt đầu nhỏ**: `MIN_BLOCKS` 6 → 2, ô đất khoá hiện trước 2 → 1. Quy tắc "vai trò lô chỉ
   phụ thuộc số thứ tự khối" giữ nguyên nên không công trình nào đổi chỗ khi thành phố lớn.
6. **Màu theo lô** (`lotPalette`): bảng của từng công trình = mái/tường của thành phố + hai màu đặc trưng +
   bảng chung, xoay theo lô (5 màu mái, 7 màu tường) → khu phố ≥ 3 màu mái, ≥ 4 màu tường (test).
7. **Nghỉ vận động 30 giây bị bỏ** ở cả hai thế giới (chủ dự án, 15/09). Component `MovementBreak` và
   `POST /api/kid/break` đã xoá; sao nghỉ vận động cũ trong sổ sao vẫn giữ nguyên.

Hệ quả thêm: migration dữ liệu `20260915200000_rename_kid_nicknames` đổi tên gọi "Thy" → "Mai Thy",
"Thanh" → "Chí Thanh" (theo yêu cầu chủ dự án), có điều kiện theo giá trị cũ nên chạy lại không đổi gì.

## Bổ sung 16/09/2026 — đồng hồ game

"Đồng hồ thật → ngày/đêm" (§3 của đề pha 10) đổi thành **đồng hồ game** (chủ dự án). Hai bé học 18–21
giờ nên theo giờ thật thì thành phố luôn tối.

Bản đầu (15/09) chạy 15 phút thật = 1 ngày game, lấy mốc từ đồng hồ máy. QC 16/09 cho thấy vẫn chưa
tới đích: chia đều 24 giờ vào 15 phút thì **6 phút mỗi ngày game là đêm** — một buổi học 12 phút vẫn
tối gần bốn phần mười thời gian, lại tối ngay giữa lúc con đang làm bài, và con mở màn vào đúng lúc nào
là hên xui.

Bản hiện tại (16/09, pha 11):

- **24 phút thật = 1 ngày game**, `GAME_DAY_MS` trong `packages/city/src/engine/daynight.ts`;
- **mốc neo là `Session.startedAt`** (`dayAnchorMs` của engine): con ngồi xuống thì thành phố ở
  `DAY_START_HOUR = 8` giờ sáng. Vẫn ổn định qua tải lại và giống nhau ở mọi màn vì mốc lấy từ DB, không
  phải từ lúc mở màn;
- **nhịp không đều theo giờ** (bảng `PHASES`): 55% ngày game là ban ngày, 20% chiều vàng, 10% hoàng hôn,
  ~13% đêm + bình minh. Một buổi 12–15 phút đi từ sáng tới chiều vàng; ai chơi hết một ngày game thì thấy
  khoảng hai phút rưỡi trời tối. Bảng ánh sáng `lightingAt(hour)` không đổi.

Engine vẫn nhận `hour` cố định cho bench/ảnh chụp và `dayLengthMs` nếu cần đổi nhịp. Đề xuất "nâng ánh
sáng môi trường buổi tối" (pha 10b việc 2) **không làm nữa**: nguyên nhân là nhịp ngày/đêm, không phải
bảng màu.
