# 14 — Dữ liệu vận hành: cửa chung cho Claude Code và Claude chat

> Hệ thống chạy ở nhà, nhưng **hai tác nhân AI cùng làm việc trên nó**: Claude Code (trong repo, trên
> máy chủ) và Claude chat / Cowork (qua cầu nối tới thư mục dự án). Tài liệu này định nghĩa **chỗ để
> đọc** và **chỗ để tác động**, sao cho cả hai cùng thấy một sự thật và không ai đụng thẳng vào cơ sở
> dữ liệu học của con.

## 1. Vì sao cần

Sau khi bàn giao, hệ thống không đứng yên: ngân hàng bài phải dày thêm, planner phải chỉnh nhịp, nội
dung dở phải gỡ, kỹ năng gắn sai phải sửa. Claude Code ngồi ngay trong repo nên làm được mọi thứ.
Claude chat thì **chỉ với tới thư mục dự án**, không nói chuyện được với Postgres (chạy trong Docker
trên Windows, cầu nối là một máy ảo Linux riêng). Vậy thư mục dự án chính là mặt phẳng chung.

Nguyên tắc: **thư mục là API.** Ai muốn biết chuyện gì đang xảy ra thì đọc file trong `ops/`; ai muốn
thay đổi thì **đặt một yêu cầu** vào `ops/requests/`, không tự sửa DB.

## 2. Hai chiều

```
DB  ──(pnpm ops:export, 04:30 hằng đêm + gọi tay)──▶  ops/state/…     ← chat & Claude Code ĐỌC
DB  ◀─(pnpm ops:apply, người duyệt)─────────────────  ops/requests/…  ← chat & Claude Code GHI
```

- **Đọc** không bao giờ cần quyền gì: file phẳng, nhỏ, đọc bằng `cat`.
- **Ghi** luôn đi qua `ops:apply`: kiểm định schema → in ra diff → **chờ người đồng ý** → áp dụng →
  ghi kết quả. Không có đường nào khác vào dữ liệu học của con.

## 3. `ops/state/` — ảnh chụp để phân tích

Mỗi đêm 04:30 (sau `planner.daily`) và mỗi khi gọi `pnpm ops:export`:

```
ops/state/
  SUMMARY.md                 # 1 trang, đọc là hiểu tuần này thế nào — viết cho người
  latest/                    # symlink/bản sao của ngày mới nhất
  2026-09-12/
    meta.json                # schemaVersion, exportedAt, khoảng dữ liệu, số dòng mỗi file
    students.csv             # nickname, lớp, thế giới, thời lượng phiên — KHÔNG tên đầy đủ, KHÔNG ngày sinh
    mastery.csv              # nickname, skillCode, môn, mạch, mastery, confidence, status, lastEvidenceAt, nextReviewAt
    mastery-history.csv      # thay đổi 90 ngày gần nhất (nickname, skillCode, ngày, m_cũ, m_mới, nguyên nhân)
    sessions.csv             # nickname, ngày (giờ VN), kind, số bài, số bài xong, phút, bỏ dở ở bài nào
    attempts.csv             # sessionId, exerciseStableId, skillCode, outcome, tries, hintsUsed, giây
    evidence.csv             # nickname, skillCode, source, outcome, errorCode, ngày
    error-stats.csv          # nickname, errorCode, số lần 14/30 ngày, lần gần nhất
    remediation.csv          # nickname, errorCode, bậc thang hiện tại, mở lúc nào, đóng chưa
    content-coverage.csv     # skillCode, số bài PUBLISHED theo dạng và mức khó, số bài chưa có audio
    diary.csv                # ngày, môn, bài lớp học, bài cô giao, đã dán lúc mấy giờ
    exercise-health.csv      # exerciseStableId, số lượt, tỉ lệ đúng, tỉ lệ bỏ qua, giây trung vị
```

Ràng buộc:

- **CSV thuần, một dòng một bản ghi**, để đọc bằng mắt, bằng `grep`, bằng pandas, và **diff được giữa
  hai ngày**. Không JSON lồng nhau cho dữ liệu bảng.
- Tổng mỗi ngày < 5 MB. Giữ 90 ngày, cũ hơn thì gộp thành tháng.
- **Không bao giờ** chứa: tên đầy đủ, ngày sinh, mật khẩu, khoá API, ảnh bài vở (chỉ đường dẫn).
  Nickname `thy` / `thanh` là định danh duy nhất.
- `meta.json` có `schemaVersion`; đổi cột phải tăng phiên bản và ghi vào `ops/CHANGELOG.md`.
- `exercise-health.csv` là thứ quý nhất cho pha 6: nó nói bài nào con hay bỏ qua, bài nào ai cũng
  đúng (quá dễ), bài nào ai cũng sai (viết hỏng).

