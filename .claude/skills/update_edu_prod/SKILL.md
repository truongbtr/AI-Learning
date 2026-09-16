---
name: update_edu_prod
description: Deploy the newest committed version of EDISON_LEARNING to the production server (edu.medifa.vn, Ubuntu 192.168.1.102). Use when the owner says "update/deploy bản mới lên production", "/update_edu_prod", or asks to put a finished phase live.
---

# Deploy bản mới lên production (edu.medifa.vn)

Production là **máy Ubuntu `192.168.1.102`** (`/api/health` → `host: ubuntu-edison`). Máy Windows chỉ là
máy dev, có database riêng. Không bao giờ `git push`. Image **build trên máy Windows** (máy chủ 3,3 GB RAM,
đĩa quay — build trên đó mất ~25 phút và đầy bộ đệm), rồi chuyển sang bằng `docker save | docker load`.

Tham số (tuỳ chọn): commit cần deploy. Mặc định: `master` hiện tại.

## 0. Kiểm tra trước — dừng lại nếu có vấn đề

1. **Giờ** (đọc bằng PowerShell `Get-Date`, không tin `date` của Git Bash — nó in giờ UTC):
   **không đổi bản trong 18:00–21:00** (giờ học của hai bé). Trong khung đó chỉ được chuẩn bị (bước 1–2),
   bước 4 trở đi chờ qua 21:00 và báo chủ dự án.
2. Máy chủ đang ở commit nào, có sửa tay chưa commit không:
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\medifa_deploy_ed25519 truong@192.168.1.102 "cd /opt/edison-learning && git log --oneline -1 && git status --short | grep -v _host-data-files; curl -s localhost:5000/api/health | head -c 300; df -h / | tail -1"
   ```
   Sửa tay trên máy chủ: so với commit mới; giống thì gỡ, khác thì **dừng và hỏi** (đừng ghi đè).
3. Đọc mục pha mới nhất trong `docs/TIEN-DO.md`: có **migration** nào, có lệnh **content:import** / sinh
   mp3 nào phải chạy sau khi đổi bản không, có bước nào đang **chờ chủ dự án xác nhận** (không tự chạy
   bước đó).
4. Liệt kê những gì sẽ lên: `git log --oneline <server-head>..<commit>`.

## 1. Build từ worktree sạch (máy Windows)

Cây làm việc chính hay có việc dở của phiên khác, và Docker build **cây làm việc**, không phải commit.

```bash
# worktree có sẵn ở E:/PROJECT/mtct-deploy; chưa có thì: git worktree add --detach E:/PROJECT/mtct-deploy <commit>
cd /e/PROJECT/mtct-deploy
git checkout -- . && git checkout -q --detach <commit>
cp /e/PROJECT/EDISON_LEARNING/.env .env          # chỉ để chạy test; xoá ngay sau bước 1
pnpm install --frozen-lockfile
pnpm --filter @mtct/db exec prisma generate
pnpm lint && pnpm build && pnpm test               # phải xanh, không thì dừng
rm .env
docker build -f docker/Dockerfile --target web    -t mtct-web:latest .
docker build -f docker/Dockerfile --target worker -t mtct-worker:latest .
```

Đã có image đúng commit này rồi (xem `docker images`, nhãn thời gian) thì **dùng lại**, đừng build lại.

## 2. Sao lưu database trên máy chủ

```bash
ssh ... "cd /opt/edison-learning && docker compose --env-file .env -f docker/compose.yml exec -T postgres sh -c 'pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -Fc' > ~/pre-deploy-\$(date +%Y%m%d-%H%M).dump && ls -la ~/pre-deploy-*.dump | tail -1"
```

## 3. Chuyển code (không push)

```bash
cd /e/PROJECT/EDISON_LEARNING
git bundle create $TMP/deploy.bundle <server-head>..<commit>
scp -i ~/.ssh/medifa_deploy_ed25519 $TMP/deploy.bundle truong@192.168.1.102:/tmp/deploy.bundle
ssh ... "cd /opt/edison-learning && git fetch -q /tmp/deploy.bundle <commit>:refs/remotes/bundle/master 2>/dev/null || git fetch -q /tmp/deploy.bundle master:refs/remotes/bundle/master; git merge --ff-only bundle/master && git log --oneline -1 && rm /tmp/deploy.bundle"
```

## 4. Chuyển image và đổi bản (ngoài 18:00–21:00)

```bash
docker save mtct-web:latest mtct-worker:latest | gzip -1 | ssh -i ~/.ssh/medifa_deploy_ed25519 truong@192.168.1.102 "gunzip | docker load"
ssh ... "cd /opt/edison-learning && docker compose -f docker/compose.yml --env-file .env up -d --no-build web worker"
```

Web tự chạy `prisma migrate deploy` + seed idempotent khi khởi động.

## 5. Lệnh sau khi đổi bản (chỉ những gì TIEN-DO ghi)

CLI chạy trong container phải nạp `env.sh` (không có `dotenv` trong image; thiếu nó sẽ trỏ tới
localhost:5432):

```bash
ssh ... "cd /opt/edison-learning && docker compose -f docker/compose.yml --env-file .env exec -T web sh -c '. ./docker/env.sh; cd packages/db && ./node_modules/.bin/tsx src/cli/content-import.ts --dry-run'"
```

Chạy `--dry-run` trước, xem số thay đổi, rồi mới chạy thật. Sinh mp3 dài (TTS) thì chạy nền
(`setsid nohup ... > ~/log &`) và báo hạn mức TTS trên `/api/health`.

## 6. Xác nhận và báo cáo

- `curl -s https://edu.medifa.vn/api/health` → `status: ok`, `host: ubuntu-edison`, `db.migrations`
  đúng số thư mục trong `packages/db/prisma/migrations`, worker ok.
- `docker compose ps`: web healthy, worker up.
- Trang `/login` trả 200; một asset mới của bản này trả 200.
- Dọn: `docker image prune -f` trên máy chủ nếu `/api/health` cảnh báo đĩa.
- Ghi vào `docs/TIEN-DO.md` (mục pha vừa deploy): commit đã lên, migration, lệnh đã chạy, kết quả,
  việc còn chờ chủ dự án. Commit tài liệu, bundle lên máy chủ như bước 3 (không cần đổi image).
- Báo chủ dự án ngắn gọn bằng tiếng Việt: bản nào đã lên, thay đổi gì với con, còn gì chờ.

## Không được

- Không `git push`; không sửa `.env` production trừ khi chủ dự án yêu cầu rõ; không in hay đọc mật khẩu.
- Không gỡ `/etc/sudoers.d/010-deploy-temp`.
- Không chạy bước nào TIEN-DO ghi là "chờ chủ dự án xác nhận".
- Không build image trên máy chủ.
