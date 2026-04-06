#!/bin/sh
set -e
cd /app/apps/api

if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  prisma migrate deploy --schema=./prisma/schema.prisma
fi

exec node dist/http/server.js
