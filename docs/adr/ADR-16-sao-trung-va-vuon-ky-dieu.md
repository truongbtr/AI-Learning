# ADR-16 — Sao theo công sức, trứng không reset, Vườn Kỳ Diệu đủ 4 khu

- **Ngày:** 11/09/2026 (đầu pha 4)
- **Trạng thái:** đã chốt — **chủ dự án quyết**, developer thi hành
- **Thay thế:** ADR-15 §5 (bảng sao/trứng/tranh của pha 3)
- **Tài liệu sửa theo:** `docs/06` §1.5b (mới), §1.6, §1.8c mục 1–2 và đoạn nguyên tắc cuối

## Bối cảnh

Cuối pha 3 developer hỏi chủ dự án ba câu (`docs/TIEN-DO.md`, mục "Câu hỏi cho chủ dự án" của pha
3): tỉ lệ sao, số ngày nở trứng, và có vẽ nốt các khu của Vườn Kỳ Diệu không. Chủ dự án trả lời cả
ba, và cả ba đều **đổi con số đã chốt ở ADR-15 §5** nên phải ghi lại ở đây.

## Quyết định

### 1. Sao đo công sức, không đo đúng sai

| Việc | Trước (ADR-15 §5) | Nay |
|---|---|---|
| Trả lời đúng ngay lần đầu | 2 | — |
| **Làm xong một bài** (đúng, gần đúng, hay xem đáp án rồi mới xong) | 1 | **1** |
| Xong cả phiên | 3 | 3 |
| Nghỉ vận động 30 giây | 1 | 1 |
| Ba mẹ bấm "Khen" | 5 | 5 |

**Lý do (lời chủ dự án):** hai bé học không đều nhau; sao gắn với độ đúng thì bé yếu hơn luôn ít sao
hơn và hai đứa sẽ tự so sánh. Chỗ phản ánh năng lực thật là bảng kỹ năng của ba mẹ, không phải túi
sao của con.

Hệ quả trong code (`packages/db/src/session/grade.ts`):

- `STARS.firstTry` và `STARS.finished` gộp thành **`STARS.exercise = 1`**.
- Sao trao khi **trạm kết thúc và con có làm** (`final && !response.skipped`) — nên **ảnh bài viết
  tay và bài đọc to ghi âm nhận sao ngay**, không chờ hàng chờ chấm xong. Trước đây hai dạng này
  rơi vào nhánh `pending` nên không được sao nào, tức là con làm thật mà không được gì.
- Chạm "để sau" vẫn **0 sao** — không phải phạt: chưa làm thì chưa có gì để thưởng, và bản thân
  quyền bỏ qua đã là quyền chọn của con (`06` §1.8b).
- `awardStars` vẫn idempotent theo `(reason, refType, refId)` nên gửi lại một câu trả lời không
  sinh sao thứ hai.

### 2. Trứng 4 ngày, và không cơ chế nào reset về 0

- `EGG_DAYS_TO_HATCH = 4` (trước là 5 vết nứt trong một tuần lịch).
- **Trứng không còn gắn với tuần.** `EggProgress` đổi khoá từ `(studentId, weekStart)` sang
  `(studentId, eggNo)` + `startedOn`/`hatchedAt`; số vết nứt = `tổng số ngày đã học − 4 × số trứng
  đã nở`. Nghỉ thì thanh đứng yên; **nở chậm hơn, không tụt**.
- Hết thú chưa sở hữu trong bảng `Pet` → trứng đứng ở mức **đầy** và chờ seed thêm thú
  (`waitingForNewPet`), vẫn không tụt.
- **Tranh tuần** áp cùng nguyên tắc: `WeeklyPicture` khoá theo `pictureNo`, `StudentPicturePiece`
  khoá `(studentId, pictureNo, pieceIndex)`; 6 mảnh xong một bức thì sang bức kế. Lý do thực tế:
  với lịch nhà mình (4–5 buổi/tuần) bức tranh 6 mảnh **theo tuần lịch là bức tranh không bao giờ
  xong**.
- **`Streak`** đếm số ngày đã học và **không bao giờ về 1**: nghỉ thì đứng yên. Câu của mascot đổi
  từ "con học liền N ngày" sang "con đã học N ngày".

Cả ba đều tính lại từ `Session(status=COMPLETED)` theo **ngày riêng biệt**, nên chạy lại
`finishSession` không thưởng hai lần và không có bộ đếm nào bị tăng mù.

### 3. Vườn Kỳ Diệu đủ 4 khu

Pha 3 vẽ 4 khu Thành phố Robot nhưng chỉ 1 khu Vườn Kỳ Diệu (`docs/08` pha 3 việc 1 chỉ đòi "tối
thiểu 1 khu"). Chủ dự án yêu cầu vẽ nốt `thap-chu`, `tram-khong-gian`, `ben-tau-tieng-anh` phiên bản
vườn, đủ 3 lớp, theo `content/art/STYLE.md` — để thế giới của Mai Thy cân với thế giới của Chí
Chí Thanh. Tổng lớp nền: 15 → **24**.

## Hệ quả

- Migration `phase4_*` đổi `EggProgress`, `WeeklyPicture`, `StudentPicturePiece`. Dữ liệu dev cũ
  được chuyển theo thứ tự tuần (tuần đầu → `eggNo`/`pictureNo` 0) nên không mất mảnh nào.
- Huy hiệu `picture_complete` nay xét **mọi** bức tranh đã đủ mảnh, không riêng bức của tuần này.
- Ai đổi luật sao/trứng/tranh lần sau: sửa bảng `docs/06` §1.5b và §1.8c **trước**, rồi mới sửa
  code — quy tắc này giữ nguyên từ ADR-15.
