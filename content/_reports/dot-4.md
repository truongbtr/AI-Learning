# Đợt 4 — vòng phản hồi thật đầu tiên từ hai bé (pha 6d, việc 1)

**Ngày:** 15/09/2026 · **Người soạn:** Claude Code · **Phạm vi:** đọc `ops/state/latest/*.csv` (bản
xuất 04:30 hôm nay), sửa những gì lộ ra qua **dữ liệu dùng thật**, không soạn bài mới. §0 pha 6d giữ
nguyên: không sửa code app, không đụng Docker 18:00–21:00, mọi lần nạp `--dry-run` trước, không đụng
`Evidence`/`SkillMastery`/`Session`/`Attempt`.

---

## 1. Có bao nhiêu dữ liệu thật

Tính đến bản xuất hôm nay, **chỉ có 2 phiên thật, mỗi bé một phiên, cùng ngày 12/09** —
`sessions.csv` nói rõ hơn `SUMMARY.md`:

| Bé | Ngày | Trạng thái | Số câu / tổng | Phút | Sao |
|---|---|---|---|---|---|
| thy | 12/09 | **COMPLETED** | 9/10 trả lời | 78,1 | 12 |
| thanh | 12/09 | **COMPLETED** | 10/10 trả lời | 4,2 | 13 |

Cả hai phiên đều **đi hết 10 câu, không bỏ dở giữa chừng** — khác với suy đoán ban đầu. Hai phiên
`PLANNED` ngày hôm nay (15/09) của cả hai bé chưa ai làm; cột `stoppedAtSlot=1` của chúng chỉ là giá
trị mặc định khi `attempts=0` (`packages/db/src/ops/export.ts:252-257`), **không phải dấu hiệu bị
kẹt** — kiểm tra để khỏi báo nhầm.

20 lượt làm thật trong `attempts.csv` là toàn bộ bằng chứng hiện có. `exercise-health.csv` có 40
dòng vì nó gộp cả bài **đã offer cho 2 phiên `PLANNED` hôm nay chưa ai đụng tới** — 19 trong 20 dòng
"0 lượt làm" là loại này (chưa tới lượt, không phải bị bỏ vì khó hiểu). Chỉ **một** dòng "0 lượt" là
thật: `viet-am-u-0041` (mục 3 dưới đây). Bản tóm tắt ban đầu của tôi nghi ngờ "~20 bài bị bỏ vì câu
lệnh khó hiểu" — sai, đã sửa lại ở đây.

## 2. Bài sai duy nhất trong 20 lượt — đã từng sửa, vẫn còn dư âm

> `viet-bd-0049` — thanh làm, 3 lần thử, 66 giây, **sai**. Bài: "Có bao nhiêu dế? Chạm để đếm."
> (COUNT_TAP, đếm 5 con dế 🦗), gắn vào kỹ năng `VIET.HV.NHAM_LAN_B_D` (phân biệt b/d).

Tra `content/_reports/dot-2.md` (đợt 2, mục 5) thì đây **không phải phát hiện mới**: đúng lỗi đã ghi
nhận từ đợt 2 — đếm dế không đo được b/d, và cả 23 bài COUNT_TAP gắn nhầm vào kỹ năng ngữ âm đã
**RETIRE** từ đợt đó. Tra DB xác nhận `viet-bd-0049` đang `status=RETIRED`, không còn trong gói hiện
hành (`content/exercises/viet/HV.NHAM_LAN_B_D.pack.json` hiện chỉ còn id `viet-bd-0001`…`0046`).
Lượt làm sai của thanh xảy ra **trước khi bài đó nghỉ hưu** — dữ liệu cũ, không phải lỗi mới.

**Còn tồn, y như đợt 2 đã cảnh báo:** lượt sai đó **vẫn còn trong `SkillMastery` của
`VIET.HV.NHAM_LAN_B_D`**, hạ điểm một kỹ năng con không hề sai. Đợt này không được đụng
`Evidence`/`SkillMastery` (§0), nên vẫn để ba mẹ tự quyết ở dashboard, đúng như đợt 2 đã ghi. Không
sửa gì thêm ở đây — chỉ xác nhận lại.

