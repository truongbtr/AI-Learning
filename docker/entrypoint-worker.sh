#!/bin/sh
# Worker container start: pg-boss jobs (docs/02 §2).
set -e
. /app/docker/env.sh
cd /app
exec pnpm --filter @mtct/worker start
