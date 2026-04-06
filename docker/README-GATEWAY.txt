Gateway HTTPS — bomanejo.com.br (financeiro)
==============================================

Domínios
--------
  • https://api-financeiro.bomanejo.com.br  → container Docker "api" (porta interna 3333)
  • https://financeiro.bomanejo.com.br      → container "financeiro" (porta interna 3000)

DNS
---
  Registros A (ou AAAA) para api-financeiro e financeiro apontando para o IP da VPS.

Variáveis (.env)
----------------
  NEXT_PUBLIC_API_URL=https://api-financeiro.bomanejo.com.br
  GITHUB_OAUTH_CLIENT_REDIRECT_URI=<exatamente como no GitHub OAuth App>
  INTERNAL_API_URL=http://api:3333 fica no compose (rede interna; não altere para URL pública)

Cenário 1 — VPS só com ambiental (nginx deste repositório nas portas 80/443)
----------------------------------------------------------------------------
  1. cp docker/env.example .env  e ajuste segredos/URLs.
  2. Suba stack com gateway:
       docker compose -f docker-compose.prod.yml -f docker-compose.gateway.yml --env-file .env up -d --build
     ou: pnpm docker:prod:gateway
  3. Primeiro certificado Let's Encrypt (HTTP-01):
       mkdir -p docker/certbot/conf/letsencrypt docker/certbot/www
       CERTBOT_EMAIL=voce@email.com bash docker/setup-certbot-financeiro.sh
  4. Ative TLS no nginx:
       cp docker/nginx/default.ssl.conf docker/nginx/default.conf
       docker compose -f docker-compose.prod.yml -f docker-compose.gateway.yml exec nginx nginx -s reload
  5. O serviço "certbot" no compose renova em loop; o nginx recarrega periodicamente.

Cenário 2 — Mesma VPS do licencas (nginx deles já usa 80 e 443)
---------------------------------------------------------------
  NÃO suba docker-compose.gateway.yml (evita dois nginx na mesma porta).

  1. Suba só a aplicação:
       docker compose -f docker-compose.prod.yml --env-file .env up -d --build
  2. Inclua no nginx do licencas os arquivos em docker/nginx/:
       • merge-licencas-http80.conf  (porta 80 — ACME + redirect)
       • merge-licencas-server-blocks.conf (443 — proxy para api e financeiro)
     Use o mesmo volume de certbot do licencas (/var/www/certbot e letsencrypt) ou equivalente.
  3. Emita o certificado SAN (dois subdomínios), por exemplo com certbot webroot apontando
     para o mesmo www que o nginx do licencas já expõe.
  4. Conecte o container nginx do licencas à rede onde estão api e financeiro:
       docker network connect bomanejo_ambiental <nome_do_container_nginx>
     (confira o nome com: docker ps.)
     Assim o proxy_pass http://api:3333 e http://financeiro:3000 passam a resolver.

Arquivos úteis
--------------
  docker/nginx/default.conf          — bootstrap (só HTTP, ACME; 503 no resto até ter SSL)
  docker/nginx/default.ssl.conf      — produção com TLS (após certbot)
  docker/setup-certbot-financeiro.sh — primeiro certificado SAN (api-financeiro + financeiro)
