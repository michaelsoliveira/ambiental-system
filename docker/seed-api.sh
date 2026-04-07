#!/bin/sh
# Uso no container da API (imagem Docker): não há pnpm nem package.json na raiz de /app.
# Requer DATABASE_URL (ex.: vinda do docker-compose).
set -e
cd /app/apps/api
exec prisma db seed
