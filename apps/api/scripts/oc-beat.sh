#!/usr/bin/env sh
set -eu
echo "oc-beat: aguardando Redis em ${REDIS_URL:-?}..."
ATTEMPT=1
MAX="${OC_REDIS_WAIT_ATTEMPTS:-30}"
while [ "$ATTEMPT" -le "$MAX" ]; do
  if node -e "const Redis=require('ioredis'); const r=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,connectTimeout:2000}); r.ping().then(()=>{console.log('ok'); r.quit(); process.exit(0)}).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "oc-beat: Redis OK (tentativa ${ATTEMPT})"
    break
  fi
  echo "oc-beat: Redis indisponível — tentativa ${ATTEMPT}/${MAX}"
  ATTEMPT=$((ATTEMPT + 1))
  sleep 2
done
if [ "$ATTEMPT" -gt "$MAX" ]; then
  echo "oc-beat: ERRO — Redis não respondeu." >&2
  exit 1
fi
exec node /app/apps/api/dist/oc-beat.js