## 3. Phát hiện thật — mở gói kiểm tra, tìm ra lỗi hiển thị

> `emath-count20-0016` — thy làm, **3 lần thử, dùng cả 3 gợi ý, 119 giây** mới đúng. Bài: "How many?
> Count, then tap." — 🚗 lặp **16** lần, chọn 15/16/17.

Mở `content/exercises/emath/NBT.COUNT_TO_20.pack.json` thì bài này là **MCQ**, ảnh
`{kind:"emoji", value:"🚗", repeat:16}`. Đọc code hiển thị
([apps/web/components/kid/exercise/frame.tsx:69-74](../../apps/web/components/kid/exercise/frame.tsx)) thì
khung câu hỏi dùng cho MCQ/LISTEN_CHOOSE **chỉ vẽ một `img.value`, không lặp theo `repeat`** — con
chỉ thấy **một** con xe 🚗, phải đoán xem "16" từ đâu ra. Bài `emath-count20-0001` (repeat:1) thì
không sao vì 1 = 1, nhưng từ `emath-count20-0002` (repeat:2) trở lên, hình vẽ và câu hỏi lệch nhau
hoàn toàn. `packages/content/src/exercise.ts:48-51` ghi rõ ý định: *"Draw the picture this many
times... unanswerable without it"* — tức đây là lỗi hiển thị của app, không phải bài soạn sai, nhưng
đợt này không được sửa code app (§0).

Quét lại cả gói: **19/49 bài** (`emath-count20-0002` … `emath-count20-0020`) mắc đúng lỗi này. Không
sửa được app thì chuyển sang cơ chế **đã có sẵn và render đúng**: `COUNT_TAP` — đúng kỹ năng
(`EMATH.NBT.COUNT_TO_20` đã khai `COUNT_TAP` trong `exerciseTypes`), và `count-tap.tsx` đọc thẳng
`countTarget.objects.repeat` để vẽ đủ số lượng. Đã **đổi cả 19 bài MCQ → COUNT_TAP**, giữ nguyên số
lượng, hình, gợi ý, giải thích, `sourceRef` — chỉ đổi cách hỏi và cách vẽ (script
`scripts/content-gen/fix-count-mcq-repeat.mjs`). `content:validate` sạch, `content:import --dry-run`
báo đúng 19 cập nhật không đụng bài nào khác, đã nạp thật.

**Ghi vào danh sách cho sau** (không sửa trong đợt này vì đụng code app): kiểm lại toàn ngân hàng
xem còn gói MCQ/LISTEN_CHOOSE nào dùng `prompt.image.repeat > 1` hay `choices[].image.repeat > 1` mà
không phải COUNT_TAP — `choices[].image` trong `apps/web/components/kid/exercise/choice.tsx:20-30`
cũng chỉ vẽ một hình, cùng lỗi. Về lâu dài nên sửa `frame.tsx`/`choice.tsx` để vẽ lặp theo `repeat`
(khớp đúng ý field đã ghi trong schema), thay vì chuyển từng bài sang COUNT_TAP.

## 4. Một bài bị bỏ qua thật — không phải vì khó hiểu

> `viet-am-u-0041` — thy làm, **order=1 (bài đầu phiên)**, `WRITE_PHOTO`, `UNANSWERED` sau 2 giây.

Nội dung: *"Con viết ư vào vở nhé, xong nhờ ba mẹ chụp."* — bài yêu cầu vở, bút, và **ba mẹ cầm máy
chụp ảnh** ngay lúc đó. Đặt kiểu bài này làm **câu đầu tiên** của một phiên bé tự mở máy chơi một
mình là chọn thời điểm xấu: chưa chắc có người lớn chụp ảnh ngay, nên bé bấm qua luôn (2 giây). Đáng
chú ý là thy **không bỏ cuộc** — bỏ qua đúng một câu này rồi làm hết 9 câu còn lại, hoàn thành cả
phiên 78 phút. Vậy đây không phải lỗi câu lệnh khó hiểu (đọc lại thấy câu rõ ràng, đúng tuổi), mà là
**thứ tự xếp bài trong phiên** — thuộc thuật toán lập kế hoạch (planner), tức code app, không sửa
được trong đợt này.

