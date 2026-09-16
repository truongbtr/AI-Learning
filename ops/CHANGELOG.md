# Nhật ký thay đổi vận hành

> Một dòng mỗi lần `pnpm ops:apply` chạy (docs/14 §4). Mới nhất ở dưới.

- 16/09/2026 · pha 12 · `ops:export` lên `schemaVersion` 2: `word-progress.csv` đổi thành `lexemes.csv`, thêm cột `kind` (`word` = từ tiếng Anh, `syllable` = tiếng Việt), cột `wordId`/`en` đổi thành `lexemeId`/`text`. Không phải thao tác `ops:apply`; ghi ở đây vì docs/14 §3 yêu cầu mọi lần đổi cột phải có dấu vết.
