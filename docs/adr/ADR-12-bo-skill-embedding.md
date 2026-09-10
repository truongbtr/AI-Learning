# ADR-12 — Bỏ `SkillEmbedding` và cột `embedding` (không dùng pgvector)

- **Trạng thái:** CHẤP NHẬN (thực thi ở pha 0, ghi ADR ở đầu pha 1)
- **Ngày:** 10/09/2026 (quyết định), 11/09/2026 (ghi ADR)
- **Liên quan:** ADR-3 (pgvector), ADR-10 (app không gọi API LLM), `docs/13` §1, `docs/08` Pha 1 việc 5.

## Bối cảnh

`docs/03` §2.2 và §2.5 (bản gốc) có bảng `SkillEmbedding(skillId, embedding vector(1024))`, cột `LessonUnit.embedding vector(1024)` và chỉ mục ivfflat/hnsw; `docs/08` Pha 0 việc 2 ghi "pgvector bật". Các vector này chỉ phục vụ bước `INTAKE_MAP`/`EMBED` — gắn kỹ năng cho văn bản trích từ ảnh bằng API embedding (Voyage AI…).

ADR-10 (10/09/2026) chốt: app không gọi API LLM/embedding nào; đọc ảnh và gắn kỹ năng do Claude Code làm theo lô trong repo (`docs/13`). `docs/13` §1 ghi rõ "bỏ pgvector". Vì vậy ở pha 0 schema Prisma **không** tạo extension `vector`, không có bảng `SkillEmbedding`, không có cột `embedding`.

## Quyết định

1. Không dùng pgvector; image Postgres là `postgres:16` chuẩn.
2. Bỏ bảng `SkillEmbedding`, bỏ cột `LessonUnit.embedding`, bỏ chỉ mục vector khỏi `docs/03` (đã sửa cùng ADR này).
3. Tra cứu kỹ năng bằng chuỗi (cho bộ đọc nhật ký lớp, màn duyệt intake, admin) dùng **Postgres full-text search + `unaccent`** trên cột `tsvector` của `Skill` (mã, tên VN/EN, mô tả, mạch) với chỉ mục GIN — pha 1 việc 5.
4. ADR-3 ("pgvector thay vì vector DB riêng") coi như **hết hiệu lực** kể từ ADR-10.

## Hệ quả

- Không cần API embedding, không tốn chi phí; tìm kiếm theo từ khoá đủ cho ~300 kỹ năng.
- Nếu tương lai bật lại gắn kỹ năng tự động lúc chạy, cần ADR mới (mở lại pgvector hoặc dùng full-text + luật).
- Tài liệu còn nhắc "embedding pgvector" ở `docs/02` §2 (sơ đồ) và §4.1 bước 2, `docs/07` §1/§4 — là mô tả của thời trước ADR-10; nên dọn khi cập nhật các tài liệu đó (không thuộc phạm vi pha 1).