**Ghi vào danh sách cho sau:** planner nên tránh xếp `WRITE_PHOTO`/`SPEAK_ANSWER` (loại cần người lớn
thao tác cùng lúc) làm câu đầu phiên; ưu tiên đặt giữa hoặc cuối, lúc ba mẹ đã ngồi cạnh lâu hơn.

## 5. Dạng bài nào con làm lâu / dùng nhiều gợi ý nhất

Từ 20 lượt thật (chưa đủ để nói xu hướng theo dạng bài, nhưng đây là toàn bộ số có):

| Mã bài | Dạng | Giây | Lần thử | Gợi ý |
|---|---|---|---|---|
| `emath-count20-0016` | MCQ→COUNT_TAP (mục 3) | 119 | 3 | 3/3 |
| `viet-bd-0049` | COUNT_TAP (đã nghỉ hưu, mục 2) | 66 | 3 | 2 |
| `viet-am-ch-0035` | DRAG_DROP | 34 | 1 | 0 |
| `viet-am-o-0039` | DRAG_DROP | 19 | 1 | 0 |

Không có mẫu hình rõ ràng ở n=20 để nói "con không thích dạng X" — hai giá trị cao nhất đều đã có lý
do cụ thể (mục 2, 3), không phải một dạng bài nói chung khó. Sẽ đọc lại khi có thêm vài phiên nữa,
đúng như đợt 2 đã hẹn.

## 6. Việc 4 — hai kỹ năng ESL "trống"

`ESL.VOC.WEATHER` và `ESL.VOC.DAYS_OF_WEEK` là hai kỹ năng tuần 1–18 có 0 bài. Tra lại
`docs/09-GIAO-TRINH-TRUONG.md` §4b.3 (11/09/2026): đây là quyết định **đã chốt** — `isActive=false`,
"Global Stage 1 không có ba chủ đề này" (chủ đề thứ ba, `VOC.TRANSPORT`, thuộc tuần > 18 nên không
hiện ở đây). Soạn bài mới cho hai kỹ năng này là **làm khác quyết định đã ghi trong tài liệu** —
theo CLAUDE.md mục 2, việc đó cần một ADR, không tự làm. Đợt này **không soạn bài** cho hai kỹ năng
này; giữ nguyên `isActive=false`. Nếu chủ dự án muốn dạy hai chủ đề này ngoài Global Stage (không
theo sách trường), xin nói rõ để viết ADR rồi soạn — lúc đó sẽ tính là "bài mới" và làm ở đợt sau.

**Vậy "0 kỹ năng tuần 1–18 còn trống" của pha 6c vẫn đúng** — khi đo có lọc `isActive`, đúng cách đo
pha 6c đã dùng. Đo không lọc thì ra 2, và đó là 2 kỹ năng cố ý ngừng dùng, không phải bỏ sót.

## 7. Tóm tắt đã sửa

| Việc | Số bài |
|---|---|
| Đổi MCQ → COUNT_TAP (lỗi hiển thị `repeat`, mục 3) | **19** (`emath-count20-0002`…`0020`) |
| Bài mới soạn | **0** — đúng yêu cầu đợt này |
| Kỹ năng ESL vá thêm | **0** — quyết định đã chốt ở docs/09, không tự đổi |

`content:validate` sạch (10.732 bài / 269 gói, không đổi tổng số vì chỉ đổi kiểu, không thêm/bớt
bài). `content:import --dry-run` rồi mới nạp thật, không đụng `Session`/`Attempt`/`Evidence`/
`SkillMastery`. Không dựng lại Docker.
