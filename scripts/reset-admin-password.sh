#!/usr/bin/env bash
# Đặt lại mật khẩu tài khoản ADMIN khi quên (docs/VAN-HANH.md §0). Chạy trên máy chủ Ubuntu:
#   cd /opt/edison-learning && bash scripts/reset-admin-password.sh [admin]
# Mật khẩu gõ ẩn, không nằm trong lịch sử lệnh, không ghi ra file.
set -euo pipefail
cd "$(dirname "$0")/.."
USERNAME="${1:-admin}"
COMPOSE=(docker compose --env-file .env -f docker/compose.yml)

"${COMPOSE[@]}" cp scripts/reset-admin-password.cjs web:/tmp/reset-admin-password.cjs >/dev/null
"${COMPOSE[@]}" exec -T web sh -c '. /app/docker/env.sh && node /tmp/reset-admin-password.cjs "$1" --check' _ "$USERNAME"

read -r -s -p "Mật khẩu mới cho $USERNAME (ít nhất 10 ký tự): " PW1; echo
read -r -s -p "Gõ lại mật khẩu mới: " PW2; echo
if [ "$PW1" != "$PW2" ]; then echo "Hai lần gõ không giống nhau — chưa đổi gì."; exit 1; fi

printf '%s' "$PW1" | "${COMPOSE[@]}" exec -T web sh -c '. /app/docker/env.sh && node /tmp/reset-admin-password.cjs "$1"' _ "$USERNAME"
unset PW1 PW2
"${COMPOSE[@]}" exec -T web rm -f /tmp/reset-admin-password.cjs
