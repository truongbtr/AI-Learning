#!/bin/sh
# Web container start: apply migrations, run the idempotent seed, start Next.js (docs/02 §7).
set -e
. /app/docker/env.sh
cd /app/packages/db
echo "[web] prisma migrate deploy"
pnpm exec prisma migrate deploy
echo "[web] seed (idempotent)"
pnpm exec tsx prisma/seed.ts
cd /app
echo "[web] next start"
exec pnpm --filter @mtct/web start
