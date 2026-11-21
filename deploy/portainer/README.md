# Deploy Portainer — Ambiental System

Stack Compose para a mesma VPS do **licencas** (nginx do licencas nas portas 80/443).  
Não use `docker-compose.gateway.yml` neste cenário.

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `ambiental-stack.portainer.yml` | Colar no Portainer (Web editor) |
| `../../docker/env.example` | Referência das variáveis |
| `../../docker/README-GATEWAY.txt` | Proxy nginx + certbot (cenário licencas) |

## 1. Build e push das imagens

Na máquina local (raiz do monorepo):

```bash
export TAG=v0.0.1

docker build -f docker/Dockerfile.api \
  -t michaelsoliveira/ambiental_api:$TAG .

docker build -f docker/Dockerfile.financeiro \
  --build-arg NEXT_PUBLIC_API_URL=https://api-financeiro.bomanejo.com.br \
  --build-arg NEXT_PUBLIC_APP_URL=https://financeiro.bomanejo.com.br \
  -t michaelsoliveira/ambiental_financeiro:$TAG .

docker push michaelsoliveira/ambiental_api:$TAG
docker push michaelsoliveira/ambiental_financeiro:$TAG
```

`NEXT_PUBLIC_*` do financeiro entra no **build** (Next standalone). Em cada release com URL diferente, reconstrua o financeiro.

## 2. Rede MinIO

Confirme que a rede do MinIO do licencas existe:

```bash
docker network ls | grep app_network
```

Se o nome for outro, defina `MINIO_DOCKER_NETWORK` no Portainer.

## 3. Criar o stack no Portainer

1. **Stacks** → **Add stack**
2. **Name:** `ambiental`
3. **Web editor** → cole `ambiental-stack.portainer.yml`
4. Em **Environment variables**, preencha no mínimo:

```env
IMAGE_TAG=v0.0.1
POSTGRES_PASSWORD=
JWT_SECRET=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CLIENT_REDIRECT_URI=https://financeiro.bomanejo.com.br/api/auth/callback
NEXT_PUBLIC_API_URL=https://api-financeiro.bomanejo.com.br
NEXT_PUBLIC_APP_URL=https://financeiro.bomanejo.com.br
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
EVOLUTION_API_GLOBAL_KEY=
```

5. **Deploy the stack**

## 4. Conectar o nginx do licencas

Para o proxy resolver `api` e `financeiro`:

```bash
docker network connect bomanejo_ambiental <nome_do_container_nginx>
```

Confirme os server blocks em `docker/nginx/merge-licencas-*.conf` (ver `docker/README-GATEWAY.txt`).

## 5. Seed (opcional)

```bash
docker exec -it $(docker ps -qf name=ambiental-api) /seed-api.sh
```

Ou:

```bash
docker exec -it $(docker ps -qf name=ambiental-api) \
  sh -c 'cd /app/apps/api && npm run db:seed:prod'
```

(O nome do container pode variar: confira com `docker ps`.)

## 6. Atualizar versão

1. Build/push com nova `TAG`
2. No Portainer, altere `IMAGE_TAG` e faça **Update the stack** (Pull and redeploy)

## Diferença vs `docker-compose.prod.yml`

| | `docker-compose.prod.yml` | Portainer YAML |
|--|---------------------------|----------------|
| Imagens | `build:` no servidor | pull do registry |
| Secrets | `.env` no disco | Environment variables do Portainer |
| Gateway | opcional via `docker-compose.gateway.yml` | não inclui (usa nginx licencas) |
