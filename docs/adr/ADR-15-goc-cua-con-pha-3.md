# ADR-15 — Sáu chỗ lệch tài liệu khi dựng Góc của con (pha 3)

- **Trạng thái:** ĐÃ ÁP DỤNG 11/09/2026 (pha 3)
- **Liên quan:** `docs/06` §1.3, §1.7, §1.8, §1.9 (tài sản & hoạt hình); `docs/04` §5, §7, §11.1–11.2 (hợp đồng bài luyện, chấm bài); `docs/03` §2.7; ADR-14.

## Bối cảnh

Pha 3 dựng toàn bộ phần trẻ em nhìn thấy: tài sản đồ hoạ, design system, sáu dạng bài, planner
và năm màn hình. Sáu chỗ trong tài liệu không khớp với những gì thực sự cần để chạy được, và cả
sáu đều là quyết định "một lần rồi theo mãi", nên ghi lại ở đây thay vì để trong báo cáo pha.

## Quyết định

### 1. Tài sản là **SVG vẽ bằng code + Framer Motion**, không phải Lottie

`docs/06` §1.9 đề xuất mascot và hiệu ứng bằng **Lottie** tải sẵn trên LottieFiles, hoặc sinh bằng
AI ảnh. Thực tế:

- không có hoạ sĩ, và các gói Lottie miễn phí **không cùng một bút pháp** — ghép lại thành một thế
  giới lộn xộn, đúng thứ §1.5 cấm;
- ảnh sinh bằng AI không tái lập được chính xác cùng một nhân vật ở 9 trạng thái;
- `lottie-web` nặng ~250 KB gzip, trong khi cả thư viện tài sản hiện tại (70 vật thể, 2 mascot × 9
  trạng thái, 15 lớp nền, 8 avatar, 11 hiệu ứng, 6 tranh tuần, 6 âm thanh) **chỉ 0,43 MB**.

Thay bằng: mọi hình vẽ sinh ra từ `scripts/art-build/*.mjs` theo `content/art/STYLE.md`, chuyển
động do Framer Motion + CSS lo (`kid-blink`, `kid-talk`, `kid-sway`, `kid-drift`), pháo giấy bằng
`canvas-confetti`. Sửa một quy tắc mỹ thuật = sửa `STYLE.md` **trước**, rồi sửa generator, rồi
`pnpm art:build` — tài sản không sửa tay được, nên phong cách không trôi.

**Hệ quả:** `docs/06` §1.3 nói "Mascot (Lottie, 9 trạng thái)" — đọc là "9 trạng thái", nguồn là
SVG. Nếu sau này có hoạ sĩ thật thì thay generator, giao diện không đổi.

### 2. `dragItems[].errorTag` — chẩn đoán cho cả thao tác kéo thả

ADR-14 mục cuối để ngỏ: "nếu muốn chẩn đoán cả thao tác kéo-thả thì cần thêm `dragItems[].errorTag`
— chưa làm ở pha 2". Pha 3 làm: 185 bài `DRAG_DROP` của đợt 1 trước đó **chỉ có thể nói "chưa
đúng"**, y hệt điểm mù mà `choices[].errorTag` đã sửa cho bài chọn.

- `dragItems[].errorTag` gộp chung vào `answerKey.errorTags` (id thẻ kéo không bao giờ trùng id
  phương án: phương án là một chữ cái, thẻ kéo thì không);
- `toExerciseSpec()` cắt nó khỏi spec gửi cho máy con, đúng như với `choices[].errorTag`;
- **thẻ đặt sai chỗ vẫn được đặt.** Bản pha 3 đầu tiên cho thẻ "bay về chỗ cũ" ngay khi thả vào ô
  không nhận — nghĩa là con **không thể** trả lời sai, và chẩn đoán không bao giờ chạy. Nay thẻ nằm
  lại nơi con thả, máy chủ chấm theo tỉ lệ vị trí đúng (`docs/04` §7), rồi những thẻ sai mới bay về.

### 3. Hai mã lỗi mới trong `content/error-taxonomy.json`

`lap_lai_tong` (VMATH — con nhắc lại một số có sẵn trong đề thay vì tính) và `nham_chu_gan_giong`
(VIET — a/ă/â, o/ô/ơ, e/ê, u/ư, d/đ, a/o). Cả hai là lỗi thật, xuất hiện nhiều trong ngân hàng đợt
1 và trước đây bị gắn nhầm sang mã khác. Bộ mã lên **44**.

### 4. `docs/06` §1.8c được **viết lại**, không phải viết mới

`docs/08` pha 3 và FR-PAR-08 đều trỏ tới `06` §1.8c, nhưng mục đó không còn trong file — chỉ còn
bảng dữ liệu ở `03` §2.7 và nhật ký 10/09/2026 mô tả "14 cơ chế theo 4 động lực, 7 mục P0". Đã
dựng lại mục §1.8c từ hai nguồn đó, **giữ nguyên cách đánh số** để FR-PAR-08 ("mục 5, 10") vẫn trỏ
đúng hộp thư ba mẹ và sao vàng lớn, và thêm mục 12 vào checklist §4 như nhật ký ghi.

### 5. Luật sao, trứng và tranh tuần — chốt con số

> **Đã bị ADR-16 thay thế (11/09/2026).** Chủ dự án đổi: sao **1 cho mỗi bài làm xong** bất kể đúng
> sai (bỏ mức 2 sao), trứng **4 ngày** và **không reset theo tuần**, tranh cũng không reset. Bảng
> dưới giữ lại để đọc lịch sử quyết định.

Tài liệu nói "được sao", "trứng nở theo ngày học", "mảnh tranh cuối tuần" nhưng không cho con số.
Chốt trong code (`packages/db/src/session/grade.ts`, `packages/core/src/world/week.ts`):

| Việc | Sao |
|---|---|
| Trả lời đúng ngay lần đầu | 2 |
| Làm xong một bài (kể cả phải xem đáp án) | 1 |
| Xong cả phiên | 3 |
| Nghỉ vận động 30 giây | 1 |
| Ba mẹ bấm "Khen" | 5 (sao vàng lớn) |

Trứng: **5 vết nứt = 5 ngày học trong tuần** thì nở. Tranh tuần: **6 mảnh, mỗi ngày một mảnh**. Cả
hai tính từ *số ngày thực sự có phiên hoàn thành*, không cộng dồn mù, nên chạy lại không bao giờ
thưởng hai lần và nghỉ một ngày không mất gì.

### 6. Đường dẫn API phiên học

`docs/02` §5 phác `POST /api/attempts`. Thực tế mọi thao tác đều thuộc về một phiên và phải kiểm
quyền trên phiên đó, nên API là `POST /api/sessions/:id/attempts` (cùng họ với
`/api/sessions/:id/finish` và `/api/sessions/:id/choice`). `GET /api/events` (SSE) giữ nguyên tên.

## Hệ quả

- `docs/06` §1.3 và §1.9 đọc theo mục 1 ở trên khi nói tới Lottie.
- Pha 7 (thêm dạng bài) phải giữ luật: thẻ/phương án sai **có mã lỗi**, và máy con không nhận
  `answerKey` dưới mọi hình thức.
- Ai đổi luật sao/trứng/tranh thì sửa bảng ở mục 5 trước, rồi mới sửa code.
