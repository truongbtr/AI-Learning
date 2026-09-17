# Quyết định đã chốt

> Sinh tự động từ `docs/02-KIEN-TRUC.md` §8 và `docs/adr/`. Đừng đề xuất lại những thứ ở đây;
> muốn đổi thì viết ADR mới và nói rõ trong báo cáo (CLAUDE.md quy tắc 2).

## ADR-1…10 (trong `docs/02` §8)

- **ADR-1** — Next.js full-stack, 1 repo _(vì: Dự án gia đình 2 người dùng; giảm 60% khối lượng hạ tầng; Claude Code làm Next.js hiệu quả)_
- **ADR-2** — pg-boss thay vì Redis/BullMQ _(vì: Bớt 1 service; tải job nhỏ)_
- **ADR-3** — ~~pgvector thay vì vector DB riêng~~ — **bãi bỏ bởi ADR-10/ADR-12**: không dùng vector, tra cứu kỹ năng bằng Postgres full-text + `unaccent` _(vì: Không còn embedding lúc chạy)_
- **ADR-4** — Mọi output AI qua tool-use JSON + Zod _(vì: Ổn định, test được, không vỡ UI)_
- **ADR-5** — Bài luyện là **dữ liệu** (`ExerciseSpec` JSON) render bởi component theo `type` _(vì: An toàn, cache được, chấm cục bộ được)_
- **ADR-6** — Web Speech mặc định, cloud TTS/STT qua adapter _(vì: Chi phí + độ trễ; adapter đổi được)_
- **ADR-7** — Mastery = mô hình Bayesian/ELO-lite giải thích được (xem 04) _(vì: Dữ liệu ít; cần giải thích cho phụ huynh)_
- **ADR-8** — Chạy tại nhà + Cloudflare Tunnel _(vì: Dữ liệu trẻ ở nhà; chi phí 0; anh đã quen Docker/Cloudflare)_
- **ADR-9** — **Nội dung (bài học + ngân hàng bài luyện) soạn ngoại tuyến bằng Claude Code, nạp vào DB; app chỉ đọc** _(vì: Chất lượng cao hơn (đọc cả cuốn sách, tự kiểm, sửa được), chi phí trả một lần, độ trễ 0, ba mẹ duyệt trước. Xem `10-NAP-NOI-DUNG.md`)_
- **ADR-10** — **App không gọi API LLM nào; mọi việc cần AI (đọc ảnh vở, chấm bài mở, báo cáo tuần) đi qua hàng chờ và do Claude Code xử lý theo lô** _(vì: Nhất quán với ADR-9; chi phí vận hành ≈ 0; không có khoá API trong hệ thống; đổi lại kết quả đọc ảnh trễ 1–3 ngày và bỏ gia sư giọng nói ở v1. Xem `13-HANG-CHO-AI.md`)_

## ADR-11 trở đi (`docs/adr/`)

- `docs/adr/ADR-11-pha0-ngoai-pham-vi.md` — ADR-11 — Ba commit ngoài phạm vi pha 0 (TTS cloud, giọng nhân bản ElevenLabs, giao diện MEDIFA ONE)
- `docs/adr/ADR-12-bo-skill-embedding.md` — ADR-12 — Bỏ `SkillEmbedding` và cột `embedding` (không dùng pgvector)
- `docs/adr/ADR-13-bo-sung-mo-hinh-ky-nang-va-mastery.md` — ADR-13 — Bổ sung nhỏ cho mô hình kỹ năng & mastery ở pha 1
- `docs/adr/ADR-14-hop-dong-bai-luyen-pha-2.md` — ADR-14 — Bốn bổ sung vào hợp đồng bài luyện khi hiện thực hoá pha 2
- `docs/adr/ADR-15-goc-cua-con-pha-3.md` — ADR-15 — Sáu chỗ lệch tài liệu khi dựng Góc của con (pha 3)
- `docs/adr/ADR-16-sao-trung-va-vuon-ky-dieu.md` — ADR-16 — Sao theo công sức, trứng không reset, Vườn Kỳ Diệu đủ 4 khu
- `docs/adr/ADR-17-nap-anh-bai-vo-pha-4.md` — ADR-17 — Nạp ảnh bài vở & nhật ký lớp: năm chỗ lệch tài liệu ở pha 4
- `docs/adr/ADR-18-bang-dieu-khien-ba-me-pha-5.md` — ADR-18 — Bảng điều khiển ba mẹ: bốn chỗ lệch tài liệu ở pha 5
- `docs/adr/ADR-19-dang-bai-va-pham-vi-chu-dot-3.md` — ADR-19 — Đợt 3: dạng bài bắt buộc, phạm vi chữ và chữ p
- `docs/adr/ADR-20-thanh-pho-3d-that-hay-webp.md` — ADR-20 — Thành phố 3D: render thật trên máy, không dựng sẵn WebP
- `docs/adr/ADR-21-du-lieu-thanh-pho.md` — ADR-21 — Nối dữ liệu học vào thành phố
- `docs/adr/ADR-22-tri-nho-tung-tu.md` — ADR-22 — Trí nhớ từng từ tiếng Anh (`WordProgress`) tách khỏi `SkillMastery`
- `docs/adr/ADR-23-ban-do-vanh-dai.md` — ADR-23 — Bản đồ thành phố kiểu vành đai, đồ thị đường, và ngân sách cuối năm
- `docs/adr/ADR-24-xuong-tieng-am-truoc-chu-sau.md` — ADR-24 — Xưởng Tiếng: âm ra trước, chữ là kết quả
- `docs/adr/ADR-25-bo-bai-viet-roi-chup.md` — ADR-25 — Không giao bài "viết vào vở rồi chụp ảnh" trong phiên học

## Hai thứ bị đảo ngược, đừng đọc bản cũ

- **ADR-3 (pgvector)** bị bãi bỏ bởi ADR-10/ADR-12: tra cứu kỹ năng bằng Postgres full-text + `unaccent`.
- **ADR-18 mục 1** bị đảo ngược 12/09/2026: `PLAN_SHARE` = 0,4 và **sàn ôn 30% không phá được** —
  kể cả bằng `setPlannerWeight` trong `ops/requests/` (docs/14 §4).
