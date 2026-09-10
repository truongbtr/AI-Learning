#!/bin/sh
# Shared by the container entrypoints: point DATABASE_URL at the compose "postgres" service.
# .env (env_file) carries the host-side DATABASE_URL; inside Docker we rebuild it from POSTGRES_*.
if [ -n "$DATABASE_HOST" ]; then
  : "${POSTGRES_USER:=mtct}"
  : "${POSTGRES_PASSWORD:=mtct}"
  : "${POSTGRES_DB:=mtct}"
  export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DATABASE_HOST}:5432/${POSTGRES_DB}"
fi