`SUMMARY.md` viết bằng câu, cho người đọc trong 30 giây: mỗi bé tuần này học mấy ngày, mấy phút, kỹ
năng nào lên, kỹ năng nào tụt, ba mã lỗi hay gặp nhất, nội dung đang thiếu ở đâu, có gì hỏng không.

## 4. `ops/requests/` — cách tác động

Một yêu cầu là **một file JSON**, đặt tên `<ngày>-<số>-<việc>.json`:

```json
{
  "schemaVersion": 1,
  "createdBy": "claude-chat",
  "createdAt": "2026-09-12T21:10:00+07:00",
  "reason": "Thy sai nham_b_d 4 lần trong 9 ngày, thang rèn đang đứng ở bậc 2",
  "ops": [
    { "type": "planHint", "student": "thy", "date": "2026-09-13",
      "focusSkills": ["VIET.HV.NHAM_LAN_B_D"], "note": "ưu tiên bài đối chiếu" }
  ]
}
```

Danh sách thao tác **được phép** (whitelist, cái gì không có trong danh sách thì bị từ chối):

| `type` | Làm gì |
|---|---|
| `planHint` | Gợi ý trọng tâm cho phiên ngày mai (đúng cơ chế `PlanHint` đã có) |
| `retireExercise` / `reviveExercise` | Gỡ hoặc trả lại một bài theo `stableId` |
| `flagExercise` | Đánh dấu bài có vấn đề để pha nội dung xem lại |
| `setSkillStatus` | Ẩn / bỏ ẩn một kỹ năng trong bản đồ |
| `setSessionLength` | Đổi số bài mỗi phiên của một bé (8–20) |
| `setPlannerWeight` | Chỉnh tỉ lệ trọng tâm / ôn / mới — **có chặn cứng: ôn không dưới 30 %** |
| `remapSkill` | Đổi kỹ năng gắn cho một bài |
| `noteForParent` | Đặt một thẻ nhắc trên dashboard ba mẹ |

**Cấm tuyệt đối, không có ngoại lệ:** xoá hay sửa `Evidence`, `Attempt`, `Session`, `SkillMastery`
(dữ liệu học của con là bất khả xâm phạm — muốn sửa thì ba mẹ dùng `PARENT_OVERRIDE` trên web, có ghi
vết); đụng `User`, mật khẩu, phân quyền; đổi `.env`; xoá file.

Vòng đời: `ops/requests/` → `pnpm ops:apply` (kiểm định → in diff → hỏi đồng ý) →
`ops/applied/<ngày>/<tên>.json` kèm kết quả và số dòng đã đổi → ghi một dòng vào `ops/CHANGELOG.md`.
Từ chối thì sang `ops/rejected/` kèm lý do. **Mọi thao tác phải có đường lùi** ghi trong file kết quả.

## 5. `ops/context/` — để phiên chat mới bắt kịp

Chat không có trí nhớ giữa các phiên, nên mỗi lần xuất cũng viết lại:

- `ops/context/HIEN-TRANG.md` — hệ thống đang ở pha nào, chạy từ bao giờ, cái gì đang hỏng, việc gì
  đang chờ chủ dự án. **Đây là file một phiên chat mới đọc đầu tiên.**
- `ops/context/QUYET-DINH.md` — các quyết định đã chốt và lý do (rút gọn từ ADR), để phiên mới không
  đề xuất lại thứ đã bị loại.

Bản sao của hai file này cũng được đẩy lên Project trên claude.ai (`claude/trang-thai-du-an.md`) để
chat trên điện thoại đọc được khi không có cầu nối tới máy.

## 6. Nhịp làm việc

| Khi nào | Ai | Làm gì |
|---|---|---|
| Hằng đêm 04:30 | máy | `ops:export` |
| Hằng tuần | chat | Đọc `SUMMARY.md` + `exercise-health.csv` → báo chủ dự án 5 dòng, đặt `ops/requests/` nếu cần |
| Khi chủ dự án hỏi | chat | Đọc `ops/state/latest/` trả lời, **không đoán** |
| Mỗi đợt nội dung | Claude Code | Đọc `content-coverage.csv` + `exercise-health.csv` để biết soạn gì trước |
| Trước khi áp | người | `ops:apply` in diff, chủ dự án gật mới chạy |

## 7. Vì sao không cho AI nối thẳng vào cơ sở dữ liệu

Nhanh hơn thật. Nhưng đây là dữ liệu học của hai đứa trẻ, tích luỹ nhiều năm, không có bản sao ở đâu
khác. Một câu lệnh sai của bất kỳ ai — người hay máy — là mất. Cách làm này đánh đổi vài giây tiện lợi
lấy ba thứ: **mọi thay đổi đều thấy được trước khi áp**, **mọi thay đổi đều lùi được**, và **ba mẹ
luôn là người bấm nút cuối**. Với một hệ thống chạy trong nhà mình thì đó là đánh đổi đúng.
