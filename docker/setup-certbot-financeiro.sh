#!/usr/bin/env bash
set -euo pipefail

# Emite um certificado SAN para api-financeiro + financeiro (mesmo cert usado nos dois server blocks SSL).
# Pré-requisito: DNS A/AAAA dos dois subdomínios apontando para esta VPS;
# nginx no ar com default.conf servindo /.well-known/acme-challenge/ (bootstrap ou merge no licencas).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p docker/certbot/conf/letsencrypt docker/certbot/www

EMAIL="${CERTBOT_EMAIL:?Defina CERTBOT_EMAIL no ambiente}"

docker compose -f docker-compose.prod.yml -f docker-compose.gateway.yml run --rm certbot_init certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos --no-eff-email \
  -d api-financeiro.bomanejo.com.br \
  -d financeiro.bomanejo.com.br

echo "Certificado em /etc/letsencrypt/live/api-financeiro.bomanejo.com.br/"
echo "Próximo passo: cp docker/nginx/default.ssl.conf docker/nginx/default.conf"
echo "Depois: docker compose -f docker-compose.prod.yml -f docker-compose.gateway.yml exec nginx nginx -s reload"
