# ADR-18 — Bảng điều khiển ba mẹ: bốn chỗ lệch tài liệu ở pha 5

- **Ngày:** 12/09/2026 (cuối pha 5)
- **Trạng thái:** đã làm · **mục 1 bị chủ dự án đảo ngược 12/09/2026** (đầu pha 8) — xem "Cập nhật"
  ở cuối mục 1; mục 2, 3, 4 giữ nguyên
- **Liên quan:** ADR-10 (app không gọi LLM), ADR-13 (mô hình mastery), ADR-17 (bài cô giao là một
  loại trạm mới)

---

## 1. Kế hoạch đã duyệt được phép lấn phần "ôn" và "mới" của `04` §4 bước 3

`docs/04` §4 bước 3 chốt tỉ lệ **50% trọng tâm · 30% ôn · 20% mới**. `docs/08` pha 5 tiêu chí 3
chốt một điều khác: **duyệt một kế hoạch thì phiên hôm sau có ≥ 50% bài thuộc kế hoạch đó**.

Hai câu này xung đột trong đúng trường hợp đáng lo nhất: một tuần dồn nhiều bài đến hạn ôn sẽ đẩy
kế hoạch ra khỏi chính hai tuần của nó. Ba mẹ duyệt một thứ rồi không thấy gì đổi thì sẽ không bao
giờ duyệt cái thứ hai — và màn P9 trở thành đồ trang trí.

**Đã chọn:** khi có kế hoạch đã duyệt, planner **đảm bảo con số của tiêu chí 3**, lấy bù từ những
trạm ít mất mát nhất theo đúng thứ tự này:

1. trạm "luyện thêm cho đủ phiên" (chỉ tồn tại để lấp chỗ),
2. trạm "mới",
3. trạm "ôn".

Và **không bao giờ** lấy từ: bài cô giao, bài khởi động, bài kết thúc, thang rèn, hay bất cứ kỹ
năng nào lớp vừa học trong 3 ngày (`11` §6.1). Bốn thứ đầu là cấu trúc của một phiên tử tế cho trẻ
6 tuổi; thứ năm là lớp học, và một kế hoạch viết hôm chủ nhật không thể biết thứ tư lớp học gì.

Hệ quả phải nói thẳng: **trong tuần có kế hoạch, phần "ôn" có thể tụt dưới 30%.** Spaced repetition
bị hoãn vài ngày. Đổi lại, hai tuần ba mẹ đã đọc và đồng ý được thực hiện đúng như đã hứa. Nếu chủ
dự án thấy phần ôn quan trọng hơn, sửa một hằng số (`target` trong `planSession`) là xong.

### Cập nhật 12/09/2026 (đầu pha 8) — chủ dự án chọn giữ nhịp ôn

Chủ dự án đọc đoạn trên và **chọn phương án còn lại**: phần ôn quan trọng hơn con số của tiêu chí 3.

Lý do của anh ấy, viết lại cho đúng: **phần "ôn" chính là cơ chế lặp lại ngắt quãng, thứ quyết định
con có nhớ sau hai tháng hay không.** Một kế hoạch hai tuần trả lại kết quả thấy được ngay tối nay;
nhịp ôn trả lại kết quả vào tháng 11, lúc không ai còn nhìn. Thứ không ai nhìn là thứ dễ bị ăn mất,
nên nó phải được bảo vệ bằng luật chứ không bằng trí nhớ. Và pha 8 là hai tuần **chạy thật với trẻ
thật** — không phải lúc để hoãn spaced repetition lấy một con số nghiệm thu.

**Đã đổi, ba thứ:**

1. `PLAN_SHARE = 0.4` (trước là một nửa). Kế hoạch đã duyệt được **≥ 40%** tổng số bài con nhận
   được, vẫn tính cả bài cô giao trong mẫu số (mục 2 dưới giữ nguyên).
2. Sàn ôn cứng: `reviewFloor` = đúng 30% của `04` §4 bước 3, tính trên cùng phần phiên. Vòng lấn
   chỗ **bỏ qua** một trạm ôn khi số trạm ôn đã chạm sàn. Thứ tự lấy bù không đổi (trạm lấp chỗ →
   trạm mới → trạm ôn), chỉ là trạm ôn nay có đáy.
3. Nếu vì sàn ôn mà kế hoạch không đạt 40%, planner **không phá sàn** — nó ghi vào
   `generationLog.log`: `kế hoạch tuần đã duyệt: … chiếm x/y bài (dưới 40% vì giữ nhịp ôn)` và
   `giữ n/y bài ôn (sàn m)`. Ba mẹ đọc được lý do ngay trên trang phiên học, không phải đoán.

Tiêu chí 3 của `docs/08` pha 5 hạ theo: **≥ 40%**. Đo lại trên dữ liệu thật lúc đầu pha 8, không
phải trên dữ liệu e2e — dữ liệu e2e đã bị xoá (việc 0.3).

Test canh giữ: `packages/core/src/planner/plan-session.test.ts` → *"never takes the review share to
pay for the plan"*, dựng đúng ca ADR này lo: một tuần dồn 4 kỹ năng quá hạn ôn.

## 2. "Nửa phiên" tính cả bài cô giao, và kế hoạch ít kỹ năng thì quay vòng

