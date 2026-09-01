#!/bin/sh
set -e
cd /app/apps/api

ROLE="${OC_PROCESS:-api}"

if [ "$ROLE" = "api" ] && [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  prisma migrate deploy --schema=./prisma/schema.prisma
fi

case "$ROLE" in
  worker)
    exec node dist/oc-worker.js
    ;;
  beat)
    exec node dist/oc-beat.js
    ;;
  *)
    exec node dist/server.js
    ;;
esac
