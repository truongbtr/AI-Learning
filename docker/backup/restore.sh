#!/bin/sh
# Khôi phục từ một bản sao lưu (docs/08 pha 8 việc 2).
#
# ĐÂY LÀ SCRIPT ĐÃ ĐƯỢC DIỄN TẬP THẬT trên một container Postgres trắng — xem
# docs/VAN-HANH.md §5 và nhật ký của lần diễn tập trong docs/TIEN-DO.md pha 8.
#
#   /backup/restore.sh <tên-file.dump> [tên-database]
#
# Không có tham số thì nó lấy bản mới nhất trong /out/latest.txt.
# Mặc định khôi phục vào một database MỚI tên "<db>_restore" để không đè lên dữ liệu đang chạy;
# muốn đè thật thì truyền tên database thật và xác nhận bằng RESTORE_OVERWRITE=1.
set -eu

: "${POSTGRES_USER:=mtct}"
: "${POSTGRES_DB:=mtct}"
: "${PGHOST:=postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

DUMP_NAME="${1:-}"
if [ -z "$DUMP_NAME" ]; then
  [ -f /out/latest.txt ] || { echo "Không có /out/latest.txt và không truyền tên file."; exit 1; }
  DUMP_NAME="$(head -1 /out/latest.txt)"
  echo "[khoi-phuc] chưa chọn bản nào, dùng bản mới nhất: $DUMP_NAME"
fi
DUMP="/out/db/$DUMP_NAME"
[ -f "$DUMP" ] || { echo "Không thấy $DUMP"; ls -1 /out/db 2>/dev/null | tail -5; exit 1; }

TARGET="${2:-${POSTGRES_DB}_restore}"

if [ "$TARGET" = "$POSTGRES_DB" ] && [ "${RESTORE_OVERWRITE:-0}" != "1" ]; then
  cat <<'WARN'
DỪNG. Bạn đang khôi phục đè lên database đang chạy.
Nếu đúng ý bạn, chạy lại với RESTORE_OVERWRITE=1:
  docker compose --env-file .env -f docker/compose.yml run --rm \
    -e RESTORE_OVERWRITE=1 backup /backup/restore.sh <file.dump> mtct
Trước đó nên tắt web và worker:  docker compose ... stop web worker
WARN
  exit 1
fi

echo "[khoi-phuc] nguồn : $DUMP ($(du -h "$DUMP" | cut -f1))"
echo "[khoi-phuc] đích  : $TARGET trên $PGHOST"

# Dựng lại database đích từ trắng — pg_restore --clean trên một database có dữ liệu để lại rác.
psql -h "$PGHOST" -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$TARGET\" WITH (FORCE);"
psql -h "$PGHOST" -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"$TARGET\" OWNER \"$POSTGRES_USER\";"

echo "[khoi-phuc] pg_restore…"
# --no-owner: khôi phục sang máy khác, tên vai trò có thể khác.
pg_restore -h "$PGHOST" -U "$POSTGRES_USER" -d "$TARGET" --no-owner --exit-on-error "$DUMP"

echo "[khoi-phuc] đếm lại:"
psql -h "$PGHOST" -U "$POSTGRES_USER" -d "$TARGET" -t -A -F' ' -c "
  SELECT 'Skill', count(*) FROM \"Skill\"
  UNION ALL SELECT 'Exercise', count(*) FROM \"Exercise\"
  UNION ALL SELECT 'Student', count(*) FROM \"Student\"
  UNION ALL SELECT 'User', count(*) FROM \"User\"
  UNION ALL SELECT 'Session', count(*) FROM \"Session\"
  UNION ALL SELECT 'Evidence', count(*) FROM \"Evidence\"
  UNION ALL SELECT 'SkillMastery', count(*) FROM \"SkillMastery\"
  ORDER BY 1;"

if [ -d /out/files ]; then
  echo "[khoi-phuc] ảnh bài vở nằm ở /out/files — chép ngược vào volume 'files':"
  echo "  docker compose --env-file .env -f docker/compose.yml run --rm \\"
  echo "    -v \"\${BACKUP_DIR}:/out\" backup cp -a /out/files/. /data/files/"
  echo "  (bỏ ':ro' của volume /data/files trong compose.yml trước khi chép ngược)"
fi

echo "[khoi-phuc] xong. Đổi DATABASE_URL sang \"$TARGET\" để xem thử trước khi dùng thật."
