# Multi-stage image for both services (docs/02 §7). Build from the repo root:
#   docker compose -f docker/compose.yml up -d --build
# Targets: `web` (Next.js + migrations + seed on start) and `worker` (pg-boss).
# Debian-based so Prisma (debian-openssl-3.0.x) and @node-rs/argon2 use prebuilt binaries.

# ---------- base: pnpm ----------
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate \
  && apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- deps: install with the lockfile ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/core/package.json packages/core/
COPY packages/content/package.json packages/content/
COPY packages/inbox/package.json packages/inbox/
COPY packages/db/package.json packages/db/
COPY packages/config/package.json packages/config/
COPY packages/city/package.json packages/city/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------- build: prisma generate, db dist, next build; then re-link prod deps only ----------
# (pnpm prune does not handle workspaces; a --prod install from the cached store does.)
FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# art:sync copies content/art into apps/web/public/art (ignored by git): the image must not depend
# on whatever copy happens to sit in the build folder (pha 10b: the city art was missing).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store node scripts/art-sync.mjs \
  && pnpm --filter @mtct/core build \
  && pnpm --filter @mtct/db generate \
  && pnpm --filter @mtct/db build \
  && pnpm --filter @mtct/web build \
  && pnpm install --prod --frozen-lockfile --config.confirmModulesPurge=false \
  && rm -rf apps/web/.next/cache

# ---------- runtime (shared) ----------
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app /app
RUN mkdir -p /data/files /data/inbox && chown -R node:node /data /app
USER node

# ---------- web ----------
FROM runtime AS web
EXPOSE 3000
CMD ["sh", "/app/docker/entrypoint-web.sh"]

# ---------- worker ----------
FROM runtime AS worker
CMD ["sh", "/app/docker/entrypoint-worker.sh"]
