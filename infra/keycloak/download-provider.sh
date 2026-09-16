#!/usr/bin/env bash
# Baixa o SPI keycloak-user-migration (Keycloak 26).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="$DIR/providers/keycloak-rest-provider-6.0.0.jar"
URL="https://github.com/daniel-frak/keycloak-user-migration/releases/download/6.0.0/keycloak-rest-provider-6.0.0.jar"

mkdir -p "$DIR/providers"
if [[ -f "$DEST" ]]; then
  echo "Já existe: $DEST"
  exit 0
fi

echo "Baixando $URL"
curl -fsSL -o "$DEST" "$URL"
echo "OK: $DEST"
echo "Reinicie o Keycloak para carregar o JAR:"
echo "  docker compose -f $DIR/docker-compose.yml up -d --force-recreate"
