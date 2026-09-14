# Hiện trạng — 2026-09-14

> Sinh tự động mỗi lần `pnpm ops:export`. **Đây là file một phiên chat mới đọc đầu tiên** (docs/14 §5).

## Hệ thống đang ở đâu

- Pha gần nhất ghi trong `docs/TIEN-DO.md`: **Pha 6a — 12/09/2026 — Nội dung đợt 2, chạy song song với 14 ngày dùng thật**
- 2 bé đang học · 376 kỹ năng trong bản đồ · 2676 bài đã xuất bản
- 2 phiên, 19 bằng chứng, 0 lô ảnh gửi qua chat
- Ngày học đầu tiên có trong DB: 2026-09-12
- Lần xuất trước: 2026-09-12T06:57:51.816Z

## Đọc gì, ở đâu

| Cần gì | Mở |
|---|---|
| Tuần này thế nào | `ops/state/SUMMARY.md` |
| Số liệu chi tiết | `ops/state/latest/*.csv` (cột giữ nguyên mỗi đêm, diff được) |
| Bài nào hỏng / quá dễ / bị bỏ qua | `ops/state/latest/exercise-health.csv` |
| Kỹ năng nào chưa có bài | `ops/state/latest/content-coverage.csv` |
| Quyết định đã chốt, đừng đề xuất lại | `ops/context/QUYET-DINH.md` |
| Muốn thay đổi gì | đặt file vào `ops/requests/`, rồi `pnpm ops:apply` (docs/14 §4) |

## Việc đang chờ chủ dự án

Xem mục 7 của pha gần nhất trong `docs/TIEN-DO.md` — đó là danh sách duy nhất được cập nhật bằng tay.

## Ranh giới không được vượt

- Không sửa/xoá `Evidence`, `Attempt`, `Session`, `SkillMastery`, `User` — kể cả qua `ops/requests/`.
- Không đụng `.env`, không xoá file.
- Không gửi tên đầy đủ hay ngày sinh của bé đi đâu cả; chỉ dùng `thy` / `thanh`.
- App không gọi API LLM nào (ADR-10). Việc cần AI đi qua hàng chờ hoặc qua `/api/internal/*`.
