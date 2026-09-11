# ADR-13 — Bổ sung nhỏ cho mô hình kỹ năng & mastery ở pha 1

- **Trạng thái:** CHẤP NHẬN (thực thi trong pha 1, 11/09/2026)
- **Liên quan:** `docs/03` §2.2–2.3, `docs/04` §3 và §11, `docs/05` §1 và §6, `docs/09` §3.1, ADR-12.

## Bối cảnh

Khi hiện thực hoá `docs/04` §3 và bản đồ kỹ năng, có vài chỗ tài liệu chưa nói tới hoặc nói chưa đủ để code chạy được. Các quyết định dưới đây **không trái** tài liệu, chỉ lấp chỗ trống — ghi lại để pha sau không phải đoán.

## Quyết định

### 1. Ví dụ 59.9 / 40.1 khớp đúng công thức, không cần thêm hằng số

`m=50, c=0.5, EXERCISE (w=1), s=1, d=3` → `k = 18`, `m_new = 50 + 50 × 0.18 × (1.4 − 0.3) = 59.9`; sai → `40.1`. Bộ hằng số ở `docs/04` §3.1 đã đủ, **không phải chọn thêm hằng số nào**. Test `packages/core/src/mastery/mastery.test.ts` khoá cả hai con số.

### 2. Trọng số nguồn `HOMEWORK` = 0.8

`docs/03` §2.3 có `EvidenceSource.HOMEWORK` nhưng bảng trọng số `docs/04` §3.1 không liệt kê. Chọn **0.8**, bằng `INTAKE_PHOTO`, vì bài cô giao được xác nhận qua ảnh/lời ba mẹ chứ không phải máy chấm trực tiếp. Đề xuất bổ sung dòng này vào `docs/04` §3.1.

### 3. "Đúng" khi bằng chứng không có `outcome`: `score ≥ 0.8`

`docs/04` §3.3 đòi "≥ 3 bằng chứng **đúng** trong 3 ngày khác nhau" nhưng không định nghĩa "đúng" cho bằng chứng có điểm liên tục (đọc to `accuracy`, chấm ảnh 0–1). Quy ước: có `outcome` thì theo `outcome = CORRECT`; không có thì `score ≥ 0.8`. `PARENT_OVERRIDE` **không** tính là một "ngày đúng" (nó là đánh giá của ba mẹ, không phải con làm bài).

### 4. Lịch ôn chỉ áp dụng cho kỹ năng từ `SOLID` trở lên

`docs/04` §3.4 nói "khi kỹ năng đạt SOLID trở lên". Vì vậy: kỹ năng chưa từng `SOLID` có `intervalDays = 0`, `nextReviewAt = null`; kỹ năng đang `SOLID+` mà ôn sai → về 2 ngày (đúng tài liệu); kỹ năng **tụt xuống dưới `SOLID`** rời khỏi lịch ôn và do **thang rèn** §11.4 lo. Nếu chủ dự án muốn vẫn giữ lịch ôn cho kỹ năng yếu thì sửa `reviewIntervalAfter` và ghi ADR mới.

### 5. `Skill.confusableWith: string[]` — cột mới

`docs/09` §3.1 liệt kê các cặp dễ nhầm (b/d, s/x, ch/tr, ng/ngh, hỏi/ngã…) và `docs/04` §11.4 bậc 5 cần "đặt hai thứ dễ nhầm cạnh nhau", nhưng `docs/03` §2.2 không có trường nào giữ quan hệ này. Thêm mảng mã kỹ năng `confusableWith` (đối xứng hai chiều trong file seed). Bổ sung vào `docs/03` §2.2 khi cập nhật tài liệu.

### 6. Bảng `ErrorCode` trong DB, nguồn vẫn là `content/error-taxonomy.json`

`docs/04` §11.1 định nghĩa bộ mã lỗi là **file JSON**. Nhưng validator của `POST /api/evidence` phải chặn mã lạ ngay trong một transaction DB (và `/admin/skills` cần liệt kê mã), nên đọc file trên đĩa lúc chạy là sai chỗ (container, nhiều tiến trình). Giải pháp: file JSON vẫn là **nguồn sự thật**, `pnpm db:seed` nạp vào bảng `ErrorCode` (upsert theo `code`, mã biến mất khỏi file chỉ bị `isActive=false`). API kiểm tra theo bảng, có cache 60 giây.

### 7. `Skill.searchVector` + trigger + `unaccent`, không dùng cột sinh (generated column)

Theo ADR-12 tra cứu kỹ năng dùng full-text. Postgres **không cho** `GENERATED ALWAYS AS` với `unaccent()` (hàm không `IMMUTABLE`), nên vector được một **trigger** `BEFORE INSERT OR UPDATE` duy trì, cấu hình `simple` + `unaccent`, index GIN. Trọng số: mã và tên = A, mạch = B, mô tả = C; mã còn được tách theo `.` và `_` để gõ `VIET.HV.AM_U` hay `am u` đều ra. Truy vấn xếp hạng bản ghi khớp **mọi** từ lên trước.

### 8. Mã môn Toán Việt Nam là `VMATH` (không phải `TOAN`)

`docs/05` §1 và enum `Subject` trong `docs/03` dùng `VMATH`; file đặt ở `content/skill-map/vmath.json`. (Yêu cầu pha 1 của chủ dự án ghi nhầm `TOAN`.)

### 9. Khung `LessonUnit` nằm ở `content/lessons/<môn>/*.units.json`

`docs/10` §3 mới có `content/lessons/<mon>/<code>.json` cho **từng bài có nội dung** (pha 2/6). Khung bài học của pha 1 (mã, tên, trang, tuần, kỹ năng — chưa có nội dung) cần một file cho **cả cuốn sách**, nên đặt tên `<mã sách>.units.json` trong cùng thư mục. Pha 6 nạp nội dung vào đúng các `LessonUnit` này theo `code`, không tạo bản trùng.

### 10. `INTERNAL_API_TOKEN` tuỳ chọn cho `POST /api/evidence`

`docs/08` pha 1 việc 3 ghi endpoint là "nội bộ (chỉ ADMIN hoặc token nội bộ worker)". Token đặt ở `.env` (`INTERNAL_API_TOKEN`), **để trống cũng chạy** — khi trống chỉ phiên ADMIN ghi được bằng chứng (NFR-09: hệ thống chạy không cần khoá nào). `proxy.ts` cho request tới `/api/evidence` đi qua để handler tự kiểm tra token hoặc phiên ADMIN; `CHILD`/`PARENT` luôn 403.

## Hệ quả

- Cần cập nhật `docs/03` §2.2 (thêm `confusableWith`, `searchVector`, bảng `ErrorCode`), `docs/04` §3.1 (trọng số `HOMEWORK`), `docs/04` §3.3 (định nghĩa "đúng"), `docs/02` §7 (biến `INTERNAL_API_TOKEN`) — developer đề xuất, chủ dự án duyệt.
- Không có thay đổi nào ảnh hưởng tới ADR-9/ADR-10: app vẫn không gọi API LLM.
