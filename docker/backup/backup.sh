#!/bin/sh
# Sao lưu một lần: pg_dump + bản sao thư mục file (docs/08 pha 8 việc 2).
#
# Chạy trong container "backup" (image postgres:16). Gọi tay được:
#   docker compose --env-file .env -f docker/compose.yml run --rm backup /backup/backup.sh
#
# Ra: /out/db/mtct-<ngày>-<giờ>.dump  và  /out/files/ (ảnh bài vở, mp3 đã cache)
# /out là thư mục BACKUP_DIR trên máy host, nên mở bằng Explorer được, và đồng bộ lên NAS bằng
# bất cứ công cụ nào nhà đang dùng (OneDrive, Synology Drive, robocopy…).
set -eu

: "${POSTGRES_USER:=mtct}"
: "${POSTGRES_DB:=mtct}"
: "${PGHOST:=postgres}"
: "${BACKUP_KEEP_DAYS:=30}"
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

STAMP="$(date +%Y-%m-%d-%H%M)"
DB_DIR=/out/db
FILES_DIR=/out/files
DUMP="$DB_DIR/mtct-$STAMP.dump"

mkdir -p "$DB_DIR" "$FILES_DIR"

echo "[sao-luu $STAMP] pg_dump $POSTGRES_DB@$PGHOST"
# --format=custom: nén sẵn, và pg_restore chọn được từng bảng nếu sau này cần.
pg_dump -h "$PGHOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --file="$DUMP.tmp"
mv "$DUMP.tmp" "$DUMP"
echo "[sao-luu $STAMP] dump xong: $(du -h "$DUMP" | cut -f1)"

# Ảnh bài vở là thứ KHÔNG dựng lại được. Chép kiểu cập nhật: file mới và file đã đổi mới chép,
# file đã xoá bên nguồn thì giữ nguyên bên bản sao — sao lưu thì thà thừa còn hơn thiếu.
if [ -d /data/files ]; then
  echo "[sao-luu $STAMP] chép /data/files → /out/files"
  cp -au /data/files/. "$FILES_DIR/" 2>/dev/null || cp -ru /data/files/. "$FILES_DIR/"
  echo "[sao-luu $STAMP] file: $(du -sh "$FILES_DIR" | cut -f1)"
fi

# Một dòng để biết bản mới nhất là bản nào mà không cần sắp xếp thư mục.
basename "$DUMP" > /out/latest.txt
date -Iseconds >> /out/latest.txt

# Dọn bản cũ. Chỉ đụng file .dump trong /out/db — không bao giờ đụng /out/files.
if [ "$BACKUP_KEEP_DAYS" -gt 0 ]; then
  OLD="$(find "$DB_DIR" -name 'mtct-*.dump' -mtime "+$BACKUP_KEEP_DAYS" | wc -l)"
  if [ "$OLD" -gt 0 ]; then
    # Trừ khi chỉ còn đúng một bản — không bao giờ để trống tay.
    KEPT="$(find "$DB_DIR" -name 'mtct-*.dump' | wc -l)"
    if [ "$KEPT" -gt "$OLD" ]; then
      find "$DB_DIR" -name 'mtct-*.dump' -mtime "+$BACKUP_KEEP_DAYS" -delete
      echo "[sao-luu $STAMP] xoá $OLD bản cũ hơn $BACKUP_KEEP_DAYS ngày"
    else
      echo "[sao-luu $STAMP] KHÔNG xoá: mọi bản đều cũ hơn $BACKUP_KEEP_DAYS ngày"
    fi
  fi
fi

echo "[sao-luu $STAMP] xong"
