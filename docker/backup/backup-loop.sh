#!/bin/sh
# Vòng lặp của container "backup": ngủ tới BACKUP_HOUR giờ (giờ Việt Nam) rồi chạy backup.sh.
#
# Không dùng cron: image postgres:16 không có cron, và một vòng lặp `sleep` đọc log dễ hơn —
# `docker compose logs backup` là thấy ngay lần chạy gần nhất làm gì.
set -eu

: "${BACKUP_HOUR:=1}"

echo "[sao-luu] khởi động. Chạy mỗi ngày lúc ${BACKUP_HOUR}:00 giờ Việt Nam."

# Nếu chưa có bản nào thì sao lưu ngay, để cài xong là có bản đầu tiên, không phải chờ tới đêm.
if [ ! -f /out/latest.txt ]; then
  echo "[sao-luu] chưa có bản nào — sao lưu ngay lần đầu"
  sh /backup/backup.sh || echo "[sao-luu] LỖI ở lần chạy đầu"
fi

while true; do
  NOW_H="$(date +%-H)"
  NOW_M="$(date +%-M)"
  # Số giây tới BACKUP_HOUR:00 kế tiếp.
  WAIT=$(( ((BACKUP_HOUR - NOW_H + 24) % 24) * 3600 - NOW_M * 60 ))
  [ "$WAIT" -le 60 ] && WAIT=$((WAIT + 86400))
  echo "[sao-luu] ngủ ${WAIT}s, chạy lúc $(date -d "+${WAIT} seconds" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "${BACKUP_HOUR}:00")"
  sleep "$WAIT"
  sh /backup/backup.sh || echo "[sao-luu] LỖI — xem dòng trên. Container vẫn chạy, mai thử lại."
done