Hai chi tiết của mục 1, đều tìm ra khi chạy bộ nghiệm thu chứ không phải khi đọc tài liệu:

- **Bài cô giao nằm trong mẫu số.** ADR-17 mục 3 cho bài cô giao đứng trước mọi trạm luyện, và
  chúng được ghép vào sau khi planner chạy xong. Nếu "nửa phiên" chỉ tính phần planner dựng thì
  một phiên 12 bài luyện + 3 bài cô giao chỉ có 6/15 thuộc kế hoạch — 40%, không đạt. Nay planner
  nhận `extraSlots` (số trạm cô giao sắp được ghép vào) và tính nửa trên **tổng số bài con thật sự
  nhận được**. Bài cô giao vẫn không bao giờ bị thay.
- **Kế hoạch 4 kỹ năng vẫn lấp được 7 chỗ.** Lúc đầu mỗi kỹ năng trong kế hoạch chỉ được dùng một
  lần, nên kế hoạch ít kỹ năng không bao giờ đạt nửa phiên. Nay danh sách quay vòng; bộ chọn bài
  đưa một bài khác mỗi lần. Kế hoạch hẹp nghĩa là **hai tuần tập trung hơn**, không phải hai tuần
  ít bài hơn.

## 3. "Xuất PDF" = hộp thoại in của trình duyệt, không phải thư viện PDF

FR-PAR-02 yêu cầu bản đồ năng lực **xuất PDF**. Cách thường làm là một thư viện PDF phía máy chủ,
kéo theo một trình duyệt headless trên đúng cái máy đang chạy Postgres + worker + Next ở nhà, để
sinh ra một tài liệu **xấu hơn** tài liệu chính trình duyệt tạo ra từ cùng bộ CSS đó.

**Đã chọn:** nút "Xuất PDF" gọi `window.print()`; bảng in (`globals.css`) bỏ sidebar/topbar và trải
bản đồ ra toàn trang. Windows, macOS, Android, iOS đều có "Save as PDF" trong hộp thoại đó. Không
thêm phụ thuộc nào.

Nếu sau này cần PDF **gửi qua email tự động** (pha 7 mục 5) thì lúc đó mới cần sinh phía máy chủ —
và lúc đó có lý do thật để trả cái giá ấy.

## 4. Thẻ "5 môn" hiện ra 6 thẻ

`00` §49 gọi là **5 môn cốt lõi**, gộp ESL và ENL thành "Tiếng Anh"; `06` §2.1 P3 viết "thẻ 5 môn";
nhưng enum `Subject` và `content/skill-map/` có **6 môn**, vì ESL (giáo trình Macmillan) và ENL
(đọc–viết, Kids A-Z) là hai bản đồ kỹ năng khác nhau, mạch khác nhau, nguồn bằng chứng khác nhau.

**Đã chọn:** hiện **6 thẻ**, nhãn "Tiếng Anh — ESL" và "Tiếng Anh — đọc & viết", kèm một câu giải
thích trên đầu khu vực. Gộp hai thẻ lại sẽ trộn `ESL.PH.*` với `ENL.RF.*` thành một con số trung
bình không nói lên điều gì, và ba mẹ mất đúng thông tin có ích nhất: con **nghe–nói** tiếng Anh khá
hơn hay **đọc–viết** khá hơn.

AC "hiển thị đủ 5 môn" của FR-PAR-02 vẫn đạt: cả năm mảng cốt lõi đều có mặt.

---

## Ghi thêm — một lỗi cũ sửa trong pha này (không phải lệch tài liệu)

> **Cập nhật 12/09/2026 (pha 8 việc 0.3):** dữ liệu cũ **đã được dọn sạch**, không migrate. 1.662
> dòng dữ liệu học dev bị xoá bằng `pnpm db:reset-learning --apply`; `Skill`/`Exercise`/
> `LessonUnit`/`ContentBatch` còn nguyên (1.236 bài, 376 kỹ năng). Lý do chọn xoá thay vì dịch
> ngày: 52/72 phiên lệch ngày, **và** toàn bộ số liệu đó do bộ e2e sinh ra chứ không phải do con
> làm — dịch ngày chỉ chữa nửa vấn đề, còn nửa kia (phiên chẩn đoán đầu vào của pha 8 sẽ khởi động
> từ một mô hình năng lực dựng bằng câu trả lời của máy) thì không. Test canh giữ ở hai múi giờ:
> `packages/core/src/mastery/timezone.test.ts` và `packages/db/src/session/timezone.test.ts`.

`Session.date`, `Streak.lastActiveDate` và `EggProgress.startedOn` là cột `@db.Date`. Từ pha 3
chúng được ghi bằng **nửa đêm giờ máy**, mà Prisma tuần tự hoá qua UTC — nên ở UTC+7 mọi phiên học
bị xếp vào **ngày hôm trước**. Không ai thấy vì lúc đọc cũng quy đổi sai y hệt; nó chỉ lộ ra khi
dải hoạt động 7 ngày của P3 cần một cái nhãn ngày đúng. Nay có một hàm dùng chung `vnDayDate`, đặt
cạnh `dayKey` đã có, và năm bản sao `startOfDay` ghi vào cột ngày đều gọi nó. Dữ liệu cũ vẫn lệch
một ngày; không migrate vì đó là dữ liệu dev.
