# Hiện trạng — 2026-09-15

> Sinh tự động mỗi lần `pnpm ops:export`. **Đây là file một phiên chat mới đọc đầu tiên** (docs/14 §5).

## Hệ thống đang ở đâu

- Pha gần nhất ghi trong `docs/TIEN-DO.md`: **Pha 10 — 15/09/2026 — Thế giới Học Đường: thành phố 3D *(việc 1–4 xong, việc 5 cần hai bé)***
- 2 bé đang học · 376 kỹ năng trong bản đồ · 10732 bài đã xuất bản
- 15 phiên, 94 bằng chứng, 0 lô ảnh gửi qua chat
- Ngày học đầu tiên có trong DB: 2026-09-12
- Lần xuất trước: 2026-09-14T21:30:57.230Z

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
